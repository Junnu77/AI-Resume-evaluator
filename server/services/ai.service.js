const { GoogleGenerativeAI } = require('@google/generative-ai');
const { EvaluationOutputSchema, geminiResponseSchema } = require('../schemas/evaluation.schema');
const { generateEmbedding, hashResumeText, hashNormalizedText, findCachedEvaluation, storeCachedEvaluation } = require('./embedding.service');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Semantic cache similarity threshold (configurable via .env)
const CACHE_THRESHOLD = parseFloat(process.env.SEMANTIC_CACHE_THRESHOLD) || 0.98;

/**
 * Builds the prompt to be sent to the AI.
 */
const buildPrompt = (resumeText, jobTitle, companyName, jobDescription) => {
  const jdContext = jobDescription 
    ? `Job Description provided by user:\n${jobDescription}`
    : `The user did not provide a job description. As an expert, please infer the standard, high-level requirements, skills, and responsibilities for a "${jobTitle}" role at ${companyName || 'a top tech company'}, and evaluate the resume against those inferred standard requirements.`;

  return `
    You are an expert ATS (Applicant Tracking System) and hiring manager at ${companyName || 'a top tech company'}.
    Please analyze the following resume against the role of "${jobTitle}".
    
    ${jdContext}

    Resume:
    ${resumeText}

    Return your response strictly in the following JSON format:
    {
      "overallScore": number (0-100),
      "atsScore": number (0-100),
      "keywordMatch": number (0-100),
      "missingSkills": ["string array"],
      "improvements": ["string array"],
      "sectionFeedback": {
        "summary": "string feedback",
        "experience": "string feedback",
        "skills": "string feedback",
        "projects": "string feedback",
        "formatting": "string feedback"
      }
    }
  `;
};

/**
 * Calls Gemini API with structured output enforcement and Zod validation.
 * Retries up to maxRetries times on schema validation failure, appending
 * the validation errors as correction context to the prompt.
 */
const callGeminiWithValidation = async (prompt, maxRetries = 2) => {
  let lastError = null;
  let currentPrompt = prompt;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`🔄 Retry attempt ${attempt}/${maxRetries} — appending schema correction context...`);
      }

      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: geminiResponseSchema,
        }
      });

      const result = await model.generateContent(currentPrompt);
      const responseText = result.response.text();

      // Parse JSON (structured outputs should eliminate markdown fences,
      // but we keep a minimal safety strip just in case)
      let parsed;
      try {
        parsed = JSON.parse(responseText);
      } catch (parseError) {
        const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleaned);
      }

      // Validate through Zod schema
      const validated = EvaluationOutputSchema.safeParse(parsed);

      if (validated.success) {
        if (attempt > 0) {
          console.log(`✅ Schema validation passed on retry attempt ${attempt}.`);
        }
        return validated.data;
      }

      // Validation failed — prepare correction context for retry
      const errorMessages = validated.error.issues
        .map(issue => `- Field "${issue.path.join('.')}": ${issue.message}`)
        .join('\n');
      
      lastError = validated.error;
      console.warn(`⚠️ Zod validation failed (attempt ${attempt + 1}):`, errorMessages);

      // Append correction context for next attempt
      currentPrompt = `${prompt}\n\nIMPORTANT CORRECTION: Your previous response had the following schema violations. Please fix them:\n${errorMessages}\n\nEnsure all required fields are present and have the correct data types.`;

    } catch (error) {
      console.error(`Gemini API Error (attempt ${attempt + 1}):`, error.message);
      lastError = error;
      
      // Don't retry on non-validation errors (API failures, rate limits, etc.)
      if (attempt === maxRetries) {
        throw new Error('AI Evaluation Failed after retries: ' + error.message);
      }
    }
  }

  // All retries exhausted with validation errors
  throw new Error('AI Evaluation Failed: Output did not conform to required schema after ' + (maxRetries + 1) + ' attempts. Last error: ' + JSON.stringify(lastError?.issues || lastError?.message));
};

/**
 * Evaluates the resume using Google Gemini AI with:
 * 1. Hybrid semantic caching (exact resume hash + semantic JD similarity)
 * 2. Structured output enforcement via Gemini responseSchema
 * 3. Zod validation with auto-retry on schema failures
 * 
 * @param {string} prompt - The full evaluation prompt
 * @param {string} resumeText - Raw resume text (for cache hashing)
 * @param {string} jobDescription - Job description text (for semantic embedding)
 * @param {object} metadata - { jobTitle, companyName } for cache storage
 * @returns {object} { evaluationData, cacheMetadata }
 */
const evaluateResume = async (prompt, resumeText, jobDescription, metadata = {}) => {
  console.log('Preparing to evaluate resume...');

  // ─── Step 1: Hybrid Cache Lookup ───────────────────────────────────
  // Exact SHA-256 hash on resume text + semantic similarity on JD embedding
  try {
    const resumeHash = hashResumeText(resumeText);
    
    // Build the text to embed for JD (use job title as fallback when no JD provided)
    const jdTextForEmbedding = jobDescription || `${metadata.jobTitle || 'General'} role at ${metadata.companyName || 'a top tech company'}`;
    const jdEmbedding = await generateEmbedding(jdTextForEmbedding);
    const jdHash = hashNormalizedText(jdTextForEmbedding);

    // Search cache: exact resume match AND (semantically similar JD OR matching JD hash)
    const cacheHit = await findCachedEvaluation(resumeHash, jdEmbedding, jdHash, CACHE_THRESHOLD);

    if (cacheHit) {
      console.log('✅ Serving evaluation from Semantic Cache (hybrid match).');
      return {
        evaluationData: cacheHit.result,
        cacheMetadata: { cached: true, similarity: cacheHit.similarity },
      };
    }

    // ─── Step 2: Call Gemini with Schema Enforcement ──────────────────
    console.log('Cache miss — sending live API request to Gemini...');
    const evaluationData = await callGeminiWithValidation(prompt);

    // ─── Step 3: Store in Semantic Cache ─────────────────────────────
    await storeCachedEvaluation(resumeHash, jdEmbedding, jdHash, evaluationData, metadata);

    return {
      evaluationData,
      cacheMetadata: { cached: false, similarity: null },
    };

  } catch (cacheError) {
    // If cache operations fail, fall through to direct API call
    console.warn('Cache operation failed, falling back to direct API call:', cacheError.message);
    
    const evaluationData = await callGeminiWithValidation(prompt);
    return {
      evaluationData,
      cacheMetadata: { cached: false, similarity: null },
    };
  }
};

module.exports = {
  buildPrompt,
  evaluateResume,
};

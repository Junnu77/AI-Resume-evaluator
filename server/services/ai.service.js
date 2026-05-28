const { GoogleGenerativeAI } = require('@google/generative-ai');
const NodeCache = require('node-cache');
const crypto = require('crypto');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize Cache - store evaluations for 24 hours to save API calls
const evaluationCache = new NodeCache({ stdTTL: 86400 });

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
 * Generates an MD5 hash of a string to use as a lightweight cache key.
 */
const generateCacheKey = (prompt) => {
  return crypto.createHash('md5').update(prompt).digest('hex');
};

/**
 * Evaluates the resume using Google Gemini AI, with context caching.
 */
const evaluateResume = async (prompt) => {
  console.log('Preparing to send prompt to Gemini AI...');
  
  // 1. Check cache first for this exact same prompt context
  const cacheKey = generateCacheKey(prompt);
  const cachedResponse = evaluationCache.get(cacheKey);
  
  if (cachedResponse) {
    console.log('✅ Serving evaluation from Context Cache to save API limits.');
    return cachedResponse;
  }

  // 2. Not in cache, call Gemini API
  console.log('Sending live API request to Gemini...');
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      }
    });

    const result = await model.generateContent(prompt);
    let responseText = result.response.text();
    
    // Clean Markdown formatting from the response if present
    responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();

    // Parse the JSON strictly returned by Gemini
    const evaluationData = JSON.parse(responseText);

    // 3. Save to cache
    evaluationCache.set(cacheKey, evaluationData);
    
    return evaluationData;

  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('AI Evaluation Failed: ' + error.message);
  }
};

module.exports = {
  buildPrompt,
  evaluateResume,
};

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { JudgeOutputSchema, geminiJudgeSchema } = require('../schemas/judge.schema');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Builds the judge prompt that evaluates the quality of an AI-generated analysis.
 * The judge checks for two metrics:
 * 1. Faithfulness — are all claims in the analysis supported by the source document?
 * 2. Relevance — does the analysis directly address the evaluation criteria for this role?
 */
const buildJudgePrompt = (resumeText, generatedAnalysis, jobTitle) => {
  const analysisStr = typeof generatedAnalysis === 'string' 
    ? generatedAnalysis 
    : JSON.stringify(generatedAnalysis, null, 2);

  return `
You are a strict Quality Assurance judge for AI-generated resume evaluations.
Your task is to evaluate the quality of a generated analysis against the original source document.

You must check exactly TWO metrics:

1. **Faithfulness**: Verify that EVERY claim, score, and piece of feedback in the generated analysis is directly supported by information present in the source resume text. If the analysis mentions skills, experiences, or qualifications that are NOT present in the resume, it is unfaithful (hallucinated).

2. **Relevance**: Verify that the generated analysis directly addresses the evaluation criteria for the "${jobTitle}" role. The analysis should score the resume against relevant job requirements, not provide generic feedback unrelated to the target position.

---

**Source Resume Text:**
${resumeText}

---

**Generated Analysis to Judge:**
${analysisStr}

---

**Instructions:**
- For faithfulness: Return true if ALL claims are supported by the resume. Return false if ANY claim is hallucinated.
- For relevance: Return true if the analysis is relevant to the "${jobTitle}" role. Return false if it's off-topic.
- Provide clear, specific reasoning for each metric (cite specific examples of hallucinations or irrelevant content if found).
- Calculate an overallTrust score from 0-100 based on both metrics. If both pass, score 80-100. If one fails, score 30-60. If both fail, score 0-30.
`;
};

/**
 * Judges the quality of an AI-generated resume evaluation.
 * Returns faithfulness, relevance, and an overall trust score.
 */
const judgeEvaluation = async (resumeText, generatedAnalysis, jobTitle) => {
  console.log('🔍 Running Eval-on-Eval quality check...');

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: geminiJudgeSchema,
      },
    });

    const prompt = buildJudgePrompt(resumeText, generatedAnalysis, jobTitle);
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const parsed = JSON.parse(responseText);

    // Validate through Zod
    const validated = JudgeOutputSchema.safeParse(parsed);

    if (!validated.success) {
      console.warn('⚠️ Judge output failed Zod validation:', validated.error.issues);
      // Return a conservative default
      return {
        faithfulness: { score: false, reasoning: 'Judge output could not be validated.' },
        relevance: { score: false, reasoning: 'Judge output could not be validated.' },
        overallTrust: 50,
      };
    }

    console.log(`✅ Judge verdict — Faithful: ${validated.data.faithfulness.score}, Relevant: ${validated.data.relevance.score}, Trust: ${validated.data.overallTrust}`);
    return validated.data;

  } catch (error) {
    console.error('Judge evaluation error:', error.message);
    // Fail open — don't block the evaluation pipeline
    return {
      faithfulness: { score: true, reasoning: 'Judge evaluation failed; defaulting to trust.' },
      relevance: { score: true, reasoning: 'Judge evaluation failed; defaulting to trust.' },
      overallTrust: 50,
    };
  }
};

module.exports = {
  judgeEvaluation,
  buildJudgePrompt,
};

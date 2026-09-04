const Evaluation = require('../models/evaluation.model');
const Resume = require('../models/resume.model');
const { buildPrompt, evaluateResume } = require('../services/ai.service');
const { judgeEvaluation } = require('../services/judge.service');

/**
 * Rebuilds the evaluation prompt with judge feedback injected,
 * instructing the LLM to correct specific hallucinations or irrelevant content.
 */
const buildCorrectedPrompt = (originalPrompt, judgeResult) => {
  const corrections = [];

  if (!judgeResult.faithfulness.score) {
    corrections.push(
      `FAITHFULNESS ISSUE: The previous evaluation hallucinated the following: "${judgeResult.faithfulness.reasoning}". ` +
      `Rewrite the evaluation and ensure all claims are directly supported by the source resume text. ` +
      `Do NOT invent skills, experiences, or qualifications not present in the resume.`
    );
  }

  if (!judgeResult.relevance.score) {
    corrections.push(
      `RELEVANCE ISSUE: ${judgeResult.relevance.reasoning}. ` +
      `Ensure the evaluation directly addresses the job role requirements and provides relevant scoring.`
    );
  }

  return `${originalPrompt}\n\n` +
    `CRITICAL CORRECTION REQUIRED:\n` +
    `A quality review of your previous response found the following issues:\n` +
    `${corrections.join('\n')}\n\n` +
    `Please generate a corrected evaluation that addresses these specific issues.`;
};

// @desc    Evaluate a resume against a job description
// @route   POST /api/evaluations/evaluate
// @access  Private
const createEvaluation = async (req, res, next) => {
  try {
    const { resumeId, jobTitle, companyName, jobDescription } = req.body;

    // Validate input
    if (!resumeId || !jobTitle) {
      res.status(400);
      throw new Error('Please provide at least a resume and a job title');
    }

    // Fetch the stored resume to get its parsed text
    const resume = await Resume.findById(resumeId);
    
    if (!resume) {
      res.status(404);
      throw new Error('Resume not found');
    }

    // Check ownership
    if (resume.userId.toString() !== req.user.id) {
      res.status(401);
      throw new Error('Not authorized to access this resume');
    }

    // ─── Step 1: Build prompt & run primary evaluation ────────────────
    const prompt = buildPrompt(resume.parsedText, jobTitle, companyName, jobDescription);

    // evaluateResume now returns { evaluationData, cacheMetadata }
    // It handles semantic caching internally (hybrid: exact resume hash + JD embedding)
    let { evaluationData: aiResult, cacheMetadata } = await evaluateResume(
      prompt, 
      resume.parsedText, 
      jobDescription || '', 
      { jobTitle, companyName }
    );

    // ─── Step 2: Eval-on-Eval Judge ──────────────────────────────────
    // Skip judge if result was served from cache (already judged on original run)
    let qualityMetrics = null;

    if (!cacheMetadata.cached) {
      console.log('🔍 Running Eval-on-Eval quality judge...');
      const judgeResult = await judgeEvaluation(resume.parsedText, aiResult, jobTitle);
      
      // ─── Step 3: Smart Single Retry (if judge flags issues) ─────────
      const isUnfaithful = !judgeResult.faithfulness.score;
      const isIrrelevant = !judgeResult.relevance.score;

      if (isUnfaithful || isIrrelevant) {
        console.log(`⚠️ Judge flagged issues — Faithful: ${judgeResult.faithfulness.score}, Relevant: ${judgeResult.relevance.score}`);
        console.log('🔄 Attempting single corrective retry with judge feedback injected...');

        // Build corrected prompt with judge reasoning injected
        const correctedPrompt = buildCorrectedPrompt(prompt, judgeResult);

        try {
          // Single retry with feedback-injected prompt
          const retryResult = await evaluateResume(
            correctedPrompt, 
            resume.parsedText, 
            jobDescription || '', 
            { jobTitle, companyName }
          );
          
          // Re-judge the corrected result
          const retryJudgeResult = await judgeEvaluation(resume.parsedText, retryResult.evaluationData, jobTitle);

          // Use the retry result regardless (but store the new judge scores)
          aiResult = retryResult.evaluationData;
          cacheMetadata = retryResult.cacheMetadata;
          qualityMetrics = {
            faithfulness: retryJudgeResult.faithfulness,
            relevance: retryJudgeResult.relevance,
            overallTrust: retryJudgeResult.overallTrust,
          };

          console.log(`✅ Retry complete — Trust: ${retryJudgeResult.overallTrust}, Faithful: ${retryJudgeResult.faithfulness.score}, Relevant: ${retryJudgeResult.relevance.score}`);

        } catch (retryError) {
          // Retry failed — use original result with original judge scores (Option B fallback)
          console.warn('Retry failed, using original result with trust flags:', retryError.message);
          qualityMetrics = {
            faithfulness: judgeResult.faithfulness,
            relevance: judgeResult.relevance,
            overallTrust: judgeResult.overallTrust,
          };
        }
      } else {
        // Judge passed on first attempt — use those scores
        qualityMetrics = {
          faithfulness: judgeResult.faithfulness,
          relevance: judgeResult.relevance,
          overallTrust: judgeResult.overallTrust,
        };
        console.log(`✅ Judge approved — Trust: ${judgeResult.overallTrust}`);
      }
    } else {
      // Cached result — set default trust (was judged on original evaluation)
      console.log('⚡ Result from cache — skipping judge (already verified on original run).');
    }

    // ─── Step 4: Save the evaluation result in the database ──────────
    const evaluation = await Evaluation.create({
      userId: req.user.id,
      resumeId: resume._id,
      jobTitle,
      companyName,
      jobDescription,
      score: aiResult.overallScore,
      atsScore: aiResult.atsScore,
      keywordMatch: aiResult.keywordMatch,
      suggestions: aiResult.improvements,
      missingSkills: aiResult.missingSkills,
      sectionFeedback: aiResult.sectionFeedback,
      qualityMetrics: qualityMetrics || undefined,
      cacheMetadata: {
        cached: cacheMetadata.cached,
        similarity: cacheMetadata.similarity,
      },
    });

    res.status(201).json({
      message: 'Evaluation completed successfully',
      evaluation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all evaluations for the logged-in user
// @route   GET /api/evaluations
// @access  Private
const getEvaluations = async (req, res, next) => {
  try {
    const evaluations = await Evaluation.find({ userId: req.user.id })
      .populate('resumeId', 'fileName')
      .sort({ createdAt: -1 });
      
    res.status(200).json(evaluations);
  } catch (error) {
    next(error);
  }
};

// @desc    Get a specific evaluation by ID
// @route   GET /api/evaluations/:id
// @access  Private
const getEvaluationById = async (req, res, next) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id)
      .populate('resumeId', 'fileName');

    if (!evaluation) {
      res.status(404);
      throw new Error('Evaluation not found');
    }

    // Check ownership
    if (evaluation.userId.toString() !== req.user.id) {
      res.status(401);
      throw new Error('Not authorized to access this evaluation');
    }

    res.status(200).json(evaluation);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEvaluation,
  getEvaluations,
  getEvaluationById,
};

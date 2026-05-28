const Evaluation = require('../models/evaluation.model');
const Resume = require('../models/resume.model');
const { buildPrompt, evaluateResume } = require('../services/ai.service');

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

    // Prepare the prompt for the AI service
    const prompt = buildPrompt(resume.parsedText, jobTitle, companyName, jobDescription);

    // Call the AI Service (currently mocked, setup for future real API)
    const aiResult = await evaluateResume(prompt);

    // Save the evaluation result in the database
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

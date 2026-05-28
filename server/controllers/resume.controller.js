const Resume = require('../models/resume.model');
const { extractTextFromPDF } = require('../services/pdf.service');

// @desc    Upload a resume and extract text
// @route   POST /api/resumes/upload
// @access  Private
const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('Please upload a file');
    }

    // Extract text from the uploaded PDF
    const parsedText = await extractTextFromPDF(req.file.path);

    // Save resume to DB
    const resume = await Resume.create({
      userId: req.user.id,
      fileName: req.file.originalname,
      parsedText: parsedText,
    });

    res.status(201).json({
      message: 'Resume uploaded successfully',
      resume: {
        _id: resume._id,
        fileName: resume.fileName,
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's uploaded resumes
// @route   GET /api/resumes
// @access  Private
const getResumes = async (req, res, next) => {
  try {
    const resumes = await Resume.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(resumes);
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single resume by ID
// @route   GET /api/resumes/:id
// @access  Private
const getResumeById = async (req, res, next) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      res.status(404);
      throw new Error('Resume not found');
    }

    // Check if user owns the resume
    if (resume.userId.toString() !== req.user.id) {
      res.status(401);
      throw new Error('User not authorized to access this resume');
    }

    res.status(200).json(resume);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadResume,
  getResumes,
  getResumeById,
};

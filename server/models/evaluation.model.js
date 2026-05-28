const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: true,
  },
  jobTitle: {
    type: String,
    required: true,
  },
  companyName: {
    type: String,
  },
  jobDescription: {
    type: String,
    required: false,
  },
  score: {
    type: Number,
    required: true,
  },
  atsScore: {
    type: Number,
    required: true,
  },
  keywordMatch: {
    type: Number,
    required: true,
  },
  suggestions: [{
    type: String,
  }],
  missingSkills: [{
    type: String,
  }],
  sectionFeedback: {
    summary: String,
    experience: String,
    skills: String,
    projects: String,
    formatting: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Evaluation', evaluationSchema);

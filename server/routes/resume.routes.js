const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload.middleware');
const { protect } = require('../middleware/auth.middleware');
const {
  uploadResume,
  getResumes,
  getResumeById,
} = require('../controllers/resume.controller');

// All resume routes are protected
router.use(protect);

router.post('/upload', upload.single('resume'), uploadResume);
router.get('/', getResumes);
router.get('/:id', getResumeById);

module.exports = router;

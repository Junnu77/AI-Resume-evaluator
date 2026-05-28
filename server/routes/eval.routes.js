const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { protect } = require('../middleware/auth.middleware');
const {
  createEvaluation,
  getEvaluations,
  getEvaluationById,
} = require('../controllers/eval.controller');

// All evaluation routes are protected
router.use(protect);

// Rate limiter for rigorous AI requests
const evaluateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 evaluations per windowMs
  message: { message: 'Too many evaluation requests made from this IP. Please try again after 15 minutes.' }
});

router.post('/evaluate', evaluateLimiter, createEvaluation);
router.get('/', getEvaluations);
router.get('/:id', getEvaluationById);

module.exports = router;

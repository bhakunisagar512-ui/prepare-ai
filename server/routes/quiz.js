const express = require('express');
const router = express.Router();
const { generateQuizHandler, generateFeedbackHandler } = require('../controllers/quizController');
const auth = require('../middleware/auth');

router.post('/generate', auth, generateQuizHandler);
router.post('/feedback', auth, generateFeedbackHandler);

module.exports = router;
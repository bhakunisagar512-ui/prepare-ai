const express = require('express');
const router = express.Router();
const { generateQuizHandler } = require('../controllers/quizController');
const auth = require('../middleware/auth');

router.post('/generate', auth, generateQuizHandler);

module.exports = router;
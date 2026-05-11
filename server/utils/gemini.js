const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateQuiz = async (subject, topic, difficulty) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
    Generate exactly 10 multiple choice questions about "${topic}" in "${subject}" for a "${difficulty}" difficulty level.
    
    Return ONLY a valid JSON array with no extra text, in this exact format:
    [
      {
        "question": "Question text here?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "answer": "Correct option text here",
        "explanation": "Brief explanation here"
      }
    ]
    
    Rules:
    - Exactly 10 questions
    - Exactly 4 options each
    - answer must exactly match one of the options
    - No markdown, no backticks, just raw JSON array
  `;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // strip any accidental markdown fences
  const clean = text.replace(/```json|```/g, '').trim();
  const questions = JSON.parse(clean);
  return questions;
};

module.exports = { generateQuiz };
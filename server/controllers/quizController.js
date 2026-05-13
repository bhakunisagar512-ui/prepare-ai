const flattenSubject = (data) => {
  const flat = [];
  Object.entries(data).forEach(([topic, questions]) => {
    questions.forEach(q => flat.push({ ...q, topic }));
  });
  return flat;
};

const allQuestions = {
  DBMS: flattenSubject(require('../data/dbms')),
  OOPS: flattenSubject(require('../data/oops')),
  OS:   flattenSubject(require('../data/os')),
  CN:   flattenSubject(require('../data/cn')),
  Java: flattenSubject(require('../data/java')),
};

const SUBJECTS = ['OOPS', 'DBMS', 'OS', 'CN', 'Java'];
const QUESTIONS_PER_SUBJECT = 2;

exports.generateQuizHandler = async (req, res) => {
  try {
    const { setIndex = 0, topicFilters = {}, subjects = ['OOPS', 'DBMS', 'OS', 'CN', 'Java'] } = req.body;

    let questions = [];

    subjects.forEach(subject => {
      if (!allQuestions[subject]) return;

      let pool = allQuestions[subject];
      const filter = topicFilters[subject];

      if (filter && filter.length > 0) {
        const filtered = pool.filter(q => filter.includes(q.topic));
        if (filtered.length > 0) pool = filtered;
      }

      const start = (setIndex * QUESTIONS_PER_SUBJECT) % pool.length;
      const q1 = pool[start];
      const q2 = pool[(start + 1) % pool.length];

      questions.push({ ...q1, subject }, { ...q2, subject });
    });

    while (questions.length < 10) {
      const subject = subjects[0];
      const pool = allQuestions[subject];
      const extra = pool[questions.length % pool.length];
      questions.push({ ...extra, subject });
    }

    res.json({ setIndex, totalSets: 50, nextSetIndex: setIndex + 1, questions });

  } catch (err) {
    res.status(500).json({ message: 'Quiz generation failed', error: err.message });
  }
};

exports.generateFeedbackHandler = async (req, res) => {
  const { results } = req.body;

  const score = results.filter(r => r.isCorrect).length;
  const percentage = Math.round((score / results.length) * 100);
  const wrongTopics = [...new Set(results.filter(r => !r.isCorrect).map(r => r.topic))];
  const rightTopics = [...new Set(results.filter(r => r.isCorrect).map(r => r.topic))];

  const prompt = `
    A student just completed a technical interview preparation quiz.
    Score: ${score}/${results.length} (${percentage}%)
    Strong topics: ${rightTopics.join(', ') || 'none'}
    Weak topics: ${wrongTopics.join(', ') || 'none'}
    
    Write a short, encouraging and specific feedback paragraph (4-5 sentences) for this student.
    Mention their strong topics, weak topics, and give one concrete study tip.
    Be direct and motivating. No bullet points, just a paragraph.
  `;

  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const feedback = result.response.text();
    res.json({ feedback });
  } catch (err) {
    res.status(500).json({ message: 'Feedback generation failed' });
  }
};

exports.generateCustomHandler = async (req, res) => {
  const { subject } = req.body;
  if (!subject) return res.status(400).json({ message: 'Subject is required' });

  const prompt = `
    Generate exactly 10 multiple choice questions about "${subject}".
    
    Return ONLY a valid JSON array with no extra text:
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

  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const clean = text.replace(/```json|```/g, '').trim();
    const questions = JSON.parse(clean);
    res.json({ subject, questions });
  } catch (err) {
    res.status(500).json({ message: 'Custom subject generation failed', error: err.message });
  }
};
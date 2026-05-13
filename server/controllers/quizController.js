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
    const { subject, topic, difficulty } = req.body;

    if (!subject || !topic || !difficulty) {
      return res.status(400).json({ message: 'Subject, topic and difficulty are required' });
    }

    const subjectPool = allQuestions[subject];
    if (!subjectPool) {
      return res.status(400).json({ message: 'Invalid subject' });
    }

    let pool = subjectPool.filter(q => q.topic === topic);
    if (pool.length === 0) pool = subjectPool;

    const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, 10);

    res.json({
      subject,
      topic,
      difficulty,
      usedFallback: true,
      questions: shuffled,
    });

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
const { generateQuiz } = require('../utils/gemini');

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

const getFallbackQuestions = (subject, topic) => {
  const subjectData = fallbackData[subject];
  if (!subjectData) return null;

  const topicQuestions = subjectData[topic];
  if (!topicQuestions) return null;

  // shuffle and return 10
  return topicQuestions.sort(() => Math.random() - 0.5).slice(0, 10);
};

exports.generateQuizHandler = async (req, res) => {
  const { subject, topic, difficulty } = req.body;

  if (!subject || !topic || !difficulty) {
    return res.status(400).json({ message: 'Subject, topic and difficulty are required' });
  }

  let questions = null;
  let usedFallback = false;

  // try Gemini first
  try {
    console.log(`Trying Gemini for ${subject} → ${topic} → ${difficulty}`);
    questions = await generateQuiz(subject, topic, difficulty);
    console.log('Gemini success');
  } catch (err) {
    console.log('Gemini failed, switching to fallback:', err.message);
  }

  // if Gemini failed, use fallback
  if (!questions) {
    questions = getFallbackQuestions(subject, topic);
    usedFallback = true;

    if (!questions) {
      return res.status(500).json({ 
        message: 'Could not generate quiz. Try a different topic.' 
      });
    }
    console.log('Fallback used successfully');
  }

  res.json({
    subject,
    topic,
    difficulty,
    usedFallback,
    questions
  });
};
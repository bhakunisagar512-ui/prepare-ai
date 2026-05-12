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
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import axios from 'axios';

export default function Quiz() {
  const { user, token } = useAuth();
  const { currentSetIndex, addAttempt } = useSession();
  const router = useRouter();

  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (router.isReady) fetchQuiz();
  }, [user, router.isReady]);

  const fetchQuiz = async () => {
    setLoading(true);
    setError('');
    try {
      const selectedTopics = router.query.topics
        ? router.query.topics.split(',')
        : [];

      const selectedSubjects = router.query.subjects
        ? router.query.subjects.split(',')
        : [];

      const customSubjects = router.query.custom
        ? router.query.custom.split(',').filter(Boolean)
        : [];

      // if nothing selected default to all standard subjects
      const standardSubjects = selectedSubjects.length > 0
        ? selectedSubjects
        : customSubjects.length === 0
          ? ['OOPS', 'DBMS', 'OS', 'CN', 'Java']
          : [];

      const topicFilters = {};
      if (selectedTopics.length > 0) {
        standardSubjects.forEach(subject => {
          const subjectTopics = getTopicsForSubject(subject);
          const matched = selectedTopics.filter(t => subjectTopics.includes(t));
          if (matched.length > 0) topicFilters[subject] = matched;
        });
      }

      let allQuestions = [];

      // fetch standard subjects from backend
      if (standardSubjects.length > 0) {
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/quiz/generate`,
          {
            setIndex: currentSetIndex,
            topicFilters,
            subjects: standardSubjects,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        allQuestions = res.data.questions.map(q => ({
          ...q,
          subject: q.subject || 'General',
          topic: q.topic || 'General',
        }));
      }

      // fetch custom subjects from Gemini
      for (const customSubject of customSubjects) {
        if (!customSubject) continue;
        try {
          const res = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/api/quiz/generate-custom`,
            { subject: customSubject },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const picked = res.data.questions.slice(0, 2).map(q => ({
            ...q,
            subject: customSubject,
            topic: customSubject,
          }));
          allQuestions.push(...picked);
        } catch (err) {
          console.log('Custom subject generation failed:', customSubject);
        }
      }

      // pad to 10 questions if needed
      if (allQuestions.length < 10) {
        const remaining = 10 - allQuestions.length;
        if (customSubjects.length > 0) {
          try {
            const res = await axios.post(
              `${process.env.NEXT_PUBLIC_API_URL}/api/quiz/generate-custom`,
              { subject: customSubjects[0] },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const extra = res.data.questions.slice(0, remaining).map(q => ({
              ...q,
              subject: customSubjects[0],
              topic: customSubjects[0],
            }));
            allQuestions.push(...extra);
          } catch (err) {
            console.log('Padding with custom subject failed');
          }
        } else if (standardSubjects.length > 0) {
          const res = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/api/quiz/generate`,
            { setIndex: currentSetIndex + 1, topicFilters: {}, subjects: [standardSubjects[0]] },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const extra = res.data.questions.slice(0, remaining).map(q => ({
            ...q,
            subject: q.subject || standardSubjects[0],
            topic: q.topic || 'General',
          }));
          allQuestions.push(...extra);
        }
      }

      setQuestions(allQuestions);
    } catch (err) {
      setError('Failed to load quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTopicsForSubject = (subject) => {
    const map = {
      OOPS: ['Classes and Objects', 'Inheritance', 'Polymorphism', 'Encapsulation', 'Abstraction'],
      DBMS: ['Joins', 'Normalization', 'Transactions', 'Indexing', 'SQL Basics'],
      OS: ['Process Management', 'Deadlocks', 'Scheduling', 'Memory Management', 'File Systems'],
      CN: ['OSI Model', 'TCP/IP', 'Routing', 'Network Security', 'IP Addressing'],
      Java: ['Collections', 'Exception Handling', 'Multithreading', 'Java 8 Features', 'String Handling'],
    };
    return map[subject] || [];
  };

  const handleSelect = (option) => {
    if (selected !== null) return;
    setSelected(option);
  };

  const handleNext = () => {
    const q = questions[current];
    const isCorrect = selected === q.answer;

    const newAnswers = [...answers, {
      question: q.question,
      options: q.options,
      selectedAnswer: selected,
      correctAnswer: q.answer,
      explanation: q.explanation,
      isCorrect,
      subject: q.subject,
      topic: q.topic,
    }];

    if (current + 1 < questions.length) {
      setAnswers(newAnswers);
      setCurrent(current + 1);
      setSelected(null);
    } else {
      const score = newAnswers.filter(a => a.isCorrect).length;
      const attempt = {
        results: newAnswers,
        score,
        totalQuestions: questions.length,
        percentage: Math.round((score / questions.length) * 100),
      };
      addAttempt(attempt);
      router.push({
        pathname: '/results',
        query: { score, total: questions.length },
      });
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center">
      <div className="text-white text-xl mb-2">Generating your quiz...</div>
      <p className="text-gray-500 text-sm">Fetching questions from AI</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center">
      <p className="text-red-400 mb-4">{error}</p>
      <button onClick={fetchQuiz} className="bg-blue-600 text-white px-6 py-2 rounded-xl">
        Try Again
      </button>
    </div>
  );

  const q = questions[current];
  const progress = (current / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Header */}
      <div className="bg-gray-900 px-6 py-4 flex justify-between items-center border-b border-gray-800">
        <h1 className="text-xl font-bold">Prepare<span className="text-blue-500">.ai</span></h1>
        <span className="text-gray-400 text-sm">Question {current + 1} of {questions.length}</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-800 h-1">
        <div className="bg-blue-500 h-1 transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl">

          {/* Subject & Topic Badge */}
          <div className="flex gap-2 mb-4">
            <span className="bg-blue-900 text-blue-300 text-xs px-3 py-1 rounded-full">{q.subject}</span>
            <span className="bg-gray-800 text-gray-400 text-xs px-3 py-1 rounded-full">{q.topic}</span>
          </div>

          {/* Question */}
          <h2 className="text-xl font-semibold mb-6 leading-relaxed">{q.question}</h2>

          {/* Options */}
          <div className="space-y-3 mb-8">
            {q.options.map((option, i) => {
              let style = 'bg-gray-900 border border-gray-700 hover:border-blue-500';
              if (selected !== null) {
                if (option === q.answer) style = 'bg-green-900 border border-green-500';
                else if (option === selected) style = 'bg-red-900 border border-red-500';
                else style = 'bg-gray-900 border border-gray-700 opacity-50';
              }
              return (
                <button
                  key={i}
                  onClick={() => handleSelect(option)}
                  className={`w-full text-left px-5 py-4 rounded-xl transition-all ${style}`}
                >
                  <span className="text-gray-400 mr-3">{String.fromCharCode(65 + i)}.</span>
                  {option}
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {selected && (
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-300">
                <span className="text-blue-400 font-semibold">Explanation: </span>
                {q.explanation}
              </p>
            </div>
          )}

          {/* Next Button */}
          {selected && (
            <button
              onClick={handleNext}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition"
            >
              {current + 1 === questions.length ? 'See Results →' : 'Next Question →'}
            </button>
          )}

        </div>
      </div>
    </div>
  );
}
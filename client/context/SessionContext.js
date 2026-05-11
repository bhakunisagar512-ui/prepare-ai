import { createContext, useContext, useState } from 'react';

const SessionContext = createContext();

export const SessionProvider = ({ children }) => {
  const [attempts, setAttempts] = useState([]);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);

  const addAttempt = (attempt) => {
    setAttempts(prev => [...prev, attempt]);
    setCurrentSetIndex(prev => prev + 1);
  };

  const getStats = () => {
    if (attempts.length === 0) return null;

    const subjectStats = {};
    const topicStats = {};

    attempts.forEach(attempt => {
      attempt.results.forEach(r => {
        // subject level
        if (!subjectStats[r.subject]) {
          subjectStats[r.subject] = { correct: 0, total: 0 };
        }
        subjectStats[r.subject].total++;
        if (r.isCorrect) subjectStats[r.subject].correct++;

        // topic level
        if (!topicStats[r.topic]) {
          topicStats[r.topic] = { correct: 0, total: 0, subject: r.subject };
        }
        topicStats[r.topic].total++;
        if (r.isCorrect) topicStats[r.topic].correct++;
      });
    });

    const strongTopics = [];
    const weakTopics = [];

    Object.entries(topicStats).forEach(([topic, stat]) => {
      const accuracy = (stat.correct / stat.total) * 100;
      if (accuracy >= 70) strongTopics.push({ topic, accuracy, subject: stat.subject });
      else weakTopics.push({ topic, accuracy, subject: stat.subject });
    });

    const totalCorrect = attempts.reduce((sum, a) => sum + a.score, 0);
    const totalQuestions = attempts.reduce((sum, a) => sum + a.totalQuestions, 0);

    return {
      totalQuizzes: attempts.length,
      averageScore: Math.round((totalCorrect / totalQuestions) * 100),
      strongTopics,
      weakTopics,
      subjectStats,
      scoreTrend: attempts.map(a => Math.round(a.percentage)),
    };
  };

  return (
    <SessionContext.Provider value={{
      attempts,
      currentSetIndex,
      addAttempt,
      getStats,
    }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);
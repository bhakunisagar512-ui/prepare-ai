import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AIFeedback({ results, localFeedback, token }) {
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAI, setIsAI] = useState(false);

  useEffect(() => {
    generateFeedback();
  }, []);

  const generateFeedback = async () => {
    console.log('token:', token);
    console.log('localFeedback:', localFeedback);
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/quiz/feedback`,
        { results },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFeedback(res.data.feedback);
      setIsAI(true);
    } catch (err) {
      setFeedback(localFeedback);
      setIsAI(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 rounded-2xl p-6 mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">📝 Your Feedback</h2>
        <span className={`text-xs px-3 py-1 rounded-full border ${
          isAI
            ? 'bg-blue-950 border-blue-500 text-blue-300'
            : 'bg-gray-800 border-gray-600 text-gray-400'
        }`}>
          {isAI ? '✨ AI Generated' : '📋 Template'}
        </span>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <span className="animate-pulse">Generating feedback...</span>
        </div>
      ) : (
        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{feedback}</p>
      )}
    </div>
  );
}
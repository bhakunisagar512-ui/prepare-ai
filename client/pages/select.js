import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

const SUBJECTS = [
  { id: 'OOPS', label: 'Object Oriented Programming', icon: '🧱', available: true },
  { id: 'DBMS', label: 'Database Management Systems', icon: '🗄️', available: true },
  { id: 'OS', label: 'Operating Systems', icon: '⚙️', available: true },
  { id: 'CN', label: 'Computer Networks', icon: '🌐', available: true },
  { id: 'Java', label: 'Java Programming', icon: '☕', available: true },
  { id: 'DSA', label: 'Data Structures & Algorithms', icon: '📊', available: false },
  { id: 'System Design', label: 'System Design', icon: '🏗️', available: false },
];

export default function Select() {
  const { user } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState('');
  const [customSubjects, setCustomSubjects] = useState([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [customError, setCustomError] = useState('');

  useEffect(() => {
    if (!user) router.push('/login');
  }, [user]);

  const toggleSubject = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
    setError('');
  };

  const handleAddCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed) {
      setCustomError('Please enter a subject name.');
      return;
    }
    if (customSubjects.find(s => s.id.toLowerCase() === trimmed.toLowerCase())) {
      setCustomError('This subject is already added.');
      return;
    }
    const newSubject = { id: trimmed, label: trimmed, icon: '✨', custom: true };
    setCustomSubjects(prev => [...prev, newSubject]);
    setSelected(prev => [...prev, trimmed]);
    setCustomInput('');
    setCustomError('');
    setShowCustomInput(false);
  };

  const handleStart = () => {
  if (selected.length === 0) {
    setError('Please select at least one subject to continue.');
    return;
  }

  const customSelected = customSubjects.filter(s => selected.includes(s.id)).map(s => s.id);
  const standardSelected = selected.filter(s => !customSelected.includes(s));

  const query = {};
  if (standardSelected.length > 0) query.subjects = standardSelected.join(',');
  if (customSelected.length > 0) query.custom = customSelected.join(',');

  router.push({ pathname: '/quiz', query });
  };

  const allSubjects = [...SUBJECTS, ...customSubjects.map(s => ({ ...s, available: true }))];

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Header */}
      <div className="bg-gray-900 px-6 py-4 flex justify-between items-center border-b border-gray-800">
        <h1 className="text-xl font-bold">Prepare<span className="text-blue-500">.ai</span></h1>
        <button onClick={() => router.push('/dashboard')} className="text-sm text-gray-400 hover:text-white transition">
          ← Dashboard
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">

        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-2">Choose Your Subjects</h2>
          <p className="text-gray-400">Select subjects you want to be quizzed on.</p>
        </div>

        <div className="grid grid-cols-1 gap-3 mb-4">
          {allSubjects.map(({ id, label, icon, available, custom }) => {
            const isSelected = selected.includes(id);

            if (!available) {
              return (
                <div key={id} className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-2xl px-5 py-4 opacity-50 cursor-not-allowed">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{icon}</span>
                    <div>
                      <p className="font-medium text-gray-400">{label}</p>
                      <p className="text-xs text-gray-600">{id}</p>
                    </div>
                  </div>
                  <span className="text-xs bg-gray-800 text-gray-500 px-3 py-1 rounded-full border border-gray-700">Coming Soon</span>
                </div>
              );
            }

            return (
              <button
                key={id}
                onClick={() => toggleSubject(id)}
                className={`flex items-center justify-between rounded-2xl px-5 py-4 border transition-all text-left ${
                  isSelected ? 'bg-blue-950 border-blue-500' : 'bg-gray-900 border-gray-800 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <p className="font-medium">{label}</p>
                    <p className="text-xs text-gray-500">{custom ? 'Custom Subject' : id}</p>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-600'
                }`}>
                  {isSelected && <span className="text-white text-xs">✓</span>}
                </div>
              </button>
            );
          })}

          {/* Add Your Own Subject */}
          {!showCustomInput ? (
            <button
              onClick={() => setShowCustomInput(true)}
              className="flex items-center justify-between bg-gray-900 border border-dashed border-blue-700 rounded-2xl px-5 py-4 hover:border-blue-500 transition-all text-left"
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl">➕</span>
                <div>
                  <p className="font-medium text-blue-400">Add Your Own Subject</p>
                  <p className="text-xs text-gray-500">Powered by Gemini AI — any topic works</p>
                </div>
              </div>
              <span className="text-xs bg-blue-950 text-blue-400 px-3 py-1 rounded-full border border-blue-700">New</span>
            </button>
          ) : (
            <div className="bg-gray-900 border border-blue-600 rounded-2xl px-5 py-4">
              <p className="text-blue-400 font-medium mb-3">✨ Add a Custom Subject</p>
              <p className="text-gray-500 text-sm mb-3">Type any subject — Gemini AI will generate questions for it.</p>
              <input
                type="text"
                placeholder="e.g. Machine Learning, React.js, Economics..."
                value={customInput}
                onChange={e => { setCustomInput(e.target.value); setCustomError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleAddCustom()}
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 mb-3"
                autoFocus
              />
              {customError && <p className="text-red-400 text-sm mb-3">{customError}</p>}
              <div className="flex gap-3">
                <button
                  onClick={handleAddCustom}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl font-semibold transition text-sm"
                >
                  Add Subject
                </button>
                <button
                  onClick={() => { setShowCustomInput(false); setCustomInput(''); setCustomError(''); }}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-xl font-semibold transition text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-gray-500 text-sm mb-2">
          {selected.length === 0 ? 'No subjects selected' : `${selected.length} subject${selected.length > 1 ? 's' : ''} selected`}
        </p>

        {error && <p className="text-center text-red-400 text-sm mb-4">{error}</p>}

        <button
          onClick={handleStart}
          className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all mt-4 ${
            selected.length > 0 ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
        >
          {selected.length > 0 ? `Start Quiz with ${selected.length} Subject${selected.length > 1 ? 's' : ''} →` : 'Select a subject to continue'}
        </button>

      </div>
    </div>
  );
}
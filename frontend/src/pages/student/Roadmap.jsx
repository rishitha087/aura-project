import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getLearningRoadmap } from '../../services/ai';

const LearningRoadmapPage = () => {
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Checkbox completion logs helper state
  const [completedTasks, setCompletedTasks] = useState(() => {
    const saved = localStorage.getItem('completed_roadmap_tasks');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        const data = await getLearningRoadmap();
        setRoadmap(data);
      } catch (err) {
        if (err.response?.status !== 404) {
          setError('Failed to retrieve learning roadmap.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchRoadmap();
  }, []);

  const handleToggleTask = (weekName, taskIdx) => {
    const key = `${weekName}-${taskIdx}`;
    const updated = {
      ...completedTasks,
      [key]: !completedTasks[key]
    };
    setCompletedTasks(updated);
    localStorage.setItem('completed_roadmap_tasks', JSON.stringify(updated));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-t-transparent border-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
      
      {/* Header */}
      <div className="mb-10 text-center md:text-left flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            AI Growth <span className="text-gradient">Roadmap</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            A structured, 4-week study curriculum generated dynamically to bridge your technical skill gaps.
          </p>
        </div>
        {roadmap && (
          <Link
            to="/student/skill-gap"
            className="bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-bold px-5 py-3 rounded-xl transition"
          >
            Create New Plan
          </Link>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs mb-6 text-center max-w-2xl mx-auto">
          {error}
        </div>
      )}

      {!roadmap ? (
        <div className="glass p-12 rounded-3xl border border-white/5 text-center max-w-2xl mx-auto">
          <svg className="w-12 h-12 text-slate-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <h3 className="text-lg font-bold text-white">No active roadmap guide</h3>
          <p className="text-slate-400 text-xs mt-2 leading-relaxed">
            Personalized study curricula are generated based on your missing core skills. Evaluate your skill gaps to construct a week-by-week learning plan.
          </p>
          <Link
            to="/student/skill-gap"
            className="mt-6 inline-block bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow"
          >
            Bridge Skill Gaps
          </Link>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto">
          
          <div className="bg-primary-500/15 border border-primary-500/25 p-5 rounded-2xl mb-8 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Active Track</span>
              <h3 className="text-lg font-extrabold text-white capitalize mt-0.5">{roadmap.target_role} Roadmap</h3>
            </div>
            
            <Link
              to="/student/ai-coach"
              className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow"
            >
              Ask AI Career Coach
            </Link>
          </div>

          {/* Timeline Wrapper */}
          <div className="relative border-l border-white/10 pl-6 ml-4 space-y-8">
            {Object.keys(roadmap.roadmap_data).map((weekName, idx) => {
              const tasks = roadmap.roadmap_data[weekName];
              
              return (
                <div key={weekName} className="relative">
                  
                  {/* Timeline bullet dot */}
                  <span className="absolute -left-10 top-1 w-8 h-8 rounded-full bg-dark-950 border border-primary-500 flex items-center justify-center text-primary-400 text-[10px] font-bold">
                    {idx + 1}
                  </span>

                  {/* Card content */}
                  <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5 space-y-4">
                    <h4 className="text-lg font-extrabold text-white flex items-center justify-between">
                      {weekName}
                      <span className="text-[10px] text-slate-500 font-normal">Week target</span>
                    </h4>
                    
                    <ul className="space-y-3.5 pt-2">
                      {tasks.map((task, taskIdx) => {
                        const isDone = !!completedTasks[`${weekName}-${taskIdx}`];
                        
                        return (
                          <li
                            key={taskIdx}
                            onClick={() => handleToggleTask(weekName, taskIdx)}
                            className="bg-dark-950/40 hover:bg-dark-950/80 border border-white/5 hover:border-white/10 p-3.5 rounded-xl flex items-center justify-between gap-4 cursor-pointer transition"
                          >
                            <div className="flex items-center gap-3">
                              <span className={`h-5 w-5 rounded border flex items-center justify-center flex-shrink-0 transition ${
                                isDone ? 'bg-primary-600 border-primary-500 text-white' : 'border-white/20'
                              }`}>
                                {isDone && (
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </span>
                              <span className={`text-xs transition ${isDone ? 'text-slate-500 line-through' : 'text-slate-300 font-light'}`}>
                                {task}
                              </span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}
    </div>
  );
};

export default LearningRoadmapPage;

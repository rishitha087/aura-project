import React, { useState, useRef, useEffect } from 'react';
import { chatWithAICoach } from '../../services/ai';

const AICoachPage = () => {
  const [messages, setMessages] = useState([
    { role: 'model', text: 'Hello! I am your AI Career Coach. Ask me anything about resume improvements, preparing for mock interviews, or which technical frameworks to study next.' }
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const quickQuestions = [
    "How do I prepare for Java interviews?",
    "What skills should I learn next?",
    "How can I improve communication?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (textToSend) => {
    if (!textToSend.trim()) return;
    
    // Add user message
    const updatedMessages = [...messages, { role: 'user', text: textToSend }];
    setMessages(updatedMessages);
    setInput('');
    setSending(true);

    try {
      // Map history for Gemini API. Exclude first model greeting
      const historyPayload = updatedMessages.slice(1).map(m => ({
        role: m.role,
        text: m.text
      }));

      // Call API
      const res = await chatWithAICoach(textToSend, historyPayload);
      
      setMessages(prev => [...prev, { role: 'model', text: res.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I fumbled. Please try asking again.' }]);
    } finally {
      setSending(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
      
      {/* Header */}
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-4xl font-extrabold text-white tracking-tight">
          AI Career <span className="text-gradient">Coach</span>
        </h1>
        <p className="text-slate-400 text-sm mt-2">
          Interactive chat portal with our career mentor. Receive algorithm preparation drills and CV critiques.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[600px]">
        
        {/* Left Side Panel: Quick Tips */}
        <div className="lg:col-span-1 glass p-6 rounded-3xl border border-white/5 flex flex-col gap-6">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Coach Guidelines</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed font-light">
              You can query detailed study checklists, ask for structural modifications to project descriptions, or run mock coding drills directly.
            </p>
          </div>

          <div className="h-px bg-white/5" />

          {/* Quick chips */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Quick Prompts</h3>
            <div className="flex flex-col gap-2">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  disabled={sending}
                  className="text-left text-xs bg-dark-950/60 hover:bg-primary-500/10 border border-white/5 hover:border-primary-500/25 p-3 rounded-xl text-slate-300 hover:text-white transition disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side Chat window */}
        <div className="lg:col-span-3 glass rounded-3xl border border-white/5 flex flex-col justify-between overflow-hidden relative">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary-500/5 rounded-full blur-[100px] pointer-events-none"></div>

          {/* Messages Logs Area */}
          <div className="flex-grow p-6 overflow-y-auto space-y-4 max-h-[500px]">
            {messages.map((m, idx) => {
              const isCoach = m.role === 'model';
              
              return (
                <div key={idx} className={`flex ${isCoach ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[75%] p-4 rounded-2xl text-xs leading-relaxed ${
                    isCoach 
                      ? 'bg-dark-900 border border-white/5 text-slate-200 rounded-tl-none font-light' 
                      : 'bg-primary-600 text-white rounded-tr-none font-medium'
                  }`}>
                    {m.text}
                  </div>
                </div>
              );
            })}
            
            {sending && (
              <div className="flex justify-start">
                <div className="bg-dark-900 border border-white/5 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                  <div className="h-2 w-2 bg-slate-500 rounded-full animate-bounce"></div>
                  <div className="h-2 w-2 bg-slate-500 rounded-full animate-bounce delay-100"></div>
                  <div className="h-2 w-2 bg-slate-500 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form input */}
          <form onSubmit={handleFormSubmit} className="p-4 bg-dark-950/60 border-t border-white/5 flex gap-2">
            <input
              type="text"
              placeholder="Ask anything about coding mocks or resume review..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sending}
              className="flex-grow bg-dark-900 border border-white/10 rounded-xl px-4 py-3 text-slate-100 text-xs focus:outline-none focus:border-primary-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-6 py-3 rounded-xl text-xs shadow-md transition disabled:opacity-50 flex-shrink-0"
            >
              Send
            </button>
          </form>

        </div>

      </div>
    </div>
  );
};

export default AICoachPage;

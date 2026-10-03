import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Compass, Bot, Target, FileText, Loader2 } from 'lucide-react';
import { useResumeStore } from '../stores/resumeStore';
import { createId } from '../types/resume';
import type { ChatMessage } from '../types/resume';
import { runAi } from '../services/aiService';

export default function CareerCoach() {
  const { chatMessages, addChatMessage, resumes, activeResumeId, setPage } = useResumeStore();
  const resume = resumes.find(r => r.id === activeResumeId);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  const send = async (text: string) => {
    if (!text.trim() || isTyping) return;
    const userMsg: ChatMessage = {
      id: createId(), role: 'user', content: text.trim(),
      timestamp: new Date().toISOString(),
    };
    addChatMessage(userMsg);
    setInput('');
    setIsTyping(true);

    try {
      const result = await runAi({
        kind: 'coach',
        resume,
        input: userMsg.content,
        turn: chatMessages.filter(m => m.role === 'user').length,
      });
      const botMsg: ChatMessage = {
        id: createId(), role: 'assistant', content: result.text,
        timestamp: new Date().toISOString(),
      };
      addChatMessage(botMsg);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = () => { void send(input); };

  const quickPrompts = resume
    ? [
      'What should I fix in my resume first?',
      'Rewrite my weakest bullet point',
      'How do I prepare for interviews?',
      'How should I negotiate salary?',
      'What skills should I learn?',
    ]
    : [
      'How do I improve my resume?',
      'Help me prepare for interviews',
      'How should I negotiate salary?',
      'I want to change careers',
      'What skills should I learn?',
    ];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <div className="section-header">
        <div>
          <h1 className="section-title">AI Career Coach</h1>
          <p className="section-subtitle">
            {resume
              ? `Answers use your resume — ${resume.metadata.name}${resume.personalInfo.title ? ` (${resume.personalInfo.title})` : ''}`
              : 'Get career advice, interview prep and salary guidance'}
          </p>
        </div>
        {resume && (
          <button className="btn btn-ghost btn-sm" onClick={() => setPage('ats-checker')}>
            <Target size={14} /> Full ATS check
          </button>
        )}
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="chat-container" style={{ height: 'calc(100vh - 250px)', maxHeight: 700 }}>
          {/* Messages */}
          <div className="chat-messages">
            {chatMessages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-md)', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <Bot size={28} style={{ color: 'var(--text-on-accent)' }} />
                </div>
                <h3 className="font-bold mb-2">Hi! I'm your AI Career Coach</h3>
                <p className="text-sm text-muted mb-6">
                  {resume
                    ? 'Ask me anything — I read your resume and point at your actual lines.'
                    : 'Ask me anything about resumes, interviews, salary, or career planning.'}
                </p>
                {resume && (
                  <div className="flex items-center justify-center gap-2 text-xs text-muted mb-4">
                    <FileText size={13} /> Reading: {resume.metadata.name}
                  </div>
                )}
                <div className="flex flex-wrap gap-2 justify-center">
                  {quickPrompts.map(p => (
                    <button key={p} className="btn btn-ghost btn-sm" onClick={() => send(p)}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {chatMessages.map(msg => (
              <motion.div
                key={msg.id}
                className={`chat-message ${msg.role}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-start gap-2">
                  {msg.role === 'assistant' && (
                    <Compass size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: 3 }} />
                  )}
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                </div>
              </motion.div>
            ))}

            {isTyping && (
              <div className="chat-message assistant">
                <div className="flex items-center gap-2">
                  <Loader2 size={14} className="spin" style={{ color: 'var(--accent-primary)' }} />
                  <span className="text-sm text-muted">
                    {resume ? 'Reading your resume...' : 'Thinking...'}
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chat-input-area">
            <input
              className="chat-input"
              placeholder="Ask about resumes, interviews, salary, careers..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            />
            <button className="btn btn-primary" onClick={handleSend} disabled={!input.trim() || isTyping}>
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

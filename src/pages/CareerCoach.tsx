import { useState, useRef, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Markdown from 'react-markdown';
import { Send, Compass, Bot, Target, FileText, Loader2 } from 'lucide-react';
import { useResumeStore } from '../stores/resumeStore';
import { createId } from '../types/resume';
import type { ChatMessage } from '../types/resume';
import { runAi } from '../services/aiService';

export default function CareerCoach() {
  const { chatMessages, addChatMessage, resumes, activeResumeId, setPage, addToast } = useResumeStore();
  const resume = resumes.find(r => r.id === activeResumeId);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const container = messagesRef.current;
    if (!container) return;
    const last = chatMessages.at(-1);
    // Start long answers at their beginning rather than jumping past the advice.
    const top = !isTyping && last?.role === 'assistant' && lastMessageRef.current
      ? lastMessageRef.current.offsetTop - 24
      : container.scrollHeight;
    container.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [chatMessages, isTyping, reduceMotion]);

  useEffect(() => {
    const field = inputRef.current;
    if (!field) return;
    field.style.height = 'auto';
    field.style.height = `${Math.min(field.scrollHeight, 144)}px`;
  }, [input]);

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
        history: chatMessages.slice(-12).map(m => ({ role: m.role, content: m.content })),
        resume,
        input: userMsg.content,
        turn: chatMessages.filter(m => m.role === 'user').length,
      });
      if (result.fallbackReason) addToast('warning', result.fallbackReason);
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

      <div className="glass-card career-chat" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="chat-container">
          {/* Messages */}
          <div className="chat-messages" ref={messagesRef} role="log" aria-label="Career coaching conversation" aria-live="polite" aria-relevant="additions">
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
                ref={msg.id === chatMessages.at(-1)?.id ? lastMessageRef : undefined}
                className={`chat-message ${msg.role}`}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="chat-message-author">
                  {msg.role === 'assistant' && <Compass size={16} aria-hidden="true" />}
                  <span>{msg.role === 'assistant' ? 'Career coach' : 'You'}</span>
                </div>
                {msg.role === 'assistant' ? (
                  <div className="chat-prose">
                    <Markdown skipHtml allowedElements={['p', 'strong', 'em', 'ul', 'ol', 'li', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'code', 'pre', 'hr', 'br', 'a']}
                      components={{ a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a> }}>
                      {msg.content}
                    </Markdown>
                  </div>
                ) : <div className="chat-user-text">{msg.content}</div>}
              </motion.div>
            ))}

            {isTyping && (
              <div className="chat-message assistant" role="status">
                <div className="flex items-center gap-2">
                  <Loader2 size={14} className="spin" style={{ color: 'var(--accent-primary)' }} />
                  <span className="text-sm text-muted">
                    {resume ? 'Reading your resume...' : 'Thinking...'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form className="chat-composer" onSubmit={e => { e.preventDefault(); handleSend(); }}>
            <div className="chat-input-area">
              <textarea
                ref={inputRef}
                className="chat-input"
                rows={1}
                aria-label="Message the career coach"
                placeholder="Ask about your next career move…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault(); handleSend();
                  }
                }}
              />
              <button type="submit" className="btn btn-primary chat-send" aria-label="Send message" disabled={!input.trim() || isTyping}>
                <Send size={18} aria-hidden="true" />
              </button>
            </div>
            <p className="chat-input-hint">Enter to send · Shift + Enter for a new line</p>
          </form>
        </div>
      </div>
    </motion.div>
  );
}

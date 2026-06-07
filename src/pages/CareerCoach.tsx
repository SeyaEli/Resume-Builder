import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Send, Sparkles, User, Bot } from 'lucide-react';
import { useResumeStore } from '../stores/resumeStore';
import { createId } from '../types/resume';
import type { ChatMessage } from '../types/resume';

const RESPONSES: Record<string, string[]> = {
  resume: [
    "Here are my top tips for improving your resume:\n\n1. **Start with strong action verbs** — Use words like 'Led', 'Developed', 'Increased', 'Designed' instead of 'Helped' or 'Worked on'.\n\n2. **Quantify achievements** — Numbers make your impact tangible. Instead of 'Improved sales', write 'Increased quarterly sales by 35% ($2.1M in new revenue)'.\n\n3. **Tailor to each job** — Customize your resume for every application. Mirror keywords from the job description.\n\n4. **Keep it concise** — 1 page for <10 years experience, 2 pages max for senior roles.\n\n5. **Use ATS-friendly formatting** — Avoid tables, graphics, headers/footers. Stick to standard fonts.",
    "A strong resume follows the **PAR method** for bullet points:\n\n• **P**roblem — What challenge did you face?\n• **A**ction — What did you do?\n• **R**esult — What measurable outcome did you achieve?\n\nExample:\n'Identified a 40% customer churn rate (Problem), redesigned the onboarding flow using user research data (Action), reducing churn by 28% within 3 months (Result).'\n\nAlso ensure your professional summary is compelling and specific to your target role!",
  ],
  interview: [
    "Here are key interview preparation strategies:\n\n🎯 **Before the Interview:**\n- Research the company thoroughly (products, culture, recent news)\n- Prepare 5-7 STAR stories (Situation, Task, Action, Result)\n- Practice with a timer — keep answers to 2-3 minutes\n- Prepare 3-5 thoughtful questions for the interviewer\n\n📝 **Common Questions to Prepare:**\n1. 'Tell me about yourself' — 90-second career narrative\n2. 'Why this company?' — Show genuine interest\n3. 'Tell me about a challenge you faced' — Use STAR method\n4. 'Where do you see yourself in 5 years?' — Show ambition aligned with role\n5. 'What's your biggest weakness?' — Be honest, show growth\n\n💡 **Pro Tip:** Record yourself answering questions and review your body language and clarity.",
    "For **technical interviews**, here's my framework:\n\n1. **Clarify** the problem before coding\n2. **Plan** your approach out loud\n3. **Code** clean, readable solutions\n4. **Test** with edge cases\n5. **Optimize** if time permits\n\nFor **behavioral interviews**, always use the **STAR method** and have stories ready for: leadership, conflict resolution, failure, teamwork, and initiative.\n\nAlso prepare your **'Why?'** story — why this role, why this company, why now in your career.",
  ],
  salary: [
    "Here's how to navigate salary negotiations effectively:\n\n💰 **Research First:**\n- Check Glassdoor, Levels.fyi, Payscale for market rates\n- Know your range: minimum, target, and ideal\n- Factor in total compensation (base, bonus, equity, benefits)\n\n🤝 **Negotiation Tips:**\n1. **Never give the first number** — Let the employer make the first offer\n2. **Express enthusiasm first** — 'I'm excited about this opportunity'\n3. **Use data** — 'Based on market research, the range for this role is...'\n4. **Negotiate the full package** — PTO, remote work, signing bonus, equity\n5. **Get it in writing** — Always confirm the final offer in writing\n\n⚡ **Key phrase:** 'I'm very interested in this role. Is there flexibility in the compensation to better align with market rates for this position and my experience level?'",
  ],
  career: [
    "For a successful **career transition**, follow this roadmap:\n\n🗺️ **Phase 1: Self-Assessment (Weeks 1-2)**\n- Identify transferable skills from your current role\n- Research target industries and roles\n- Talk to 5+ people currently in your target role\n\n📚 **Phase 2: Skill Building (Weeks 3-8)**\n- Take relevant online courses (Coursera, Udemy, LinkedIn Learning)\n- Build portfolio projects\n- Get certifications if applicable\n\n🌐 **Phase 3: Networking (Ongoing)**\n- Attend industry events and meetups\n- Engage on LinkedIn with industry content\n- Reach out for informational interviews\n\n📄 **Phase 4: Rebrand (Weeks 6-8)**\n- Rewrite your resume with transferable skills highlighted\n- Update LinkedIn profile\n- Craft your career transition narrative\n\nRemember: Most skills are transferable. Frame your experience in terms of impact and outcomes, not just duties.",
  ],
  skills: [
    "Here are the **most in-demand skills** for 2024-2025:\n\n🔥 **Tech:**\n- AI/ML, Python, Cloud (AWS/Azure/GCP), Data Engineering\n- React, TypeScript, Kubernetes, DevOps\n\n📊 **Data:**\n- SQL, Power BI, Tableau, Data Analytics\n- Statistical modeling, A/B testing\n\n🤝 **Soft Skills:**\n- Communication, Leadership, Adaptability\n- Critical thinking, Emotional intelligence\n\n📈 **Business:**\n- Product management, Agile, Stakeholder management\n- Strategic planning, Change management\n\n**How to upskill fast:**\n1. Pick ONE focus area aligned with your target role\n2. Take a structured course (4-8 weeks)\n3. Build a portfolio project\n4. Share your learning journey on LinkedIn\n5. Apply immediately in your current or target role",
  ],
  default: [
    "I'm your AI Career Coach! I can help with:\n\n📄 **Resume Writing** — Tips for creating standout resumes\n🎤 **Interview Prep** — Strategies and practice questions\n💰 **Salary Negotiation** — Market research and tactics\n🔄 **Career Transitions** — Roadmap for changing careers\n📚 **Skill Development** — In-demand skills and learning paths\n\nJust ask me about any of these topics! For example:\n- 'How do I improve my resume?'\n- 'Help me prepare for interviews'\n- 'How should I negotiate my salary?'\n- 'I want to change careers to tech'\n- 'What skills should I learn?'",
  ],
};

function getResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('resume') || lower.includes('cv') || lower.includes('bullet') || lower.includes('ats')) {
    return RESPONSES.resume[Math.floor(Math.random() * RESPONSES.resume.length)];
  }
  if (lower.includes('interview') || lower.includes('question') || lower.includes('prepare')) {
    return RESPONSES.interview[Math.floor(Math.random() * RESPONSES.interview.length)];
  }
  if (lower.includes('salary') || lower.includes('negotiat') || lower.includes('compensation') || lower.includes('pay')) {
    return RESPONSES.salary[0];
  }
  if (lower.includes('career') || lower.includes('transition') || lower.includes('change') || lower.includes('switch')) {
    return RESPONSES.career[0];
  }
  if (lower.includes('skill') || lower.includes('learn') || lower.includes('course') || lower.includes('upskill')) {
    return RESPONSES.skills[0];
  }
  return RESPONSES.default[0];
}

export default function CareerCoach() {
  const { chatMessages, addChatMessage } = useResumeStore();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = {
      id: createId(), role: 'user', content: input.trim(),
      timestamp: new Date().toISOString(),
    };
    addChatMessage(userMsg);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = getResponse(userMsg.content);
      const botMsg: ChatMessage = {
        id: createId(), role: 'assistant', content: response,
        timestamp: new Date().toISOString(),
      };
      addChatMessage(botMsg);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const quickPrompts = [
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
          <h1 className="section-title"><span className="gradient-text">AI Career Coach</span></h1>
          <p className="section-subtitle">Get personalized career advice, interview prep, and guidance</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="chat-container" style={{ height: 'calc(100vh - 250px)', maxHeight: 700 }}>
          {/* Messages */}
          <div className="chat-messages">
            {chatMessages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-xl)', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <Bot size={28} style={{ color: 'white' }} />
                </div>
                <h3 className="font-bold mb-2">Hi! I'm your AI Career Coach</h3>
                <p className="text-sm text-tertiary mb-6">Ask me anything about resumes, interviews, salary, or career planning</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {quickPrompts.map(p => (
                    <button key={p} className="btn btn-ghost btn-sm" onClick={() => { setInput(p); }}>
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
                    <Sparkles size={14} style={{ color: 'var(--accent-blue)', flexShrink: 0, marginTop: 3 }} />
                  )}
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                </div>
              </motion.div>
            ))}

            {isTyping && (
              <div className="chat-message assistant">
                <div className="flex items-center gap-2">
                  <div className="spinner" style={{ width: 14, height: 14 }} />
                  <span className="text-sm text-tertiary">Thinking...</span>
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

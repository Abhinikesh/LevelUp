import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, X, Bot, User, Sparkles, MessageSquare, CornerDownLeft, Volume2, Mic } from 'lucide-react'
import { coachApi } from '../../api/client'
import toast from 'react-hot-toast'

export default function AICoach({ isOpen, onClose, levelId, levelTitle }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I am ARIA, your personal learning coach. 🌟\n\nI see you're working on **${levelTitle || 'your roadmap'}**. What concept would you like to dive into? I can break things down, give you a real-world example, or write a practice challenge!`,
      suggestedActions: ['Break it down step-by-step', 'Show me a code example', 'Give me a practice problem', 'Explain it simpler']
    }
  ])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    // Add user message
    const userMsg = { role: 'user', content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText('');
    setLoading(true);

    try {
      // API payload requires trimming message structure
      const apiPayload = updatedMessages.map(m => ({ role: m.role, content: m.content }));
      
      const { data } = await coachApi.chat(apiPayload, levelId);
      
      if (data.success) {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: data.reply,
            suggestedActions: data.suggestedActions || []
          }
        ]);
      } else {
        toast.error('Coach failed to answer.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Coach communication error.');
      // Add error response
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Oh no, I encountered an issue connecting to the servers. Please verify your connection or try again shortly! 🔌',
          suggestedActions: ['Try again', 'Go back to map']
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeech = () => {
    // Simple Web Speech Recognition Mocking / WebAPI support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported in this browser.');
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    rec.start();
    toast.success('Listening... speak now 🎙️', { id: 'speech' });
    
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInputText(transcript);
      toast.success('Voice captured!', { id: 'speech' });
    };
    rec.onerror = () => {
      toast.error('Speech recognition error.', { id: 'speech' });
    };
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Panel body */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 220 }}
          className="relative z-10 w-full max-w-md h-full flex flex-col border-l border-border"
          style={{
            background: 'linear-gradient(180deg, #0E0E17 0%, #08080C 100%)',
          }}
        >
          {/* Header */}
          <div className="p-4 border-b border-border/40 flex items-center justify-between bg-card/40">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand/10 border border-brand/30 flex items-center justify-center text-brand">
                <Bot size={18} className="animate-pulse" />
              </div>
              <div>
                <h3 className="font-display font-black text-sm text-white flex items-center gap-1.5">
                  ARIA AI Coach <Sparkles size={12} className="text-gold" />
                </h3>
                <p className="text-[10px] text-muted font-bold truncate max-w-[200px]">
                  Topic: {levelTitle || 'Study Mode'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-all"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 max-w-[85%] ${
                  msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    msg.role === 'user'
                      ? 'bg-gold/25 border border-gold/40 text-gold'
                      : 'bg-brand/20 border border-brand/35 text-brand'
                  }`}
                >
                  {msg.role === 'user' ? <User size={13} /> : <Bot size={13} />}
                </div>

                {/* Bubble content */}
                <div className="space-y-2">
                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-brand/10 border border-brand/20 text-white rounded-tr-none'
                        : 'bg-[#151522] border border-[#23233C] text-muted-foreground rounded-tl-none'
                    }`}
                  >
                    {msg.content.split('\n').map((line, idx) => (
                      <p key={idx} className={idx > 0 ? 'mt-2' : ''}>
                        {line}
                      </p>
                    ))}
                  </div>

                  {/* Action chips for assistant messages */}
                  {msg.role === 'assistant' && msg.suggestedActions?.length > 0 && i === messages.length - 1 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.suggestedActions.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(action)}
                          className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-border/80 bg-card hover:bg-white/5 hover:border-brand/40 text-muted-foreground hover:text-white transition-all"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-7 h-7 rounded-lg bg-brand/20 border border-brand/35 text-brand flex items-center justify-center text-xs">
                  <Bot size={13} />
                </div>
                <div className="bg-[#151522] border border-[#23233C] p-3.5 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Typing Area */}
          <div className="p-4 border-t border-border/40 bg-card/10">
            <div className="relative flex items-center">
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask ARIA a question..."
                className="input w-full pl-3 pr-20 py-3 text-xs bg-[#0F0F16] border-border rounded-xl"
              />
              <div className="absolute right-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleSpeech}
                  className="p-1.5 rounded-lg text-muted hover:text-brand hover:bg-white/5 transition-all"
                  title="Speech Input"
                >
                  <Mic size={14} />
                </button>
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim()}
                  className="p-1.5 rounded-lg bg-brand text-white disabled:opacity-40 disabled:hover:bg-brand hover:bg-brand-hover transition-all"
                >
                  <Send size={12} />
                </button>
              </div>
            </div>
            <p className="text-[9px] text-muted text-center mt-2">
              Press Enter <CornerDownLeft size={8} className="inline" /> to send
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

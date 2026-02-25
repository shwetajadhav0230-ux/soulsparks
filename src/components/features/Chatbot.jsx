import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, RefreshCw, Send, BookOpen, ShieldAlert, BrainCircuit, Bot, Info
} from 'lucide-react';
// Linked to your perfected supabaseClient.js
import { ClinicalService } from "../../lib/supabaseClient"; 
import Card from '../common/Card';

const Chatbot = ({ setView, userId }) => {
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      sender: 'bot', 
      text: "Hi there, I'm **SoulSpark**. I'm here to support you on your wellness journey.\n\nI'm an AI companion trained in **CBT**, **DBT**, and **ACT**. How are you feeling right now?" 
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const [isCBTMode, setIsCBTMode] = useState(false);
  const [cbtStep, setCbtStep] = useState("Intake");
  const [sessionNumber, setSessionNumber] = useState(1);
  const [homeworkStatus, setHomeworkStatus] = useState("None");

  const messagesEndRef = useRef(null);

  // --- HELPER: RENDER BOLD TEXT ---
  // Transforms **text** into <strong> tags for a premium look
  const formatMessage = (text) => {
    return text.split('\n').map((line, i) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={i} className="mb-2 last:mb-0">
          {parts.map((part, j) => 
            part.startsWith('**') && part.endsWith('**') 
              ? <strong key={j} className="font-bold text-teal-900 drop-shadow-sm">{part.slice(2, -2)}</strong> 
              : part
          )}
        </p>
      );
    });
  };
  
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };
  useEffect(scrollToBottom, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    const userMsg = { id: Date.now(), sender: 'user', text: userText };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      if (isCBTMode) {
        const currentState = {
          session_number: sessionNumber,
          current_cbt_step: cbtStep,
          homework_status: homeworkStatus,
          user_input: userText
        };

        const aiResponse = await ClinicalService.processCBTInteraction(currentState);

        if (aiResponse.safety_flag) {
          setMessages(prev => [...prev, { 
            id: Date.now() + 1, sender: 'bot', text: aiResponse.response_text, isCrisis: true 
          }]);
          setView('crisis'); 
          return;
        }

        setMessages(prev => [...prev, { 
          id: Date.now() + 1, sender: 'bot', text: aiResponse.response_text, homework: aiResponse.homework_assigned
        }]);

        setCbtStep(aiResponse.updated_cbt_step);
        if (aiResponse.homework_assigned) setHomeworkStatus("Pending");
      } else {
        const aiResponseText = await ClinicalService.processGeneralChat(userText, messages, userId);
        setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: aiResponseText }]);
      }
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, sender: 'bot', text: "I'm having a little trouble connecting to my **logic core**. Let's take a deep breath and try again." 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="h-[calc(100vh-80px)] max-w-6xl mx-auto p-4 flex gap-6">
      
      {/* SIDEBAR */}
      <div className="hidden lg:flex w-80 flex-col gap-4">
        <Card className="flex-1 bg-white border-none shadow-xl shadow-stone-200/40 rounded-[2rem] p-6">
          <h3 className="font-serif text-xl text-stone-800 mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-500" /> Therapy Tools
          </h3>
          
          <div className="space-y-4">
            <button 
              onClick={() => setIsCBTMode(!isCBTMode)}
              className={`w-full text-left p-4 rounded-2xl transition-all duration-300 flex items-center justify-between group border ${
                isCBTMode 
                ? 'bg-teal-900 text-white border-teal-900 shadow-lg shadow-teal-900/20' 
                : 'bg-stone-50 text-stone-700 border-stone-100 hover:border-teal-300 hover:bg-teal-50/50'
              }`}
            >
              <div className="flex items-center gap-3 font-medium">
                <BrainCircuit className={`w-5 h-5 ${isCBTMode ? 'text-teal-300' : 'text-stone-400 group-hover:text-teal-600'}`} /> 
                Structured CBT
              </div>
              <div className={`w-3 h-3 rounded-full ${isCBTMode ? 'bg-teal-400 animate-pulse' : 'bg-stone-300'}`} />
            </button>

            <button onClick={() => setView('crisis')} className="w-full text-left p-4 rounded-2xl bg-stone-50 hover:bg-red-50 text-stone-700 hover:text-red-700 transition-colors border border-stone-100 flex items-center gap-3 font-medium">
              <ShieldAlert className="w-5 h-5 text-red-400" /> Crisis Support
            </button>
          </div>

          <AnimatePresence>
            {isCBTMode && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="mt-8 pt-8 border-t border-stone-100"
              >
                <h3 className="font-serif text-xs font-bold text-stone-400 mb-4 uppercase tracking-widest">Progress</h3>
                <div className="space-y-3">
                  {['Intake', 'Identify', 'Awareness', 'Patterns', 'Reframe'].map((step) => (
                    <div key={step} className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${cbtStep === step ? 'bg-teal-500 animate-ping' : 'bg-stone-200'}`} />
                      <span className={`text-sm ${cbtStep === step ? 'text-teal-800 font-bold' : 'text-stone-400'}`}>{step}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col bg-[#fcfcfc] rounded-[2.5rem] shadow-xl shadow-stone-200/50 border border-stone-100 overflow-hidden relative">
        <div className="px-8 py-5 border-b border-stone-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center border border-teal-200">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-stone-800 text-lg flex items-center gap-2">SoulSpark</h3>
              <p className="text-xs text-stone-500 font-medium">
                {isCBTMode ? `CBT: ${cbtStep}` : 'Always here to listen'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setMessages([{ id: 1, sender: 'bot', text: "Let's start fresh. How can I help?" }])} 
            className="text-stone-400 hover:text-stone-700 p-2 bg-stone-50 rounded-full"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div 
                key={msg.id} 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
                  msg.sender === 'user' 
                    ? 'bg-teal-700 text-white rounded-br-none' 
                    : 'bg-white text-stone-700 border border-stone-100 rounded-bl-none'
                }`}>
                  {/* Using the text formatter here */}
                  <div className="leading-relaxed">
                    {msg.sender === 'bot' ? formatMessage(msg.text) : msg.text}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-6 bg-white border-t border-stone-100">
          <div className="max-w-4xl mx-auto flex items-center bg-stone-50 rounded-full border border-stone-200 p-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-500/10 transition-all">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="What's on your mind?"
              className="flex-1 bg-transparent border-0 px-6 py-3 text-stone-700 focus:outline-none"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="w-12 h-12 rounded-full bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TypingIndicator = () => (
  <div className="flex justify-start items-center gap-2 pl-2">
    <div className="bg-white px-4 py-3 rounded-2xl border border-stone-100 shadow-sm flex gap-1">
      {[0, 0.1, 0.2].map((d) => (
        <motion.div
          key={d}
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 0.6, delay: d }}
          className="w-1.5 h-1.5 bg-teal-400 rounded-full"
        />
      ))}
    </div>
  </div>
);

export default Chatbot;   
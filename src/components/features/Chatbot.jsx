import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, RefreshCw, Send, BookOpen, ShieldAlert, BrainCircuit, Bot
} from 'lucide-react';
import { ClinicalService } from "../../lib/supabaseClient"; // Adjust path if needed
import Card from '../common/Card';

const Chatbot = ({ setView, userId }) => {
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      sender: 'bot', 
      text: "Hi there, I'm SoulSpark. I'm here to support you on your wellness journey.\n\nI'm an AI companion trained in CBT, DBT, ACT, and mindfulness. How are you feeling right now?" 
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // --- CBT SESSION STATE TRACKING ---
  const [isCBTMode, setIsCBTMode] = useState(false);
  const [cbtStep, setCbtStep] = useState("Intake");
  const [sessionNumber, setSessionNumber] = useState(1);
  const [homeworkStatus, setHomeworkStatus] = useState("None");

  const messagesEndRef = useRef(null);
  
  // Auto-scroll with a slight delay to allow rendering
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
        // --- 1. STRUCTURED CBT LOGIC ---
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

        await ClinicalService.saveActivityLog(userId, 'cbt-internal-note', {
          notes: aiResponse.clinical_notes, step: aiResponse.updated_cbt_step
        });

      } else {
        // --- 2. GENERAL WELLNESS AI ---
        const aiResponseText = await ClinicalService.processGeneralChat(userText, messages, userId);
        const lowerResponse = aiResponseText.toLowerCase();
        
        if (lowerResponse.includes("crisis support") || lowerResponse.includes("988") || lowerResponse.includes("emergency")) {
          setMessages(prev => [...prev, { 
            id: Date.now() + 1, sender: 'bot', text: aiResponseText, isCrisis: true 
          }]);
          setView('crisis');
        } else {
          setMessages(prev => [...prev, { 
            id: Date.now() + 1, sender: 'bot', text: aiResponseText 
          }]);
        }
      }
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, sender: 'bot', text: "I'm having a little trouble connecting to my logic core. Let's take a deep breath and try again in a moment." 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="h-[calc(100vh-80px)] max-w-6xl mx-auto p-4 flex gap-6">
      
      {/* ================= SIDEBAR ================= */}
      <div className="hidden lg:flex w-80 flex-col gap-4">
        <Card className="flex-1 bg-white border-none shadow-xl shadow-stone-200/40 rounded-[2rem] p-6">
          <h3 className="font-serif text-xl text-stone-800 mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-500" /> Therapy Tools
          </h3>
          
          <div className="space-y-4">
            {/* CBT Toggle Button */}
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

            <button onClick={() => setView('crisis')} className="w-full text-left p-4 rounded-2xl bg-stone-50 hover:bg-red-50 text-stone-700 hover:text-red-700 transition-colors border border-stone-100 hover:border-red-200 flex items-center gap-3 font-medium">
              <ShieldAlert className="w-5 h-5 text-red-400" /> Crisis Support
            </button>

            <button onClick={() => setView('journal')} className="w-full text-left p-4 rounded-2xl bg-stone-50 hover:bg-stone-100 text-stone-700 transition-colors border border-stone-100 flex items-center gap-3 font-medium">
              <BookOpen className="w-5 h-5 text-stone-400" /> Journaling
            </button>
          </div>

          {/* CBT Progress Tracker */}
          <AnimatePresence>
            {isCBTMode && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }}
                className="mt-8 pt-8 border-t border-stone-100 overflow-hidden"
              >
                <h3 className="font-serif text-xs font-bold text-stone-400 mb-6 uppercase tracking-widest">Active Session Progress</h3>
                <div className="space-y-5 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-stone-200 before:to-transparent">
                  {['Intake', 'Identify', 'Awareness', 'Patterns', 'Reframe'].map((step, idx) => (
                    <div key={step} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 bg-white z-10 ${cbtStep === step ? 'border-teal-500' : 'border-stone-200'}`}>
                        {cbtStep === step && <div className="w-2 h-2 bg-teal-500 rounded-full" />}
                      </div>
                      <div className={`ml-4 text-sm ${cbtStep === step ? 'font-bold text-teal-800' : 'text-stone-400 font-medium'}`}>
                        {step}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>

      {/* ================= MAIN CHAT AREA ================= */}
      <div className="flex-1 flex flex-col bg-[#fcfcfc] rounded-[2.5rem] shadow-xl shadow-stone-200/50 border border-stone-100 overflow-hidden relative">
        
        {/* Chat Header */}
        <div className="px-8 py-5 border-b border-stone-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center border border-teal-200 shadow-sm">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-stone-800 text-lg flex items-center gap-2">
                SoulSpark 
                {isCBTMode && <span className="bg-teal-100 text-teal-800 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider font-bold">CBT Mode</span>}
              </h3>
              <p className="text-xs text-stone-500 font-medium">{isCBTMode ? `Session ${sessionNumber}: ${cbtStep}` : 'AI Wellness Companion'}</p>
            </div>
          </div>
          <button 
            onClick={() => setMessages([{ id: 1, sender: 'bot', text: "Chat cleared. How can I help you today?" }])} 
            className="text-stone-400 hover:text-stone-700 p-2 transition-colors bg-stone-50 hover:bg-stone-100 rounded-full"
            title="Restart Conversation"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div 
                key={msg.id} 
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  
                  {/* Bot Avatar next to message */}
                  {msg.sender === 'bot' && (
                    <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0 mt-auto border border-teal-100">
                      <Bot className="w-4 h-4 text-teal-600" />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className={`p-4 shadow-sm text-[15px] leading-relaxed ${
                    msg.sender === 'user' 
                      ? 'bg-teal-700 text-white rounded-2xl rounded-br-sm shadow-teal-900/10' 
                      : msg.isCrisis 
                        ? 'bg-red-50 text-red-800 border border-red-200 rounded-2xl rounded-bl-sm'
                        : 'bg-white text-stone-700 border border-stone-100 rounded-2xl rounded-bl-sm shadow-stone-200/30'
                  }`}>
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                    
                    {/* Homework Tag */}
                    {msg.homework && (
                      <div className="mt-4 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50 text-sm text-indigo-900 font-medium">
                        <p className="font-bold flex items-center gap-2 mb-1">
                          <BookOpen className="w-4 h-4" /> Homework Assigned:
                        </p>
                        <p className="text-indigo-800/80">{msg.homework}</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Input Area */}
        <div className="p-6 bg-gradient-to-t from-[#fcfcfc] via-[#fcfcfc] to-transparent pt-10">
          <div className="max-w-4xl mx-auto relative flex items-center bg-white shadow-lg shadow-stone-200/50 rounded-full border border-stone-200 p-2 focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-400 transition-all">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isCBTMode ? "Continue your CBT session..." : "Share what's on your mind..."}
              className="flex-1 bg-transparent border-0 px-6 py-3 text-[15px] text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-0"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="w-12 h-12 rounded-full bg-teal-600 hover:bg-teal-700 disabled:bg-stone-200 disabled:text-stone-400 text-white flex items-center justify-center transition-colors flex-shrink-0"
            >
              <Send className="w-5 h-5 ml-1" />
            </button>
          </div>
          <div className="text-center mt-3">
            <span className="text-[11px] font-medium text-stone-400 tracking-wide uppercase">SoulSpark AI is not a replacement for professional medical help.</span>
          </div>
        </div>

      </div>
    </div>
  );
};

// Sleek Bouncing Typing Indicator
const TypingIndicator = () => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
    className="flex justify-start pl-11"
  >
    <div className="bg-white px-5 py-4 rounded-2xl rounded-bl-sm border border-stone-100 shadow-sm flex gap-1.5 items-center w-fit">
      <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut", delay: 0 }} className="w-2 h-2 bg-teal-400 rounded-full" />
      <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut", delay: 0.15 }} className="w-2 h-2 bg-teal-400 rounded-full" />
      <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut", delay: 0.3 }} className="w-2 h-2 bg-teal-400 rounded-full" />
    </div>
  </motion.div>
);

export default Chatbot;
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, User, Bot, CheckCircle, StopCircle, Lock, Paperclip, X, FileText, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { ClinicalService } from '../../lib/supabaseService';

// --- Custom Animated Typing Indicator ---
const TypingIndicator = () => (
  <div className="flex items-center gap-1.5 p-5 bg-white border border-stone-200 text-stone-500 rounded-[2rem] rounded-tl-sm w-fit shadow-sm">
    <motion.div className="w-2 h-2 bg-emerald-400 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0 }} />
    <motion.div className="w-2 h-2 bg-emerald-400 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} />
    <motion.div className="w-2 h-2 bg-emerald-400 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }} />
  </div>
);

const Chatbot = ({ session, setView }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const [attachment, setAttachment] = useState(null);
  const fileInputRef = useRef(null);

  const [sessionDayNumber, setSessionDayNumber] = useState(1);
  const [dailySessionIndex, setDailySessionIndex] = useState(1);
  const [sessionStartTime, setSessionStartTime] = useState(new Date());
  const [isSafetyFlagged, setIsSafetyFlagged] = useState(false);
  const [isSessionComplete, setIsSessionComplete] = useState(false);

  const [dailyMessageCount, setDailyMessageCount] = useState(0);
  const MESSAGE_LIMIT = 7;
  const user = session?.user;

  const isPremium = useMemo(() => {
    const tier = user?.clinical_tier || user?.user_metadata?.clinical_tier;
    const premiumBool = user?.is_premium || user?.user_metadata?.is_premium;
    return tier === 'premium' || premiumBool === true;
  }, [user]);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isSessionComplete]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  useEffect(() => {
    const loadHistory = async () => {
      if (user) {
        try {
          const dayNumber = await ClinicalService.getUserSessionNumber(user.id);
          setSessionDayNumber(dayNumber);
          const history = await ClinicalService.getTodayChatHistory(user.id);
          
          if (history && history.length > 0) {
            setMessages(history);
            const userMsgsToday = history.filter(msg => msg.sender === 'user' && !msg.text.includes('SESSION_SYSTEM_FLAG')).length;
            setDailyMessageCount(userMsgsToday);

            let completedSessionsToday = 0;
            let isCurrentlyLocked = false;
            history.forEach(msg => {
              if (msg.text.includes("SESSION_SYSTEM_FLAG:COMPLETED")) { completedSessionsToday++; isCurrentlyLocked = true; }
              if (msg.text.includes("SESSION_SYSTEM_FLAG:STARTED_NEW")) { isCurrentlyLocked = false; }
            });

            setDailySessionIndex(Math.min(completedSessionsToday + 1, 3));
            setIsSessionComplete(isCurrentlyLocked);
          } else {
            const greeting = { id: 'init', sender: 'bot', text: `Welcome to Day ${dayNumber}. I'm here, and I'm listening.` };
            setMessages([greeting]);
            await ClinicalService.saveChatMessage(user.id, 'bot', greeting.text);
          }
        } catch (err) {
          console.error("Initialization error:", err);
        }
      }
      setIsInitializing(false);
    };
    loadHistory();
  }, [user, isPremium]);

  const handleAttachmentClick = () => {
    if (!isPremium) {
      if(window.confirm("Document analysis is a SoulSpark Pro feature. Would you like to upgrade?")) navigate('/pricing');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("File is too large. Please select a file smaller than 5MB."); return; }
    const reader = new FileReader();
    reader.onload = (event) => setAttachment({ name: file.name, type: file.type, base64: event.target.result });
    reader.readAsDataURL(file);
    e.target.value = ''; 
  };

  const removeAttachment = () => setAttachment(null);

  const triggerSessionEnd = async () => {
    setIsSessionComplete(true);
    setShowConfirmModal(false); 
    const closingText = "Session concluded. Thank you for checking in.";
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: closingText }]);
    await ClinicalService.saveChatMessage(user.id, 'bot', closingText);
    await ClinicalService.saveChatMessage(user.id, 'bot', `[System: SESSION_SYSTEM_FLAG:COMPLETED_SESSION_${dailySessionIndex}]`);
  };

  const handleStartNextSession = async () => {
    if (dailySessionIndex >= 3) return;
    const nextIndex = dailySessionIndex + 1;
    setDailySessionIndex(nextIndex);
    setIsSessionComplete(false);
    setSessionStartTime(new Date());
    await ClinicalService.saveChatMessage(user.id, 'user', `[System: SESSION_SYSTEM_FLAG:STARTED_NEW_SESSION_${nextIndex}]`);
    const nextGreeting = { id: Date.now().toString(), sender: 'bot', text: `Welcome back to Session ${nextIndex}. How are you feeling right now?` };
    setMessages(prev => [...prev, nextGreeting]);
    await ClinicalService.saveChatMessage(user.id, 'bot', nextGreeting.text);
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if ((!input.trim() && !attachment) || !user || isSafetyFlagged || isSessionComplete) return;

    if (!isPremium && dailyMessageCount >= MESSAGE_LIMIT) { navigate('/pricing'); return; }

    const userText = input.trim();
    const currentAttachment = attachment; 
    setInput('');
    setAttachment(null); 
    if (inputRef.current) inputRef.current.style.height = 'auto';

    const newUserMsg = { id: Date.now().toString(), sender: 'user', text: userText || "Analyzed uploaded file.", attachment: currentAttachment };
    setMessages(prev => [...prev, newUserMsg]);
    setDailyMessageCount(prev => prev + 1);

    await ClinicalService.saveChatMessage(user.id, 'user', userText || "Uploaded a file for analysis.");
    setIsLoading(true);

    try {
      const sessionStatePayload = {
        session_number: sessionDayNumber, 
        daily_index: dailySessionIndex,
        start_time: sessionStartTime.toISOString(),
        current_time: new Date().toISOString(),
        user_input: userText,
        attached_file: currentAttachment 
      };

      const aiResponse = await ClinicalService.processAdvancedTherapyChat(sessionStatePayload, messages, user.id);
      if (aiResponse.safety_flag) setIsSafetyFlagged(true);

      const newBotMsg = { id: (Date.now() + 1).toString(), sender: 'bot', text: aiResponse.chat_response || "I am processing..." };
      setMessages(prev => [...prev, newBotMsg]);
      await ClinicalService.saveChatMessage(user.id, 'bot', newBotMsg.text);

      if (aiResponse.session_meta?.session_status === "COMPLETED") triggerSessionEnd();
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: "Sorry, I had trouble processing that request." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing) return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-stone-50 text-emerald-600">
      <div className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    // 1. FULL SCREEN WRAPPER WITH CREME BACKGROUND
    <div className="fixed inset-0 z-[100] flex flex-col bg-stone-50 text-stone-800">
      
      {/* 2. SPACIOUS HEADER (Glassmorphic Creme) */}
      <div className="shrink-0 bg-stone-50/90 backdrop-blur-md border-b border-stone-200 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-5">
          
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-stone-500 hover:text-stone-800 hover:bg-stone-200 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <h1 className="text-2xl font-serif text-stone-800 flex items-center gap-2">
            SoulSpark AI
            {isPremium && <span className="text-[10px] font-sans bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md uppercase tracking-widest font-black">Pro</span>}
          </h1>
          
          <div className="w-10 flex justify-end">
            {!isSessionComplete && (
               <button onClick={() => setShowConfirmModal(true)} className="p-2 -mr-2 text-stone-400 hover:text-rose-500 rounded-full hover:bg-rose-50 transition-colors">
                  <StopCircle className="w-5 h-5"/>
               </button>
            )}
          </div>

        </div>
      </div>

      {/* 3. WIDE & SCROLLABLE CHAT AREA */}
      <div className="flex-1 overflow-y-auto scroll-smooth px-4 sm:px-8">
        <div className="max-w-3xl mx-auto min-h-full flex flex-col pb-12 pt-16">
          
          {/* CAPABILITIES (Empty State) - Pushed down heavily for breathing room */}
          {messages.length <= 1 ? (
            <div className="flex-1 flex flex-col items-center justify-start text-center max-w-lg mx-auto pt-10 sm:pt-20">
              <div className="w-20 h-20 bg-emerald-50 shadow-sm border border-emerald-100 rounded-full flex items-center justify-center mb-6">
                <Bot className="w-10 h-10 text-emerald-600 stroke-1" />
              </div>
              <h2 className="text-3xl font-serif text-stone-700 mb-10">Sanctuary Capabilities</h2>

              <div className="w-full space-y-5">
                <div className="bg-white rounded-[2rem] p-6 border border-stone-100 shadow-sm text-center">
                  <p className="font-semibold text-lg text-emerald-800">Reflective Listening</p>
                  <p className="text-stone-500 mt-2">(A safe, judgment-free space to vent)</p>
                </div>
                <div className="bg-white rounded-[2rem] p-6 border border-stone-100 shadow-sm text-center">
                  <p className="font-semibold text-lg text-emerald-800">Clinical Frameworks</p>
                  <p className="text-stone-500 mt-2">(Guided CBT and DBT exercises)</p>
                </div>
                <div className="bg-white rounded-[2rem] p-6 border border-stone-100 shadow-sm text-center">
                  <p className="font-semibold text-lg text-emerald-800">Document Analysis</p>
                  <p className="text-stone-500 mt-2">(Upload previous clinical reports for insight)</p>
                </div>
              </div>
            </div>
          ) : (
            
            /* MESSAGES FEED WITH HEAVY SPACING */
            <div className="space-y-10">
              <AnimatePresence initial={false}>
                {messages.map((msg, index) => {
                  if (index === 0) return null; 
                  const isUser = msg.sender === 'user';

                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
                      key={msg.id || index} 
                      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`px-6 py-4 text-[16px] leading-relaxed max-w-[90%] sm:max-w-[70%] shadow-sm ${
                          isUser 
                            ? 'bg-emerald-700 text-emerald-50 rounded-[1.5rem] rounded-br-sm' 
                            : 'bg-white border border-stone-200 text-stone-700 rounded-[1.5rem] rounded-tl-sm'
                        }`}>
                          {msg.attachment && (
                            <div className="mb-3 opacity-90 flex items-center gap-2 text-sm bg-black/10 p-2 rounded-xl w-fit">
                              <FileText size={18} /> {msg.attachment.name}
                            </div>
                          )}
                          {msg.text.replace(/\*\*/g, '')}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {isLoading && <div className="flex justify-start"><TypingIndicator /></div>}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>
      </div>

      {/* 4. FLOATING INPUT AREA WITH CREME BLEND */}
      <div className="shrink-0 bg-gradient-to-t from-stone-50 via-stone-50 to-transparent pt-8 pb-8 sm:pb-12 px-4 sm:px-8 border-t border-stone-200/50">
        {!isSessionComplete ? (
          <div className="max-w-3xl mx-auto relative">
            
            {/* Attachment Preview above input */}
            {attachment && (
              <div className="mb-4 p-4 bg-white rounded-2xl flex items-center justify-between text-sm shadow-sm border border-stone-200">
                 <span className="truncate max-w-[250px] text-stone-700 font-medium flex items-center gap-3">
                   <FileText className="w-5 h-5 text-emerald-600"/> {attachment.name}
                 </span>
                 <button onClick={removeAttachment} className="text-stone-400 hover:text-rose-500 bg-stone-50 rounded-full p-2"><X className="w-4 h-4"/></button>
              </div>
            )}

            {/* Roomy Input Form */}
            <form onSubmit={handleSend} className="flex items-end gap-3 sm:gap-4">
              <div className="flex-1 bg-white border border-stone-200 rounded-[2rem] flex items-center px-4 py-2 shadow-sm transition-all focus-within:ring-4 focus-within:ring-emerald-100 focus-within:border-emerald-300">
                <textarea 
                  ref={inputRef}
                  value={input} 
                  onChange={(e) => setInput(e.target.value)} 
                  placeholder="Share what's on your mind..." 
                  disabled={isLoading || isSafetyFlagged} 
                  rows={1}
                  className="flex-1 bg-transparent px-2 py-3 outline-none text-stone-700 placeholder:text-stone-400 resize-none max-h-40 text-base" 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); }
                  }}
                />
                <button type="button" onClick={handleAttachmentClick} disabled={isLoading || isSafetyFlagged} className="p-3 text-stone-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-full transition-colors relative">
                  <Paperclip className="w-6 h-6" />
                  {!isPremium && <div className="absolute top-1 right-1 bg-stone-200 rounded-full p-[2px]"><Lock className="w-3 h-3 text-stone-500" /></div>}
                </button>
              </div>
              
              <button 
                type="submit" 
                disabled={isLoading || (!input.trim() && !attachment)} 
                className="w-14 h-14 shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full flex items-center justify-center shadow-md disabled:opacity-50 transition-colors"
              >
                <Send className="w-6 h-6 ml-0.5" />
              </button>
            </form>

          </div>
        ) : (
          <div className="max-w-3xl mx-auto text-center pb-4">
            <p className="text-base font-bold text-emerald-600 mb-4"><CheckCircle className="w-6 h-6 inline mr-2 align-text-bottom"/> Daily Check-ins Complete</p>
            {dailySessionIndex < 3 && (
              <button onClick={handleStartNextSession} className="px-10 py-4 bg-stone-800 hover:bg-stone-900 text-white text-lg font-bold rounded-full shadow-md transition-transform">
                Start Session {dailySessionIndex + 1}
              </button>
            )}
          </div>
        )}
      </div>

      {/* 5. CONFIRMATION MODAL */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="absolute inset-0 bg-stone-900/40 flex items-center justify-center z-[110] p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white p-10 rounded-[2.5rem] w-full max-w-md text-center shadow-2xl">
              <h3 className="text-2xl font-serif mb-3 text-stone-800">End Session?</h3>
              <p className="text-stone-500 text-base mb-10">You can start a new session later today.</p>
              <div className="flex gap-4">
                <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-4 text-stone-600 font-bold rounded-2xl bg-stone-100 hover:bg-stone-200 text-lg">Cancel</button>
                <button onClick={triggerSessionEnd} className="flex-1 py-4 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl shadow-md text-lg">End Now</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chatbot;
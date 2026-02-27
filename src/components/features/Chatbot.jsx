import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, Sparkles, User, Bot, CheckCircle, ArrowRight, StopCircle, Lock, RefreshCw, Paperclip, X, FileText, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { ClinicalService } from '../../lib/supabaseService';

const Chatbot = ({ session, setView }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // FILE UPLOAD STATE
  const [attachment, setAttachment] = useState(null);
  const fileInputRef = useRef(null);

  // SESSION TRACKING STATE
  const [sessionDayNumber, setSessionDayNumber] = useState(1);
  const [dailySessionIndex, setDailySessionIndex] = useState(1);
  const [sessionStartTime, setSessionStartTime] = useState(new Date());
  const [isSafetyFlagged, setIsSafetyFlagged] = useState(false);
  const [isSessionComplete, setIsSessionComplete] = useState(false);

  // LIMIT TRACKING
  const [dailyMessageCount, setDailyMessageCount] = useState(0);
  const MESSAGE_LIMIT = 7;
  const user = session?.user;

  // --- BULLETPROOF PREMIUM CHECK ---
  const isPremium = useMemo(() => {
    const tier = user?.clinical_tier || user?.user_metadata?.clinical_tier;
    const premiumBool = user?.is_premium || user?.user_metadata?.is_premium;
    return tier === 'premium' || premiumBool === true;
  }, [user]);

  // MODAL STATE
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isSessionComplete]);

  useEffect(() => {
    const loadHistory = async () => {
      if (user) {
        try {
          const dayNumber = await ClinicalService.getUserSessionNumber(user.id);
          setSessionDayNumber(dayNumber);
          const history = await ClinicalService.getTodayChatHistory(user.id);
          
          if (history && history.length > 0) {
            setMessages(history);
            const userMsgsToday = history.filter(msg => 
              msg.sender === 'user' && !msg.text.includes('SESSION_SYSTEM_FLAG')
            ).length;
            setDailyMessageCount(userMsgsToday);

            let completedSessionsToday = 0;
            let isCurrentlyLocked = false;
            history.forEach(msg => {
              if (msg.text.includes("SESSION_SYSTEM_FLAG:COMPLETED")) {
                completedSessionsToday++;
                isCurrentlyLocked = true;
              }
              if (msg.text.includes("SESSION_SYSTEM_FLAG:STARTED_NEW")) {
                isCurrentlyLocked = false;
              }
            });

            setDailySessionIndex(Math.min(completedSessionsToday + 1, 3));
            setIsSessionComplete(isCurrentlyLocked);
          } else {
            const greetingText = isPremium 
              ? `Welcome to Day ${dayNumber}, Session 1. You can now upload past clinical reports (PDF) or images for analysis.`
              : `Welcome to Day ${dayNumber}, Session 1. I'm ready to listen whenever you are.`;
              
            const greeting = { id: 'init', sender: 'bot', text: greetingText };
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
      if(window.confirm("Document analysis is a SoulSpark Pro feature. Would you like to upgrade?")) {
        navigate('/pricing');
      }
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Please select a file smaller than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachment({ name: file.name, type: file.type, base64: event.target.result });
    };
    reader.readAsDataURL(file);
    e.target.value = ''; 
  };

  const removeAttachment = () => setAttachment(null);

  const triggerSessionEnd = async () => {
    setIsSessionComplete(true);
    setShowConfirmModal(false); 
    const closingText = "Session concluded. Thank you for checking in.";
    const closingMsg = { id: Date.now().toString(), sender: 'bot', text: closingText };
    setMessages(prev => [...prev, closingMsg]);
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

    // --- UPDATED UNLIMITED CHAT LOGIC ---
    if (!isPremium && dailyMessageCount >= MESSAGE_LIMIT) {
      navigate('/pricing');
      return;
    }

    const userText = input.trim();
    const currentAttachment = attachment; 
    setInput('');
    setAttachment(null); 

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

      if (aiResponse.session_meta?.session_status === "COMPLETED") {
          triggerSessionEnd();
      }
    } catch (error) {
      console.error("Chat Error:", error);
      const errorMsg = { id: Date.now().toString(), sender: 'bot', text: "Sorry, I had trouble processing that request. Please try again." };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatText = (text) => {
    if (!text || text.includes('SESSION_SYSTEM_FLAG')) return null;
    return text.split(/(\*\*.*?\*\*)/).map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  if (isInitializing) return (
    <div className="flex-1 flex items-center justify-center p-8 text-stone-400">
      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col h-[85vh] max-w-4xl mx-auto p-4 md:p-8 animate-fade-in pb-24 relative">
      
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-stone-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
            <Bot className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-xl font-serif text-stone-800 dark:text-zinc-100 flex items-center gap-2">
            Session {dailySessionIndex}/3
            {isPremium && <span className="ml-2 px-2 py-0.5 text-[10px] bg-amber-100 text-amber-700 rounded-md font-bold uppercase">Pro</span>}
          </h2>
        </div>
        {!isSessionComplete && !isSafetyFlagged && (
          <button onClick={() => setShowConfirmModal(true)} className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-emerald-700 bg-stone-100 dark:bg-zinc-800 rounded-lg transition-all">
            <StopCircle className="w-4 h-4" /> End Session
          </button>
        )}
      </div>

      {/* --- USAGE STATUS BAR (Hides for Pro Users) --- */}
      {!isPremium && !isSessionComplete && (
        <div className="mb-4 flex items-center justify-between px-4 py-2 bg-stone-50 dark:bg-zinc-900 border border-stone-100 dark:border-zinc-800 rounded-xl">
           <span className="text-[11px] text-stone-500 uppercase tracking-widest font-black">Daily Allowance</span>
           <div className="flex items-center gap-3">
              <div className="w-24 h-1.5 bg-stone-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div 
                    className={`h-full ${dailyMessageCount >= 5 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    initial={{ width: 0 }} animate={{ width: `${(dailyMessageCount / MESSAGE_LIMIT) * 100}%` }}
                  />
              </div>
              <span className="text-xs font-bold text-stone-600">{dailyMessageCount}/{MESSAGE_LIMIT}</span>
           </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-stone-100 dark:border-zinc-800 p-4 md:p-6 mb-4">
        <div className="space-y-6">
          {messages.map((msg, index) => {
            const formatted = formatText(msg.text);
            if (!formatted && !msg.attachment) return null;
            return (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={msg.id || index} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div className="flex items-end gap-2 max-w-[85%]">
                  {msg.sender === 'bot' && <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mb-1"><Bot className="w-4 h-4 text-emerald-600" /></div>}
                  <div className={`p-4 rounded-2xl text-sm flex flex-col gap-2 ${msg.sender === 'user' ? 'bg-stone-800 text-white rounded-br-sm' : 'bg-stone-50 dark:bg-zinc-800 text-stone-800 dark:text-zinc-200 border border-stone-100 rounded-bl-sm'}`}>
                    {msg.attachment && (
                      <div className={`p-2 rounded-lg flex flex-col gap-1 ${msg.sender === 'user' ? 'bg-white/10' : 'bg-white'}`}>
                        {msg.attachment.type.startsWith('image/') ? <img src={msg.attachment.base64} alt="uploaded" className="max-w-[200px] rounded-md" /> : <div className="flex items-center gap-2 text-xs opacity-80"><FileText size={16} /> {msg.attachment.name}</div>}
                      </div>
                    )}
                    {formatted}
                  </div>
                  {msg.sender === 'user' && <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center mb-1"><User className="w-4 h-4 text-stone-600" /></div>}
                </div>
              </motion.div>
            );
          })}
          {isLoading && <div className="flex gap-1 p-4"><span className="w-2 h-2 bg-stone-300 rounded-full animate-bounce" /></div>}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {!isSessionComplete ? (
        <div className="relative mt-auto">
          {!isPremium && dailyMessageCount >= MESSAGE_LIMIT ? (
            <div className="p-6 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-3xl text-center">
               <Lock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
               <p className="text-sm text-amber-800 font-bold mb-3">Daily limit reached.</p>
               <button onClick={() => navigate('/pricing')} className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg hover:bg-emerald-700 transition-all">Upgrade for Unlimited AI</button>
            </div>
          ) : (
            <div className="relative">
              <AnimatePresence>
                {attachment && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute bottom-full mb-3 left-0 bg-stone-800 text-white p-2 pr-4 rounded-xl flex items-center gap-3 shadow-lg z-10 border border-stone-600">
                    <div className="w-10 h-10 bg-stone-700 rounded-lg flex items-center justify-center overflow-hidden">
                      {attachment.type.startsWith('image/') ? <img src={attachment.base64} alt="preview" className="w-full h-full object-cover" /> : <FileText className="w-5 h-5 text-emerald-400" />}
                    </div>
                    <div className="flex flex-col"><span className="text-xs font-bold truncate max-w-[150px]">{attachment.name}</span><span className="text-[10px] text-stone-400">Ready to analyze</span></div>
                    <button onClick={removeAttachment} className="ml-2 p-1 hover:bg-stone-600 rounded-full transition-colors"><X className="w-4 h-4" /></button>
                  </motion.div>
                )}
              </AnimatePresence>
              <form onSubmit={handleSend} className="relative flex items-center gap-2">
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/png, image/jpeg, application/pdf" className="hidden" />
                <button type="button" onClick={handleAttachmentClick} disabled={isLoading || isSafetyFlagged} className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full transition-colors relative ${isPremium ? 'bg-white dark:bg-zinc-900 border border-stone-200 text-stone-500 hover:text-emerald-600 hover:bg-emerald-50' : 'bg-stone-100 dark:bg-zinc-800 border border-stone-200 text-stone-400'}`}>
                  <Paperclip className="w-5 h-5" />
                  {!isPremium && <div className="absolute -top-1 -right-1 bg-amber-100 rounded-full p-0.5 border border-amber-200"><Lock className="w-3 h-3 text-amber-600" /></div>}
                </button>
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={attachment ? "Add a message about this file..." : "Share what's on your mind..."} disabled={isLoading || isSafetyFlagged} className="w-full pl-6 pr-16 py-4 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-full focus:ring-2 focus:ring-emerald-500" />
                <button type="submit" disabled={isLoading || (!input.trim() && !attachment)} className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-emerald-600 text-white rounded-full disabled:opacity-50 transition-opacity"><Send className="w-5 h-5 ml-1" /></button>
              </form>
            </div>
          )}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative mt-auto p-6 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-3xl text-center">
          {dailySessionIndex < 3 ? (
            <>
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-xl font-serif text-stone-800 dark:text-zinc-200 mb-2">Session {dailySessionIndex} Complete</h3>
              <p className="text-sm text-stone-500 mb-6">Take a moment to breathe. You can start your next session now.</p>
              <button onClick={handleStartNextSession} className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg hover:bg-emerald-700 transition-all flex items-center gap-2 mx-auto">Start Session {dailySessionIndex + 1} <ArrowRight className="w-4 h-4" /></button>
            </>
          ) : (
            <>
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-xl font-serif text-stone-800 dark:text-zinc-200 mb-2">Daily Sanctuary Check-in Complete</h3>
              <p className="text-sm text-stone-500">You've finished your 3 daily sessions. Take this stability into the rest of your day!</p>
            </>
          )}
        </motion.div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl w-full max-w-sm text-center shadow-2xl mx-4">
            <h3 className="text-xl font-serif mb-4">End current session?</h3>
            <div className="flex gap-4">
              <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-3 text-stone-500 rounded-xl bg-stone-100 hover:bg-stone-200 transition-colors">Back</button>
              <button onClick={triggerSessionEnd} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors">Yes, End Now</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
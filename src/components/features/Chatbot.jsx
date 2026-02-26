import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, User, Bot, CheckCircle, ArrowRight, StopCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { ClinicalService } from '../../lib/supabaseService';

const Chatbot = ({ setView }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // SESSION TRACKING STATE
  const [sessionDayNumber, setSessionDayNumber] = useState(1);
  const [dailySessionIndex, setDailySessionIndex] = useState(1);
  const [sessionStartTime, setSessionStartTime] = useState(new Date());
  const [isSafetyFlagged, setIsSafetyFlagged] = useState(false);
  const [isSessionComplete, setIsSessionComplete] = useState(false);

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
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const dayNumber = await ClinicalService.getUserSessionNumber(user.id);
        setSessionDayNumber(dayNumber);

        const history = await ClinicalService.getTodayChatHistory(user.id);
        
        if (history && history.length > 0) {
          setMessages(history);
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
          const greeting = { id: 'init', sender: 'bot', text: `Welcome to Day ${dayNumber}, Session 1. I'm ready to listen whenever you are.` };
          setMessages([greeting]);
          await ClinicalService.saveChatMessage(user.id, 'bot', greeting.text);
        }
      }
      setIsInitializing(false);
    };
    loadHistory();
  }, []);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || !userId || isSafetyFlagged || isSessionComplete) return;

    const userText = input.trim();
    setInput('');
    
    const newUserMsg = { id: Date.now().toString(), sender: 'user', text: userText };
    setMessages(prev => [...prev, newUserMsg]);
    await ClinicalService.saveChatMessage(userId, 'user', userText);
    
    setIsLoading(true);

    try {
      const sessionStatePayload = {
        session_number: sessionDayNumber, 
        daily_index: dailySessionIndex,
        start_time: sessionStartTime.toISOString(),
        current_time: new Date().toISOString(),
        user_input: userText
      };

      const aiResponse = await ClinicalService.processAdvancedTherapyChat(sessionStatePayload, messages, userId);
      
      if (aiResponse.safety_flag) setIsSafetyFlagged(true);

      const newBotMsg = { id: (Date.now() + 1).toString(), sender: 'bot', text: aiResponse.chat_response || "I am processing..." };
      setMessages(prev => [...prev, newBotMsg]);
      await ClinicalService.saveChatMessage(userId, 'bot', newBotMsg.text);

      if (aiResponse.dashboard_updates?.wellbeing_score) {
        let normalizedScore = Math.ceil(aiResponse.dashboard_updates.wellbeing_score / 2);
        await ClinicalService.updateDailyWellness(userId, new Date().toLocaleDateString('en-CA'), { mood_rating: normalizedScore });
      }

      if (aiResponse.session_meta?.session_status === "COMPLETED") {
          triggerSessionEnd();
      }
    } catch (error) {
      console.error("Chat Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Triggers the modal open state
  const handleEndClick = () => setShowConfirmModal(true);

  // Actually ends the session
  const triggerSessionEnd = async () => {
    setIsSessionComplete(true);
    setShowConfirmModal(false); 
    
    const closingText = "Session concluded. Thank you for taking the time to check in with yourself today.";
    const closingMsg = { id: Date.now().toString(), sender: 'bot', text: closingText };
    setMessages(prev => [...prev, closingMsg]);
    await ClinicalService.saveChatMessage(userId, 'bot', closingText);

    // CRITICAL: Dashboard looks for this flag to increase the session count
    await ClinicalService.saveChatMessage(userId, 'bot', `[System: SESSION_SYSTEM_FLAG:COMPLETED_SESSION_${dailySessionIndex}]`);
  };

  const handleStartNextSession = async () => {
    if (dailySessionIndex >= 3) return;
    const nextIndex = dailySessionIndex + 1;
    setDailySessionIndex(nextIndex);
    setIsSessionComplete(false);
    setSessionStartTime(new Date());

    await ClinicalService.saveChatMessage(userId, 'user', `[System: SESSION_SYSTEM_FLAG:STARTED_NEW_SESSION_${nextIndex}]`);
    const nextGreeting = { id: Date.now().toString(), sender: 'bot', text: `Welcome back to Session ${nextIndex}. How are you feeling right now?` };
    setMessages(prev => [...prev, nextGreeting]);
    await ClinicalService.saveChatMessage(userId, 'bot', nextGreeting.text);
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
    <div className="flex-1 flex items-center justify-center p-8 text-stone-400 dark:text-zinc-500">
      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col h-[85vh] max-w-4xl mx-auto p-4 md:p-8 animate-fade-in pb-24 relative">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-stone-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-serif text-stone-800 dark:text-zinc-100 flex items-center gap-2">
              Day {sessionDayNumber} Session {dailySessionIndex}/3
            </h2>
          </div>
        </div>
        
        {!isSessionComplete && !isSafetyFlagged && (
          <button onClick={handleEndClick} className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-emerald-700 dark:text-zinc-400 dark:hover:text-emerald-400 bg-stone-100 dark:bg-zinc-800 rounded-lg transition-all">
            <StopCircle className="w-4 h-4" /> End Session
          </button>
        )}
      </div>

      {/* NEW COMBINED MODAL UI */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl w-full max-w-sm text-center shadow-2xl border border-stone-100 dark:border-zinc-800 mx-4">
            <h3 className="text-xl font-serif mb-4 text-stone-900 dark:text-zinc-100">End current session?</h3>
            <div className="flex gap-4">
              <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-3 text-stone-500 dark:text-zinc-400 hover:bg-stone-50 dark:hover:bg-zinc-800 rounded-xl transition-colors">Back</button>
              <button onClick={triggerSessionEnd} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors">Yes, End Now</button>
            </div>
          </div>
        </div>
      )}

      {/* CHAT WINDOW */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-stone-100 dark:border-zinc-800 p-4 md:p-6 mb-4">
        <div className="space-y-6">
          {messages.map((msg, index) => {
            const formatted = formatText(msg.text);
            if (!formatted) return null;
            return (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={msg.id || index} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div className="flex items-end gap-2 max-w-[85%] md:max-w-[75%]">
                  {msg.sender === 'bot' && (
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 mb-1 border border-emerald-200 dark:border-emerald-800">
                      <Bot className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  )}
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.sender === 'user' ? 'bg-stone-800 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-br-sm' : 'bg-stone-50 dark:bg-zinc-800 text-stone-800 dark:text-zinc-200 border border-stone-100 dark:border-zinc-700 rounded-bl-sm'}`}>{formatted}</div>
                  {msg.sender === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0 mb-1">
                      <User className="w-4 h-4 text-stone-600 dark:text-zinc-300" />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-end gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"><Bot className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /></div>
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-zinc-800 border border-stone-100 dark:border-zinc-700 rounded-bl-sm flex gap-1">
                <span className="w-2 h-2 rounded-full bg-stone-400 dark:bg-zinc-500 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-stone-400 dark:bg-zinc-500 animate-bounce delay-100" />
                <span className="w-2 h-2 rounded-full bg-stone-400 dark:bg-zinc-500 animate-bounce delay-200" />
              </div>
            </motion.div>
          )}

          {isSessionComplete && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 max-w-full p-6 border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex flex-col items-center text-center">
              <CheckCircle className="w-10 h-10 text-emerald-500 mb-3" />
              <h3 className="text-lg font-serif text-emerald-900 dark:text-emerald-100 mb-1">Session {dailySessionIndex} Complete</h3>
              <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-6">Great work checking in today. Take some time to process or work on your suggested homework.</p>
              <div className="flex gap-4">
                <button onClick={() => setView('dashboard')} className="px-6 py-2 bg-white dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-sm font-medium rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors">View Dashboard</button>
                {dailySessionIndex < 3 && (
                  <button onClick={handleStartNextSession} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2">Start Session {dailySessionIndex + 1} <ArrowRight className="w-4 h-4" /></button>
                )}
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {!isSessionComplete && (
        <form onSubmit={handleSend} className="relative mt-auto">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Share what's on your mind..." disabled={isLoading || isSafetyFlagged} className="w-full pl-6 pr-16 py-4 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 text-stone-800 dark:text-zinc-100 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm disabled:opacity-50" />
          <button type="submit" disabled={!input.trim() || isLoading || isSafetyFlagged} className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-50"><Send className="w-5 h-5 ml-1" /></button>
        </form>
      )}
    </div>
  );
};

export default Chatbot;
import React, { useState, useEffect, useRef } from 'react';
import { Sun, RefreshCw, ArrowRight, Wind, BookOpen, Activity, ShieldAlert, BrainCircuit } from 'lucide-react';
import { ClinicalService } from "../../lib/supabaseClient";
import Button from '../common/Button';
import Card from '../common/Card';

const Chatbot = ({ setView, userId }) => {
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      sender: 'bot', 
      text: "Hi there, I'm SoulSpark 🌟 I'm here to support you on your wellness journey.\n\nI'm an AI companion trained in CBT, DBT, and mindfulness. How are you feeling right now?" 
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // --- NEW CBT STATE TRACKING ---
  const [isCBTMode, setIsCBTMode] = useState(false);
  const [cbtStep, setCbtStep] = useState("Intake"); // Intake, Identify, Awareness, Patterns, Reframe
  const [sessionNumber, setSessionNumber] = useState(1);
  const [homeworkStatus, setHomeworkStatus] = useState("None");

  const messagesEndRef = useRef(null);
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    const userMsg = { id: Date.now(), sender: 'user', text: userText };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      if (isCBTMode) {
        // --- STRUCTURED CBT LOGIC ---
        const currentState = {
          session_number: sessionNumber,
          current_cbt_step: cbtStep,
          homework_status: homeworkStatus,
          user_input: userText
        };

        const aiResponse = await ClinicalService.processCBTInteraction(currentState);

        // 1. Check for Critical Safety Flag
        if (aiResponse.safety_flag) {
          setMessages(prev => [...prev, { 
            id: Date.now() + 1, 
            sender: 'bot', 
            text: aiResponse.response_text,
            isCrisis: true 
          }]);
          setView('crisis'); // Automatically switch to crisis view
          return;
        }

        // 2. Add AI response to chat
        setMessages(prev => [...prev, { 
          id: Date.now() + 1, 
          sender: 'bot', 
          text: aiResponse.response_text,
          homework: aiResponse.homework_assigned
        }]);

        // 3. Update Clinical State
        setCbtStep(aiResponse.updated_cbt_step);
        if (aiResponse.homework_assigned) setHomeworkStatus("Pending");

        // 4. Silent Logging of clinical notes
        await ClinicalService.saveActivityLog(userId, 'cbt-internal-note', {
          notes: aiResponse.clinical_notes,
          step: aiResponse.updated_cbt_step
        });

      } else {
        // --- GENERAL WELLNESS LOGIC ---
        // For now, keeping your simulated logic or connecting to a general AI call
        setTimeout(() => {
          let botResponse = "Thank you for sharing. Would you like to explore this further using a structured CBT session?";
          // (Insert your keyword logic here for general chat)
          setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: botResponse }]);
          setIsTyping(false);
        }, 1000);
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        sender: 'bot', 
        text: "I'm having trouble connecting to my logic core. Let's try again in a moment." 
      }]);
    } finally {
      if (isCBTMode) setIsTyping(false);
    }
  };

  return (
    <div className="h-[calc(100vh-80px)] max-w-5xl mx-auto p-4 flex gap-6">
      {/* Sidebar - Tools */}
      <div className="hidden lg:flex w-72 flex-col gap-4">
        <Card className="flex-1 bg-stone-50/50">
          <h3 className="font-serif text-lg text-stone-800 mb-4">Therapy Tools</h3>
          <div className="space-y-3">
            {/* CBT Toggle Button */}
            <button 
              onClick={() => setIsCBTMode(!isCBTMode)}
              className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 shadow-sm border ${
                isCBTMode 
                ? 'bg-stone-800 text-white border-stone-800' 
                : 'bg-white text-stone-600 border-transparent hover:bg-green-50'
              }`}
            >
              <BrainCircuit className="w-5 h-5" /> 
              {isCBTMode ? 'Exit CBT Session' : 'Start CBT Session'}
            </button>

            <button onClick={() => setView('crisis')} className="w-full text-left p-3 rounded-xl bg-white hover:bg-red-50 text-stone-600 flex items-center gap-3 shadow-sm">
              <ShieldAlert className="w-5 h-5 text-red-400" /> Crisis Support
            </button>

            <button onClick={() => setView('journal')} className="w-full text-left p-3 rounded-xl bg-white hover:bg-orange-50 text-stone-600 flex items-center gap-3 shadow-sm">
              <BookOpen className="w-5 h-5" /> Journaling
            </button>
          </div>

          {/* CBT Progress Tracker (Only visible in CBT Mode) */}
          {isCBTMode && (
            <div className="mt-8 border-t border-stone-200 pt-6">
              <h3 className="font-serif text-sm font-bold text-stone-800 mb-4 uppercase tracking-widest">Session Progress</h3>
              <div className="space-y-4">
                {['Intake', 'Identify', 'Awareness', 'Patterns', 'Reframe'].map((step) => (
                  <div key={step} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${cbtStep === step ? 'bg-green-500 animate-pulse' : 'bg-stone-200'}`} />
                    <span className={`text-xs ${cbtStep === step ? 'font-bold text-stone-800' : 'text-stone-400'}`}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white rounded-3xl shadow-lg border border-stone-100 overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-green-200 to-orange-100 flex items-center justify-center">
              <Sun className="w-6 h-6 text-stone-700" />
            </div>
            <div>
              <h3 className="font-bold text-stone-800">SoulSpark {isCBTMode && <span className="text-green-600 text-xs ml-2">• CBT MODE</span>}</h3>
              <p className="text-xs text-stone-500">{isCBTMode ? `Session ${sessionNumber}: ${cbtStep}` : 'AI Wellness Companion'}</p>
            </div>
          </div>
          <button onClick={() => setMessages([{ id: 1, sender: 'bot', text: "Chat cleared." }])} className="text-stone-400 hover:text-stone-600 p-2">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-stone-50/30">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                msg.sender === 'user' 
                  ? 'bg-stone-800 text-stone-50 rounded-tr-none' 
                  : msg.isCrisis 
                    ? 'bg-red-50 text-red-700 border-red-200 border rounded-tl-none'
                    : 'bg-white text-stone-700 border border-stone-100 rounded-tl-none'
              }`}>
                <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                
                {/* Homework Tag */}
                {msg.homework && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-800 font-medium">
                    <p className="font-bold flex items-center gap-1 mb-1">📝 Homework Assigned:</p>
                    {msg.homework}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-stone-100">
          <div className="flex gap-2 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isCBTMode ? "Continue the session..." : "Type a message..."}
              className="flex-1 bg-stone-50 border-0 rounded-xl px-4 py-3 text-stone-700 focus:ring-2 focus:ring-green-100 focus:bg-white transition-all"
            />
            <Button onClick={handleSend} variant="primary" className="rounded-xl px-4 shadow-md">
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TypingIndicator = () => (
  <div className="flex justify-start">
    <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-stone-100 shadow-sm flex gap-2 items-center">
      <div className="w-2 h-2 bg-stone-300 rounded-full animate-bounce"></div>
      <div className="w-2 h-2 bg-stone-300 rounded-full animate-bounce delay-75"></div>
      <div className="w-2 h-2 bg-stone-300 rounded-full animate-bounce delay-150"></div>
    </div>
  </div>
);

export default Chatbot;
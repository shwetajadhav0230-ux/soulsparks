import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- CONFIGURATION ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const aiApiKey = import.meta.env.VITE_AI_API_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Gemini SDK Initialization
const genAI = new GoogleGenerativeAI(aiApiKey);

export class ClinicalService {
  /**
   * SoulSpark AI Chat - Official SDK Version
   * Fixes: 404 (Not Found) and 400 (Invalid JSON)
   */
  static async processGeneralChat(userMessage, chatHistory = []) {
    if (!aiApiKey) return "API Key missing in environment.";

    try {
      // Initialize model with correct System Instruction format
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: "You are SoulSpark, an empathetic wellness guide. Use **bold** for focus. End with ONE question.",
      });

      // Format history properly for the SDK
      const history = chatHistory
        .filter(msg => msg.id !== 1)
        .map(msg => ({
          role: msg.sender === 'bot' ? 'model' : 'user',
          parts: [{ text: msg.text }],
        }));

      const chat = model.startChat({ history });
      const result = await chat.sendMessage(userMessage);
      const response = await result.response;
      
      return response.text();

    } catch (err) {
      console.error("SoulSpark AI Error:", err);
      
      // Handle Quota Limit (Error 429 - Image 2)
      if (err.message?.includes("429")) {
        return "I'm reflecting for a moment (Rate limit). Please try again in 60 seconds.";
      }
      
      return "I'm having a little trouble connecting. Let's take a **deep breath** and try again.";
    }
  }

  static async saveActivityLog(userId, type, details) {
    try {
      await supabase.from('activity_logs').insert([{ user_id: userId, type, details }]);
    } catch (err) {
      console.error("DB Error:", err);
    }
  }
}
import { createClient } from '@supabase/supabase-js';

const aiApiKey = import.meta.env.VITE_AI_API_KEY;
const genAI = new GoogleGenerativeAI(aiApiKey);

export class ClinicalService {
  /**
   * General Wellness AI Chat - Bulletproof SDK Version
   */
  static async processGeneralChat(userMessage, chatHistory = [], userId) {
    if (!aiApiKey) return "System Error: API Key is missing in .env file.";

    try {
      // Using '-latest' forces Google to find the active model endpoint, fixing the 404 error
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

      const persona = "SYSTEM INSTRUCTION: You are SoulSpark, an empathetic wellness guide. Use **bold** for key emotions. End with ONE gentle question.";

      // Formatting history safely
      const history = [
        { role: "user", parts: [{ text: persona }] },
        { role: "model", parts: [{ text: "Understood. I am SoulSpark, your empathetic wellness companion. How can I help you today?" }] },
        ...chatHistory
          .filter(msg => msg.id !== 1)
          .map(msg => ({
            role: msg.sender === 'bot' ? 'model' : 'user',
            parts: [{ text: msg.text }]
          }))
      ];

      const chat = model.startChat({ history });
      const result = await chat.sendMessage(userMessage);
      return result.response.text();

    } catch (err) {
      console.error("AI Service Error:", err);
      
      if (err.message?.includes("429")) return "I'm taking a short breather (Rate limit). Try again in a minute.";
      if (err.message?.includes("API key not valid")) return "Your API key is invalid. Please double-check your .env file.";
      
      return "I'm having a little trouble thinking. Let's take a deep breath and try again.";
    }
  }

  // --- Database Logic Below ---
  static async fetchModules() {
    const { data, error } = await supabase.from('modules').select('*').eq('is_published', true).order('title');
    if (error) throw new Error(`Module Fetch Error: ${error.message}`);
    return data;
  }

  static async getClinicalContent(moduleId) {
    const { data, error } = await supabase.from('modules').select(`*, units (id, title, order_index, activities (id, title, type, static_content, api_config, order_index))`).eq('id', moduleId).order('order_index', { foreignTable: 'units', ascending: true });
    if (error) throw new Error(`Content Load Error: ${error.message}`);
    return data?.[0] || null; 
  }

  static async saveActivityLog(userId, activityId, payload) {
    const { data, error } = await supabase.from('user_progress').upsert({
        user_id: userId, activity_id: activityId, user_data: payload, status: 'completed', completed_at: new Date().toISOString()
      }, { onConflict: 'user_id, activity_id' });
    if (error) throw new Error(`Save Log Error: ${error.message}`);
    return data;
  }

  static async getDailyWellness(userId, dateStr) {
    const { data, error } = await supabase.from('daily_wellness').select('*').eq('user_id', userId).eq('log_date', dateStr).single();
    if (error && error.code !== 'PGRST116') return null;
    return data || { mood_rating: null, hydration_count: 0, goal_completed: false };
  }

  static async updateDailyWellness(userId, dateStr, updates) {
    const { data, error } = await supabase.from('daily_wellness').upsert({
        user_id: userId, log_date: dateStr, ...updates, updated_at: new Date().toISOString()
      }, { onConflict: 'user_id, log_date' }).select().single();
    if (error) throw error;
    return data;
  }

  static async getWellnessHistory(userId, days) {
    const { data } = await supabase.from('daily_wellness').select('mood_rating').eq('user_id', userId).order('log_date', { ascending: false }).limit(days);
    return data ? data.reverse() : [];
  }

  static async processCBTInteraction(sessionState) {
    return {
      response_text: "Let's pause and reflect on that thought. Can you identify any cognitive distortions?",
      safety_flag: false,
      risk_level: "LOW",
      updated_cbt_step: sessionState.current_cbt_step,
      session_action: "CONTINUE",
      homework_assigned: null,
      clinical_notes: "Processed via standard logic."
    };
  }
}
import { supabase } from './supabaseClient'; 

const aiApiKey = import.meta.env.VITE_AI_API_KEY;

export class ClinicalService {
  
  // ====================================================
  // 1. FREE AI LOGIC (Powered by OpenRouter Auto-Router)
  // ====================================================

  /**
   * General Wellness AI Chat
   */
  static async processGeneralChat(userMessage, chatHistory = [], userId) {
    if (!aiApiKey) return "System Error: Missing VITE_AI_API_KEY in .env file.";

    const messages = [
      { 
        role: "system", 
        content: "You are SoulSpark, an empathetic wellness guide. Use **bold** for key emotions. End with ONE gentle question." 
      },
      ...chatHistory
        .filter(msg => msg.id !== 1)
        .map(msg => ({
          role: msg.sender === 'bot' ? 'assistant' : 'user',
          content: msg.text
        })),
      { role: "user", content: userMessage }
    ];

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${aiApiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin, 
          "X-Title": "SoulSpark App"
        },
        body: JSON.stringify({
          // THIS IS THE MAGIC FIX: It auto-selects a working free model
          model: "openrouter/free", 
          messages: messages,
        })
      });

      const data = await response.json();
      
      if (data.error) throw new Error(data.error.message);
      
      return data.choices[0].message.content;

    } catch (err) {
      console.error("OpenRouter AI Error:", err);
      return "I'm having a little trouble connecting. Let's take a **deep breath** and try again.";
    }
  }

  /**
   * Structured CBT AI Logic
   */
  static async processCBTInteraction(sessionState) {
    if (!aiApiKey) throw new Error("Missing AI API Key.");

    const systemPrompt = `
      You are an empathetic, structured CBT Assistant. 
      Respond ONLY in valid JSON format matching this schema:
      {
        "response_text": "string",
        "safety_flag": boolean,
        "risk_level": "LOW"|"MODERATE"|"CRITICAL",
        "updated_cbt_step": "string",
        "session_action": "CONTINUE"|"END_SESSION",
        "homework_assigned": "string"|null,
        "clinical_notes": "string"
      }
    `;

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${aiApiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin, 
          "X-Title": "SoulSpark App"
        },
        body: JSON.stringify({
          // MAGIC FIX APPLIED HERE TOO
          model: "openrouter/free",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: JSON.stringify(sessionState) }
          ],
          response_format: { type: "json_object" }
        })
      });

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);

    } catch (err) {
      console.error("CBT AI Error:", err);
      return {
        response_text: "Let's pause and reflect on that thought. How does it make you feel?",
        safety_flag: false,
        risk_level: "LOW",
        updated_cbt_step: sessionState.current_cbt_step,
        session_action: "CONTINUE",
        homework_assigned: null,
        clinical_notes: "API Error occurred."
      };
    }
  }

  /**
   * AI Reframe Generator
   */
  static async generateAIReframe(automaticThought) {
    if (!aiApiKey) return ["Consider this from another angle.", "Is this a fact or a feeling?"];
    
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${aiApiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin, 
          "X-Title": "SoulSpark App"
        },
        body: JSON.stringify({
          // MAGIC FIX APPLIED HERE TOO
          model: "openrouter/free",
          messages: [
            { role: "user", content: `Provide 3 short, helpful CBT reframes for this negative thought: "${automaticThought}". Return strictly as a JSON array of strings.` }
          ]
        })
      });

      const data = await response.json();
      let rawText = data.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '');
      return JSON.parse(rawText);
    } catch (err) {
      console.error("Reframe Error:", err);
      return ["I might be looking at this from one perspective.", "I can handle this challenge one step at a time."];
    }
  }

  // ====================================================
  // 2. DATABASE METHODS (Supabase - Unchanged)
  // ====================================================

  static async fetchModules() {
    const { data, error } = await supabase.from('modules').select('*').eq('is_published', true).order('title');
    if (error) throw error;
    return data;
  }

  static async getClinicalContent(moduleId) {
    const { data, error } = await supabase.from('modules').select(`*, units (id, title, order_index, activities (id, title, type, static_content, api_config, order_index))`).eq('id', moduleId).order('order_index', { foreignTable: 'units', ascending: true });
    if (error) throw error;
    return data?.[0] || null; 
  }

  static async saveActivityLog(userId, activityId, payload) {
    const { data, error } = await supabase.from('user_progress').upsert({
        user_id: userId, activity_id: activityId, user_data: payload, status: 'completed', completed_at: new Date().toISOString()
      }, { onConflict: 'user_id, activity_id' });
    if (error) throw error;
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

  static async exportUserData(userId) {
    const { data, error } = await supabase.from('daily_wellness').select('log_date, mood_rating, hydration_count, goal_completed').eq('user_id', userId).order('log_date', { ascending: false });
    if (error || !data.length) return { success: false, error: error?.message || 'No data found' };

    const headers = ['Date', 'Mood', 'Hydration', 'Goal Completed'];
    const csvRows = data.map(r => `"${r.log_date}","${r.mood_rating}","${r.hydration_count}","${r.goal_completed ? 'Yes' : 'No'}"`);
    return { success: true, data: [headers.join(','), ...csvRows].join('\n') };
  }
}
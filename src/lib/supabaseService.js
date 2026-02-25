import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION & INIT ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const aiApiKey = import.meta.env.VITE_AI_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables are missing! Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * ClinicalService
 * A unified controller for Supabase database operations and Gemini AI logic.
 */
export class ClinicalService {

  /**
   * ====================================================
   * 1. CORE CLINICAL CONTENT (Modules, Units, Activities)
   * ====================================================
   */

  /** Fetches all published clinical modules */
  static async fetchModules() {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('is_published', true)
      .order('title');

    if (error) throw new Error(`Module Fetch Error: ${error.message}`);
    return data;
  }

  /** Retrieves the full curriculum (Modules -> Units -> Activities) */
  static async getClinicalContent(moduleId) {
    const { data, error } = await supabase
      .from('modules')
      .select(`
        *,
        units (
          id, title, order_index,
          activities (
            id, title, type, static_content, api_config, order_index
          )
        )
      `)
      .eq('id', moduleId)
      .order('order_index', { foreignTable: 'units', ascending: true });

    if (error) throw new Error(`Content Load Error: ${error.message}`);
    return data?.[0] || null; 
  }

  /** Saves user inputs/progress using upsert */
  static async saveActivityLog(userId, activityId, payload) {
    const { data, error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        activity_id: activityId,
        user_data: payload,
        status: 'completed',
        completed_at: new Date().toISOString()
      }, { onConflict: 'user_id, activity_id' })
      .select();

    if (error) throw new Error(`Save Log Error: ${error.message}`);
    return data;
  }

  /**
   * ====================================================
   * 2. AI & CBT LOGIC CONTROLLER (Gemini Integration)
   * ====================================================
   */

  /**
   * The "Brain": Processes user state and returns structured JSON instructions.
   */
  static async processCBTInteraction(sessionState) {
    if (!aiApiKey) throw new Error("Missing VITE_AI_API_KEY in .env file.");

    const SYSTEM_PROMPT = `
      You are an empathetic, structured CBT Assistant. 
      Respond ONLY in JSON.
      
      ### Safety Protocol
      If risk of self-harm/harm to others is detected: 
      "safety_flag": true, "risk_level": "CRITICAL", "response_text": [Emergency Hotlines].

      ### Phase Guidance
      1. Intake: Build rapport, explain CBT, set goals.
      2. Core: Identify situations, build awareness, recognize distortions, challenge thoughts.
      
      ### Schema
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
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${aiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: JSON.stringify(sessionState) }] }],
          generationConfig: { response_mime_type: "application/json" }
        })
      });

      if (!response.ok) throw new Error("AI API Request Failed");

      const result = await response.json();
      return JSON.parse(result.candidates[0].content.parts[0].text);

    } catch (err) {
      console.error("CBT AI Error:", err);
      return this._getFallbackResponse(sessionState.current_cbt_step);
    }
  }

  /**
   * Reframes a specific thought using AI.
   * Upgraded from simulation to use the Gemini engine.
   */
  static async generateAIReframe(automaticThought) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${aiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ 
            role: "user", 
            parts: [{ text: `Provide 3 short, helpful CBT reframes for this thought: "${automaticThought}". Return as a JSON array of strings.` }] 
          }],
          generationConfig: { response_mime_type: "application/json" }
        })
      });
      const result = await response.json();
      return JSON.parse(result.candidates[0].content.parts[0].text);
    } catch (err) {
      console.error("Reframe Error:", err);
      return ["I might be looking at this from one perspective. What's another way to see it?", "I can handle this challenge one step at a time."];
    }
  }

  /**
   * ====================================================
   * 3. DAILY WELLNESS & DASHBOARD
   * ====================================================
   */

  static async getDailyWellness(userId, dateStr) {
    const { data, error } = await supabase
      .from('daily_wellness')
      .select('*')
      .eq('user_id', userId)
      .eq('log_date', dateStr)
      .single();

    if (error && error.code !== 'PGRST116') return null;
    return data || { mood_rating: null, hydration_count: 0, goal_completed: false };
  }

  static async updateDailyWellness(userId, dateStr, updates) {
    const { data, error } = await supabase
      .from('daily_wellness')
      .upsert({
        user_id: userId,
        log_date: dateStr,
        ...updates,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id, log_date' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getFullDashboardStats(userId) {
    const { data, error } = await supabase.rpc('get_user_dashboard_stats', { user_uuid: userId });
    if (error) {
      console.error("Dashboard RPC Error:", error);
      return { mood_history: [], daily_goal: {}, daily_water: {} };
    }
    return data;
  }

  /**
   * ====================================================
   * 4. UTILITIES & EXPORTS
   * ====================================================
   */

  static async exportUserData(userId) {
    const { data, error } = await supabase
      .from('daily_wellness')
      .select('log_date, mood_rating, hydration_count, goal_completed')
      .eq('user_id', userId)
      .order('log_date', { ascending: false });

    if (error || !data.length) return { success: false, error: error?.message || 'No data found' };

    const headers = ['Date', 'Mood', 'Hydration', 'Goal Completed'];
    const csvRows = data.map(r => `"${r.log_date}","${r.mood_rating}","${r.hydration_count}","${r.goal_completed ? 'Yes' : 'No'}"`);
    
    return { success: true, data: [headers.join(','), ...csvRows].join('\n') };
  }

  /** Private helper for AI failure scenarios */
  static _getFallbackResponse(currentStep) {
    return {
      response_text: "I'm having a little trouble connecting. Let's take a deep breath. What's on your mind?",
      safety_flag: false,
      risk_level: "LOW",
      updated_cbt_step: currentStep,
      session_action: "CONTINUE",
      homework_assigned: null,
      clinical_notes: "API Error occurred."
    };
  }
}
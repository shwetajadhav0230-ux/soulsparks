import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION & INIT ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const aiApiKey = import.meta.env.VITE_AI_API_KEY;

// REMOVE THE LINE: import { ClinicalService } from "..."; 

export const supabase = createClient(supabaseUrl, supabaseKey);

export class ClinicalService{
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
   * General Wellness AI Chat (Context-Aware & Formatted)
   */
  static async processGeneralChat(userMessage, chatHistory, userId) {
    if (!aiApiKey) throw new Error("Missing VITE_AI_API_KEY in .env file.");

    // 1. Fetch user context
    let therapyContext = "No recent therapy exercises completed.";
    if (userId) {
      const { data: recentLogs, error } = await supabase
        .from('user_progress')
        .select('activity_id, user_data, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && recentLogs && recentLogs.length > 0) {
        therapyContext = JSON.stringify(recentLogs);
      }
    }

    // 2. Build the Advanced System Prompt
    const SYSTEM_PROMPT = `
      You are SoulSpark, a premium, empathetic AI wellness companion. You are deeply validating, warm, and highly insightful.
      
      Therapeutic Context (User's past exercises):
      ${therapyContext}

      Response Guidelines:
      1. Tone: Deeply empathetic and conversational. Speak like a wise, supportive guide.
      2. Formatting: You MUST use **bold text** to emphasize key emotions, concepts, or tool names. Break your response into 2 or 3 short paragraphs.
      3. Contextual Memory: Weave their past successes into your response naturally. Mention specific skills like **TIPP**, **Reframing**, or their **Core Values**.
      4. Actionable Engagement: ALWAYS end your response with ONE gentle, guiding question.
      5. Module Suggestions: If appropriate, suggest a specific module (CBT, DBT, or ACT).
      6. Crisis Protocol: If self-harm is mentioned, instruct them to click the red "Crisis Support" button immediately.
    `;

    // 3. Format history for Gemini
    const formattedHistory = chatHistory
      .filter(msg => msg.id !== 1)
      .map(msg => ({
        role: msg.sender === 'bot' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }));

    formattedHistory.push({ role: 'user', parts: [{ text: userMessage }] });

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${aiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: formattedHistory
        })
      });

      if (!response.ok) throw new Error("AI API Request Failed");
      const result = await response.json();
      return result.candidates[0].content.parts[0].text;
    } catch (err) {
      console.error("General AI Error:", err);
      return "I'm having a little trouble thinking right now. Could we take a **deep breath** and try again?";
    }
  }

  /**
   * Structured CBT Brain
   */
  static async processCBTInteraction(sessionState) {
    if (!aiApiKey) throw new Error("Missing VITE_AI_API_KEY.");

    const SYSTEM_PROMPT = `
      You are an empathetic, structured CBT Assistant. Respond ONLY in JSON.
      
      ### Safety Protocol
      If risk is detected: "safety_flag": true, "risk_level": "CRITICAL", "response_text": [Hotlines].

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

      const result = await response.json();
      return JSON.parse(result.candidates[0].content.parts[0].text);
    } catch (err) {
      console.error("CBT AI Error:", err);
      return this._getFallbackResponse(sessionState.current_cbt_step);
    }
  }

  /**
   * Generate AI-driven reframes
   */
  static async generateAIReframe(automaticThought) {
    if (!aiApiKey) throw new Error("Missing VITE_AI_API_KEY.");
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${aiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ 
            role: "user", 
            parts: [{ text: `Provide 3 short, helpful CBT reframes for: "${automaticThought}". Return as a JSON array of strings.` }] 
          }],
          generationConfig: { response_mime_type: "application/json" }
        })
      });
      const result = await response.json();
      return JSON.parse(result.candidates[0].content.parts[0].text);
    } catch (err) {
      return ["Let's try to look at this from another angle.", "What is one small step I can take?"];
    }
  }

  /**
   * ====================================================
   * 3. WELLNESS & DASHBOARD LOGIC
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
    if (error) return { mood_history: [], daily_goal: {}, daily_water: {} };
    return data;
  }

  static async exportUserData(userId) {
    const { data, error } = await supabase
      .from('daily_wellness')
      .select('log_date, mood_rating, hydration_count, goal_completed')
      .eq('user_id', userId)
      .order('log_date', { ascending: false });

    if (error || !data.length) return { success: false, error: 'No data found' };

    const headers = ['Date', 'Mood', 'Hydration', 'Goal Completed'];
    const csvRows = data.map(r => `"${r.log_date}","${r.mood_rating}","${r.hydration_count}","${r.goal_completed ? 'Yes' : 'No'}"`);
    return { success: true, data: [headers.join(','), ...csvRows].join('\n') };
  }

  static _getFallbackResponse(currentStep) {
    return {
      response_text: "I'm having a little trouble connecting. Let's take a deep breath. What's on your mind?",
      safety_flag: false,
      risk_level: "LOW",
      updated_cbt_step: currentStep,
      session_action: "CONTINUE",
      homework_assigned: null,
      clinical_notes: "API Error."
    };
  }
}
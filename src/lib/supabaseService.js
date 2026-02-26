import { supabase } from './supabaseClient'; 

const aiApiKey = import.meta.env.VITE_AI_API_KEY;
const AI_MODEL = "openrouter/free"; 
const MAX_CONTEXT_MESSAGES = 10; 

const safeJsonParse = (text, fallback) => {
  try {
    if (!text) return fallback;
    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    const cleanText = jsonMatch ? jsonMatch[0] : text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("AI JSON Parse Error. Raw text:", text, e);
    return fallback;
  }
};

export class ClinicalService {
  
  // ====================================================
  // 1. CORE THERAPY CHAT
  // ====================================================
  static async processAdvancedTherapyChat(sessionState, chatHistory = [], userId) {
    if (!aiApiKey) return { chat_response: "System Error: Missing API Key." };

    const systemPrompt = `You are a specialized CBT/DBT Clinical Controller. Respond ONLY in raw JSON:
    {
      "chat_response": "Empathetic string",
      "dashboard_updates": { "wellbeing_score": 1-10, "identified_patterns": [], "clinical_pointers": [] },
      "session_meta": { "current_phase": "string", "session_status": "IN_PROGRESS|COMPLETED", "homework_task": "string" },
      "safety_flag": false
    }`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...chatHistory
        .slice(-MAX_CONTEXT_MESSAGES)
        .filter(msg => !msg.text.includes('SESSION_SYSTEM_FLAG'))
        .map(msg => ({
          role: msg.sender === 'bot' ? 'assistant' : 'user',
          content: msg.text
        })),
      { role: "user", content: JSON.stringify(sessionState) }
    ];

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${aiApiKey}`, 
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin, 
          "X-Title": "SoulSpark"
        },
        body: JSON.stringify({ model: AI_MODEL, messages })
      });

      if (!response.ok) {
        if (response.status === 429 || response.status === 402) {
            return { chat_response: "AI daily limit reached. Take a deep breath; we can continue tomorrow!", safety_flag: false };
        }
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      return safeJsonParse(content, {
        chat_response: "I'm listening. Tell me more about that.",
        session_meta: { session_status: "IN_PROGRESS" }
      });
    } catch (err) {
      console.error("Chat Error:", err);
      return { chat_response: "Connection trouble. Try again soon.", safety_flag: false };
    }
  }

  // ====================================================
  // 2. CBT MODULE & AI REFRAMING
  // ====================================================
  static async generateAIReframe(automaticThought) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${aiApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: AI_MODEL,
          messages: [{ role: "user", content: `Provide 3 short CBT reframes for: "${automaticThought}". Return strictly as a JSON array of strings.` }]
        })
      });

      if (!response.ok) {
        if (response.status === 429 || response.status === 402) return ["AI limit reached for today. Keep practicing on your own!"];
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      const result = safeJsonParse(content, null);
      
      return Array.isArray(result) ? result : ["Is there another way to look at this?"];
    } catch (err) {
      return ["Consider another perspective."];
    }
  }

  // ====================================================
  // 3. DATABASE SAVE METHODS (JOURNAL & PROGRESS)
  // ====================================================
  static async saveJournalEntry(userId, content, mood = 'Neutral') {
    const { data, error } = await supabase
      .from('journal_entries')
      .insert([{ user_id: userId, content, mood_tag: mood, created_at: new Date().toISOString() }]);
    
    if (error) {
        console.error("Journal Save Error:", error);
        throw error;
    }
    return data;
  }

  static async saveActivityLog(userId, activityId, payload) {
    const { data, error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: userId, 
        activity_id: activityId, 
        user_data: payload, 
        status: 'completed', 
        completed_at: new Date().toISOString()
      }, { onConflict: 'user_id,activity_id' });

    if (error) {
        console.error("Activity Save Error:", error);
        throw error;
    }
    return data;
  }

  // ====================================================
  // 4. DASHBOARD & ANALYTICS
  // ====================================================
  static async getDashboardAnalytics(userId) {
    try {
      const [journalRes, progressRes, chatRes] = await Promise.all([
        supabase.from('journal_entries').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('user_progress').select('activity_id').eq('user_id', userId),
        supabase.from('chat_history').select('text').eq('user_id', userId).ilike('text', '%SESSION_SYSTEM_FLAG:COMPLETED%')
      ]);

      const stats = { 
        cbt: 0, dbt: 0, act: 0, 
        chatInteractions: chatRes.data?.length || 0, 
        journal: journalRes.count || 0 
      };
      
      progressRes.data?.forEach(p => {
        const id = p.activity_id.toLowerCase();
        if (id.includes('cbt') || id.startsWith('76654924')) stats.cbt++;
        if (id.includes('dbt') || id.startsWith('88888888')) stats.dbt++;
        if (id.includes('act') || id.startsWith('99999999')) stats.act++; 
      });
      
      return stats;
    } catch (err) {
      console.error("Analytics Error:", err);
      return { cbt: 0, dbt: 0, act: 0, chatInteractions: 0, journal: 0 };
    }
  }

  static async analyzeUserPatterns(userId) {
    try {
      const { data: chats } = await supabase.from('chat_history').select('text').eq('user_id', userId).eq('sender', 'user').limit(15);
      if (!chats?.length) return ["Start chatting to see patterns"];

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${aiApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: AI_MODEL,
          messages: [{ role: "user", content: `Analyze for patterns: "${chats.map(c => c.text).join(' ')}". Return JSON: {"symptoms": ["Tag1", "Tag2"]}` }]
        })
      });
      
      if (!response.ok) {
          if (response.status === 429 || response.status === 402) return ["AI Daily Limit Reached"];
          throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      const parsed = safeJsonParse(content, { symptoms: ["Pattern Analysis Unavailable"] });
      
      return parsed.symptoms || ["No clear patterns detected yet"];
    } catch (err) { 
      return ["Pattern analysis paused temporarily."]; 
    }
  }

  // ====================================================
  // 5. UTILITY FUNCTIONS
  // ====================================================
  static async getUserSessionNumber(userId) {
    const { data } = await supabase.from('chat_history').select('created_at').eq('user_id', userId);
    return new Set(data?.map(d => d.created_at.split('T')[0])).size || 1;
  }

  static async getTodayChatHistory(userId) {
    const start = new Date(); start.setHours(0,0,0,0);
    const { data } = await supabase.from('chat_history').select('*').eq('user_id', userId).gte('created_at', start.toISOString()).order('created_at', { ascending: true });
    return data || [];
  }

  static async saveChatMessage(userId, sender, text) {
    await supabase.from('chat_history').insert([{ user_id: userId, sender, text }]);
  }

  static async updateDailyWellness(userId, date, updates) {
    await supabase.from('daily_wellness').upsert({ user_id: userId, log_date: date, ...updates, updated_at: new Date().toISOString() }, { onConflict: 'user_id,log_date' });
  }
  
  static async getDailyWellness(userId, date) {
    const { data } = await supabase.from('daily_wellness').select('*').eq('user_id', userId).eq('log_date', date).maybeSingle();
    return data || { hydration_count: 0, goal_completed: false, mood_rating: null };
  }

  static async getWellnessHistory(userId, limit = 7) {
    const { data } = await supabase.from('daily_wellness').select('mood_rating, log_date').eq('user_id', userId).order('log_date', { ascending: false }).limit(limit);
    return data || [];
  }

  // ====================================================
  // 6. COMPREHENSIVE DATA EXPORT (REPORT GENERATION)
  // ====================================================
  static async exportUserData(userId) {
    try {
      // Fetch ALL data concurrently for maximum speed
      const [wellnessRes, journalRes, chatRes, progressRes] = await Promise.all([
        supabase.from('daily_wellness').select('*').eq('user_id', userId).order('log_date', { ascending: false }),
        supabase.from('journal_entries').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('chat_history').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('user_progress').select('*').eq('user_id', userId).order('updated_at', { ascending: false })
      ]);

      // Build the Universal CSV Header
      let csvContent = "Timestamp,Category,Context,Details\n";

      // Helper function to safely escape commas and newlines in user text
      const escapeCSV = (str) => {
        if (str === null || str === undefined) return '""';
        const stringified = typeof str === 'object' ? JSON.stringify(str) : String(str);
        return `"${stringified.replace(/"/g, '""')}"`;
      };

      // Append Wellness Tracking
      if (wellnessRes.data) {
        wellnessRes.data.forEach(w => {
          const details = `Mood: ${w.mood_rating || 'N/A'} | Hydration: ${w.hydration_count || 0} | Goal Done: ${w.goal_completed ? 'Yes' : 'No'}`;
          csvContent += `${w.log_date},Wellness Log,Daily Trackers,${escapeCSV(details)}\n`;
        });
      }

      // Append Journal Entries
      if (journalRes.data) {
        journalRes.data.forEach(j => {
          const date = new Date(j.created_at).toLocaleString('en-CA');
          csvContent += `${date},Journal Entry,${j.mood_tag || 'Reflective'},${escapeCSV(j.content)}\n`;
        });
      }

      // Append AI Therapy Chat History
      if (chatRes.data) {
        chatRes.data.forEach(c => {
          const date = new Date(c.created_at).toLocaleString('en-CA');
          const sender = c.sender === 'bot' ? 'SoulSpark AI' : 'User';
          
          // Skip system flags to keep the report clean for reading
          if (!c.text.includes('SESSION_SYSTEM_FLAG')) {
            csvContent += `${date},Therapy Chat,${sender},${escapeCSV(c.text)}\n`;
          }
        });
      }

      // Append Clinical Exercises (CBT, DBT, ACT forms)
      if (progressRes.data) {
        progressRes.data.forEach(p => {
          const date = new Date(p.completed_at || p.updated_at).toLocaleString('en-CA');
          
          let formattedData = "";
          if (p.user_data) {
            Object.entries(p.user_data).forEach(([key, value]) => {
              const cleanKey = key.replace(/_/g, ' ').toUpperCase();
              formattedData += `[${cleanKey}]: ${value}   `;
            });
          }
          
          csvContent += `${date},Clinical Exercise,${p.status.toUpperCase()},${escapeCSV(formattedData)}\n`;
        });
      }

      if (csvContent === "Timestamp,Category,Context,Details\n") {
         return { success: false, error: "No data available to export yet." };
      }

      return { success: true, data: csvContent };
    } catch (error) {
      console.error("Export generation error:", error);
      return { success: false, error: "Failed to compile report. Check connection." };
    }
  }
}
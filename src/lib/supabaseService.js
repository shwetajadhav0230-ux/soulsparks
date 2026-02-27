import { supabase } from './supabaseClient'; 

const aiApiKey = import.meta.env.VITE_AI_API_KEY;
const AI_MODEL = "google/gemini-2.5-flash"; 
const MAX_CONTEXT_MESSAGES = 10; 

// --- 1. SMART JSON PARSER ---
// Gracefully handles cases where the AI forgets JSON rules and returns plain text.
const safeJsonParse = (text, fallback) => {
  try {
    if (!text) return fallback;
    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    const cleanText = jsonMatch ? jsonMatch[0] : text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.warn("AI ignored JSON format. Wrapping raw text into fallback.");
    return {
      ...fallback,
      chat_response: text.replace(/```json/g, '').replace(/```/g, '').trim() 
    };
  }
};

export class ClinicalService {
  
  // ====================================================
  // 1. CORE THERAPY CHAT (STRICT BREVITY + MULTIMODAL)
  // ====================================================
  static async processAdvancedTherapyChat(sessionState, chatHistory = [], userId) {
    if (!aiApiKey) return { chat_response: "System Error: Missing API Key." };

    const systemPrompt = `You are SoulSpark AI, an elite Clinical Psychologist specializing in CBT, DBT, and ACT.

CRITICAL CHAT CONSTRAINTS:
1. EXTREME BREVITY: Respond in maximum 2 brief sentences (under 35 words total).
2. ONE STEP AT A TIME: Validate briefly, then ask exactly ONE simple Socratic question.
3. Clinical Document Analysis: If a report/image is uploaded, give a 1-sentence summary and ask for their thoughts.
4. Safety First: If crisis markers are detected, set "safety_flag" to true.

You MUST respond ONLY in raw JSON format:
{
  "chat_response": "Short string",
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
        }))
    ];

    let userContent;
    // Multimodal Support for Premium Users (Base64 PDFs and Images)
    if (sessionState.attached_file) {
      userContent = [
        { type: "text", text: sessionState.user_input || "Please analyze this attached clinical document/image." },
        { type: "image_url", image_url: { url: sessionState.attached_file.base64 } }
      ];
    } else {
      userContent = JSON.stringify(sessionState);
    }

    messages.push({ role: "user", content: userContent });

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${aiApiKey}`, 
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin, 
          "X-Title": "SoulSpark"
        },
        body: JSON.stringify({ 
            model: AI_MODEL, 
            messages: messages,
            max_tokens: 1000,
            response_format: { type: "json_object" }
        })
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const data = await response.json();
      return safeJsonParse(data.choices?.[0]?.message?.content, {
        chat_response: "I'm listening. Tell me more about that.",
        session_meta: { session_status: "IN_PROGRESS" }
      });
    } catch (err) {
      return { chat_response: "Connection trouble. Try again soon.", safety_flag: false };
    }
  }

  // ====================================================
  // 2. AI DASHBOARD INSIGHTS (STRICT 5-WORD MINI-LINES)
  // ====================================================
  static async analyzeUserPatterns(userId, date) {
    try {
      const [{ data: chats }, { data: journals }] = await Promise.all([
        supabase.from('chat_history').select('text').eq('user_id', userId).eq('sender', 'user').gte('created_at', `${date}T00:00:00Z`).lte('created_at', `${date}T23:59:59Z`).limit(10),
        supabase.from('journal_entries').select('content').eq('user_id', userId).gte('created_at', `${date}T00:00:00Z`).lte('created_at', `${date}T23:59:59Z`)
      ]);

      const combinedText = [...(chats?.map(c => c.text) || []), ...(journals?.map(j => j.content) || [])].join(' ');
      if (!combinedText.trim()) return ["No logs for this date yet."];

      // CORRECTED URL: Changed "completify" to "completions"
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${aiApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: AI_MODEL,
          max_tokens: 200,
          response_format: { type: "json_object" },
          messages: [
            { 
              role: "system", 
              content: "You are a clinical psychologist. Extract exactly 3 ultra-short psychological insights from the text. Each insight MUST be 5 words or less. Absolutely no long sentences. Return JSON: {\"symptoms\": [\"Insight 1\", \"Insight 2\", \"Insight 3\"]}" 
            },
            { role: "user", content: combinedText.substring(0, 1200) }
          ]
        })
      });
      
      if (!response.ok) throw new Error("Pattern API Failed");
      const data = await response.json();
      const parsed = safeJsonParse(data.choices?.[0]?.message?.content, { symptoms: [] });
      return parsed.symptoms && parsed.symptoms.length > 0 ? parsed.symptoms : ["Reflecting on today's progress."];
    } catch (err) { 
      return ["Insights loading..."]; 
    }
  }

  // ====================================================
  // 3. CBT MODULE & AI REFRAMING
  // ====================================================
  static async generateAIReframe(automaticThought) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${aiApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: AI_MODEL,
          max_tokens: 500,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: "You are a CBT expert. Identify the distortion and provide 3 short, realistic reframes in a JSON array of strings." },
            { role: "user", content: automaticThought }
          ]
        })
      });
      const data = await response.json();
      const result = safeJsonParse(data.choices?.[0]?.message?.content, null);
      return Array.isArray(result) ? result : ["Consider another perspective."];
    } catch (err) { return ["Keep practicing reframing."]; }
  }

  // ====================================================
  // 4. DATABASE & UTILITY METHODS
  // ====================================================
  static async saveJournalEntry(userId, content, mood = 'Neutral') {
    await supabase.from('journal_entries').insert([{ user_id: userId, content, mood_tag: mood, created_at: new Date().toISOString() }]);
  }

  static async saveActivityLog(userId, activityId, payload) {
    await supabase.from('user_progress').upsert({ user_id: userId, activity_id: activityId, user_data: payload, status: 'completed', completed_at: new Date().toISOString() }, { onConflict: 'user_id,activity_id' });
  }

  static async getDashboardAnalytics(userId) {
    try {
      const [journalRes, progressRes, chatRes] = await Promise.all([
        supabase.from('journal_entries').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('user_progress').select('activity_id').eq('user_id', userId),
        supabase.from('chat_history').select('text').eq('user_id', userId).ilike('text', '%SESSION_SYSTEM_FLAG:COMPLETED%')
      ]);
      const stats = { cbt: 0, dbt: 0, act: 0, chatInteractions: chatRes.data?.length || 0, journal: journalRes.count || 0 };
      progressRes.data?.forEach(p => {
        const id = p.activity_id.toLowerCase();
        if (id.includes('cbt')) stats.cbt++;
        if (id.includes('dbt')) stats.dbt++;
        if (id.includes('act')) stats.act++; 
      });
      return stats;
    } catch (err) { return { cbt: 0, dbt: 0, act: 0, chatInteractions: 0, journal: 0 }; }
  }

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
    const { data: existing } = await supabase.from('daily_wellness').select('*').eq('user_id', userId).eq('log_date', date).maybeSingle();
    const payload = { user_id: userId, log_date: date, hydration_count: existing?.hydration_count || 0, goal_completed: existing?.goal_completed || false, mood_rating: existing?.mood_rating || null, ...updates, updated_at: new Date().toISOString() };
    await supabase.from('daily_wellness').upsert(payload, { onConflict: 'user_id,log_date' });
  }
  
  static async getDailyWellness(userId, date) {
    const { data } = await supabase.from('daily_wellness').select('*').eq('user_id', userId).eq('log_date', date).maybeSingle();
    return data || { hydration_count: 0, goal_completed: false, mood_rating: null };
  }

  static async getWellnessHistory(userId, limit = 7) {
    const { data } = await supabase.from('daily_wellness').select('mood_rating, log_date').eq('user_id', userId).order('log_date', { ascending: false }).limit(limit);
    return data || [];
  }

  static async exportUserData(userId) {
    try {
      const [wellnessRes, journalRes, chatRes, progressRes] = await Promise.all([
        supabase.from('daily_wellness').select('*').eq('user_id', userId).order('log_date', { ascending: false }),
        supabase.from('journal_entries').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('chat_history').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('user_progress').select('*').eq('user_id', userId).order('updated_at', { ascending: false })
      ]);
      let csvContent = "Timestamp,Category,Context,Details\n";
      const escapeCSV = (str) => `"${String(str || '').replace(/"/g, '""')}"`;
      wellnessRes.data?.forEach(w => csvContent += `${w.log_date},Wellness Log,Trackers,${escapeCSV(`Mood: ${w.mood_rating}`)}\n`);
      journalRes.data?.forEach(j => csvContent += `${j.created_at},Journal,${j.mood_tag},${escapeCSV(j.content)}\n`);
      chatRes.data?.forEach(c => !c.text.includes('FLAG') && (csvContent += `${c.created_at},Chat,${c.sender},${escapeCSV(c.text)}\n`));
      return { success: true, data: csvContent };
    } catch (error) { return { success: false, error: "Export failed." }; }
  }
}
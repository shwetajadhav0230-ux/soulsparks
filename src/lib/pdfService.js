import { jsPDF } from 'jspdf';
import { supabase } from './supabaseClient';

const OPENROUTER_API_KEY = import.meta.env.VITE_AI_API_KEY;

export const PDFService = {
  generateClinicalReport: async (userId, userName) => {
    try {
      if (!OPENROUTER_API_KEY) {
        throw new Error("API Key is missing! Please ensure VITE_AI_API_KEY is in your .env file and you have restarted the server (npm run dev).");
      }

      // 1. Gather all data from Supabase
      const { data: journalData } = await supabase
        .from('journal_entries')
        .select('text, mood, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(15);

      const { data: wellnessData } = await supabase
        .from('daily_wellness')
        .select('mood_rating, hydration_count, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      const journalContext = journalData && journalData.length > 0 
        ? journalData.map(j => `[${new Date(j.created_at).toLocaleDateString()}] Self-Reported Mood: ${j.mood} - Narrative: "${j.text}"`).join('\n') 
        : "No recent narrative entries logged.";
        
      const wellnessContext = wellnessData && wellnessData.length > 0
        ? wellnessData.map(w => `[${new Date(w.created_at).toLocaleDateString()}] Quantitative Mood (1-5): ${w.mood_rating}, Somatic (Hydration): ${w.hydration_count}`).join('\n') 
        : "No recent quantitative tracking logged.";

      // 2. The "Clinical Psychologist" Prompt
      const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash", 
          max_tokens: 1500, 
          messages: [
            {
              role: "system",
              content: "You are an expert Clinical Psychologist writing a formal Psychological Progress Report based on patient self-reported data. Use empirical, objective, and clinical terminology (e.g., 'affect', 'cognitive distortions', 'emotional regulation'). Structure the report EXACTLY with these four headings (in ALL CAPS, with an empty line between sections):\n\nCLINICAL IMPRESSIONS:\n(Analyze mood, affect, and thematic content of their narratives)\n\nBEHAVIORAL & SOMATIC TRENDS:\n(Evaluate quantitative mood ratings, hydration, and volatility)\n\nTHERAPEUTIC PROGRESS:\n(Note any identified cognitive distortions, resilience factors, or emotional regulation capabilities)\n\nTREATMENT RECOMMENDATIONS:\n(Provide 2-3 specific, actionable CBT/DBT interventions and coping strategies).\n\nDo NOT use markdown symbols like ** or ##. Write in formal, professional clinical prose."
            },
            {
              role: "user",
              content: `Patient Name: ${userName}\n\n--- QUANTITATIVE TRACKING ---\n${wellnessContext}\n\n--- QUALITATIVE NARRATIVES ---\n${journalContext}`
            }
          ]
        })
      });

      if (!aiResponse.ok) {
        const errorData = await aiResponse.json();
        throw new Error(`OpenRouter API Failed (${aiResponse.status}): ${errorData.error?.message || "Check your API Key and limits."}`);
      }

      const aiData = await aiResponse.json();
      const clinicalSummary = aiData.choices?.[0]?.message?.content;

      if (!clinicalSummary) {
        throw new Error("AI returned an empty response. Please try again.");
      }

      // 3. Generate the Professional PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // --- FORMAL HEADER ---
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(15, 23, 42); // Dark Slate
      doc.text("SOULSPARK CLINICAL SANCTUARY", 20, 22);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(220, 38, 38); // Warning Red
      doc.text("STRICTLY CONFIDENTIAL - PSYCHOLOGICAL PROGRESS REPORT", 20, 28);
      
      // --- PATIENT INFO BOX ---
      doc.setDrawColor(203, 213, 225); // Light Gray Border
      doc.setFillColor(248, 250, 252); // Very Light Gray Background
      doc.rect(20, 35, pageWidth - 40, 25, 'FD'); // Draw Box
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      // Box Content - Left Side
      doc.text(`Patient Name:`, 25, 45);
      doc.setFont("helvetica", "normal");
      doc.text(`${userName}`, 55, 45);
      
      doc.setFont("helvetica", "bold");
      doc.text(`Date of Eval:`, 25, 53);
      doc.setFont("helvetica", "normal");
      doc.text(`${new Date().toLocaleDateString()}`, 55, 53);
      
      // Box Content - Right Side
      doc.setFont("helvetica", "bold");
      doc.text(`Record ID:`, pageWidth - 80, 45);
      doc.setFont("helvetica", "normal");
      doc.text(`SS-PRO-${Math.floor(Math.random() * 10000)}`, pageWidth - 55, 45);

      doc.setFont("helvetica", "bold");
      doc.text(`Evaluator:`, pageWidth - 80, 53);
      doc.setFont("helvetica", "normal");
      doc.text(`SoulSpark AI System`, pageWidth - 55, 53);

      // --- CLINICAL SUMMARY TEXT ---
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(30, 30, 30);

      // Split text ensures words wrap within the page margins safely
      const splitText = doc.splitTextToSize(clinicalSummary, pageWidth - 40);
      
      // Start text below the info box
      let yOffset = 75; 
      
      // PAGINATION LOGIC
      for (let i = 0; i < splitText.length; i++) {
        // If we reach the bottom margin, create a new page
        if (yOffset > pageHeight - 25) {
          doc.addPage();
          yOffset = 20; // Reset Y position for the new page
          
          // Add a mini header on subsequent pages
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(`Patient: ${userName} | Record ID: SS-PRO | Page ${doc.internal.getNumberOfPages()}`, 20, 10);
          
          // Reset font for body text
          doc.setFontSize(11);
          doc.setTextColor(30, 30, 30);
        }
        doc.text(splitText[i], 20, yOffset);
        yOffset += 6; // Space between lines
      }

      // --- FORMAL FOOTER ---
      // Signature Line at the end of the report
      yOffset += 15;
      if (yOffset < pageHeight - 30) {
        doc.setDrawColor(150, 150, 150);
        doc.line(20, yOffset, 80, yOffset); // Draw signature line
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.text("Electronically Generated by SoulSpark AI", 20, yOffset + 5);
      }

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150, 150, 150);
      doc.text("Disclaimer: This report is generated by an AI assistant for reflective and therapeutic reference. It does not constitute a formal medical diagnosis.", 20, pageHeight - 10);

      // 4. Download the PDF
      doc.save(`Clinical_Report_${userName.replace(' ', '_')}.pdf`);
      
      return true;
    } catch (error) {
      console.error("PDF Generation Error:", error);
      throw error; 
    }
  }
};
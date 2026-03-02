'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function addIntervention(formData) {
  const patientId = formData.get('patientId');
  const clinicianId = formData.get('clinicianId');
  const title = formData.get('title');
  const type = formData.get('type');
  const notes = formData.get('notes');

  if (!patientId || !clinicianId || !title || !type || !notes) {
    return { success: false, error: 'Missing required fields. Please ensure all inputs are filled.' };
  }

  let patientFriendlyNote = null;

  if (notes && process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 
      
      const prompt = `You are a helpful medical assistant translating clinical notes into a patient-facing care plan.
      Rewrite the following notes for a patient at a 6th-grade reading level. Be encouraging, professional, and clear.
      
      Structure your response EXACTLY with these three headings (do not use markdown formatting like ** or ##, just the plain text headings):
      
      SUMMARY:
      [1-2 sentences explaining what was discussed or done]
      
      INSTRUCTIONS:
      • [Actionable step 1]
      • [Actionable step 2...]
      
      WHAT TO WATCH FOR:
      • [Warning signs or when to call the doctor. If none apply, say "Continue monitoring your symptoms as usual."]
      
      Clinical Notes: "${notes}"`;
      
      const result = await model.generateContent(prompt);
      patientFriendlyNote = result.response.text();
    } catch (error) {
      console.error("AI Generation Error:", error);
    }
  }

  try {
    await prisma.intervention.create({
      data: {
        patientId,
        clinicianId,
        title,
        type,
        notes,
        patientFriendlyNote, 
      }
    });

    revalidatePath(`/clinician/${clinicianId}/interventions`);
    return { success: true };
  } catch (error) {
    console.error("Database Save Error:", error);
    return { success: false, error: 'Failed to save the intervention to the database.' };
  }
}
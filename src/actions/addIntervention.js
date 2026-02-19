'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function addIntervention(formData) {
  console.log("--- 1. STARTING INTERVENTION SAVE ---");
  
  const patientId = formData.get('patientId');
  const clinicianId = formData.get('clinicianId');
  const title = formData.get('title');
  const type = formData.get('type');
  const notes = formData.get('notes');

  console.log("--- 2. FORM DATA RECEIVED ---", { 
    hasPatient: !!patientId, 
    hasNotes: !!notes 
  });
  console.log("--- 3. API KEY DETECTED? ---", !!process.env.GEMINI_API_KEY);

  if (!patientId || !clinicianId || !title || !type) {
    throw new Error('Missing required fields');
  }

  let patientFriendlyNote = null;

  // Call the AI ONLY when saving the note!
  if (notes && process.env.GEMINI_API_KEY) {
    try {
      console.log("--- 4. CALLING GEMINI AI... ---");
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
      const prompt = `Explain this medical instruction to a patient at a 6th-grade reading level. Be encouraging and clear. Note: "${notes}"`;
      
      const result = await model.generateContent(prompt);
      patientFriendlyNote = result.response.text();
      console.log("--- 5. AI SUCCESS! GENERATED: ---", patientFriendlyNote);
      
    } catch (error) {
      console.error("--- !!! AI ERROR !!! ---", error);
    }
  } else {
    console.log("--- !!! SKIPPED AI: Missing Notes or API Key !!! ---");
  }

  // Save to the database
  try {
    console.log("--- 6. SAVING TO DATABASE... ---");
    await prisma.intervention.create({
      data: {
        patientId,
        clinicianId,
        title,
        type,
        notes,
        patientFriendlyNote, // Save the generated note
      }
    });

    console.log("--- 7. SAVED SUCCESSFULLY! ---");
    revalidatePath(`/clinician/${clinicianId}/interventions`);
    return { success: true };
  } catch (error) {
    console.error("--- !!! DB SAVE ERROR !!! ---", error);
    return { success: false, error: 'Database error' };
  }
}
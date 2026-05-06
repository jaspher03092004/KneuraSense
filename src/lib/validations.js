import { z } from 'zod';

export const patientRegistrationSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .describe("Password must be at least 8 characters long.")
    .optional()
    .or(z.literal('')),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Please select a gender"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  oaDiagnosis: z.enum(["Yes", "No"]),
  
  // UPDATED: Converted to enum to explicitly include "Not Applicable"
  affectedKnee: z.enum(["Left", "Right", "Both", "Not Applicable"], {
    invalid_type_error: "Please select the affected knee or choose 'Not Applicable'",
  }).optional(),
  
  // UPDATED: Added a description to act as a sub-explanation or hint
  occupation: z.string()
    .describe("Your primary daily occupation (e.g., Office Worker, Construction, Retired, Student)")
    .optional(),
  
  // UPDATED: Converted from a plain string to an enum with clear, descriptive options
  activityLevel: z.enum([
    "Sedentary (Mostly sitting, little to no exercise)", 
    "Light (Light walking or standing, exercise 1-3 days/week)", 
    "Moderate (Active movement, exercise 3-5 days/week)", 
    "Heavy (Physically demanding work or intense exercise)"
  ], {
    errorMap: () => ({ message: "Please select an activity level that best matches your daily routine" })
  }),

  deviceMac: z.string().max(17).optional().or(z.literal('')),
  heightCm: z.coerce.number().min(50).max(300).optional().or(z.literal('')),
  weightKg: z.coerce.number().min(20).max(400).optional().or(z.literal('')),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
});
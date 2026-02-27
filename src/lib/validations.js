import { z } from 'zod';

export const patientRegistrationSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  age: z.coerce.number().min(1, "Age is required").max(120, "Invalid age"),
  gender: z.string().min(1, "Please select a gender"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  oaDiagnosis: z.enum(["Yes", "No"]),
  affectedKnee: z.string().optional(),
  painSeverity: z.coerce.number().min(1, "Must be between 1 and 10").max(10, "Must be between 1 and 10").optional(),
  occupation: z.string().optional(),
  activityLevel: z.string().min(1, "Please select an activity level"),
  deviceMac: z.string().max(17).optional().or(z.literal('')),
});
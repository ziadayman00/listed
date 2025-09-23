import { z } from 'zod'

// Admin login validation schema
export const adminLoginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(3, 'Password must be at least 3 characters')
})

// OTP verification validation schema
export const otpVerificationSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
  otp: z
    .string()
    .min(1, 'OTP is required')
    .regex(/^\d{6}$/, 'OTP must be exactly 6 digits')
    .length(6, 'OTP must be exactly 6 digits')
})

// Admin user creation schema
export const createAdminSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
  isMainAdmin: z.boolean().default(false)
})

// OTP generation schema
export const generateOtpSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
  type: z.enum(['LOGIN', 'PASSWORD_RESET']).default('LOGIN')
})

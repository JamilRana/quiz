import { z } from 'zod'

export const createAdminSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').optional(),
  role: z.enum(['ADMIN', 'INSTRUCTOR']).default('INSTRUCTOR'),
  isActive: z.boolean().default(true),
})

export const updateAdminSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  role: z.enum(['ADMIN', 'INSTRUCTOR']).optional(),
  isActive: z.boolean().optional(),
  email: z.string().email('Invalid email address').optional(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
})

export const adminQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  role: z.enum(['ADMIN', 'INSTRUCTOR']).optional(),
  isActive: z.coerce.boolean().optional(),
})
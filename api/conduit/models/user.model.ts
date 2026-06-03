import { z } from 'zod';

export const registerUserRequestSchema = z.object({
  username: z.string(),
  email: z.email(),
  password: z.string(),
});

export const loginRequestSchema = z.object({
  email: z.email(),
  password: z.string(),
});

export const conduitUserSchema = z.object({
  email: z.email(),
  username: z.string(),
  token: z.string(),
  bio: z.string().nullable(),
  image: z.string().nullable(),
});

// RealWorld wraps payloads in a root key: { "user": { ... } }
export const userEnvelopeSchema = z.object({ user: conduitUserSchema });

export type RegisterUserRequest = z.infer<typeof registerUserRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type ConduitUser = z.infer<typeof conduitUserSchema>;

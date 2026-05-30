import { z } from 'zod';

export const createUserRequestSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.email(),
  password: z.string(),
});

export const userResponseSchema = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.email(),
});

export const usersResponseSchema = z.array(userResponseSchema);

export type CreateUserRequest = z.infer<typeof createUserRequestSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;

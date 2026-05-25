import { env } from '../../config/env';
import { UserRole } from './auth.types';

type Credentials = {
  email: string | undefined;
  password: string | undefined;
};

export const authConfig: Record<UserRole, Credentials> = {
  admin: env.credentials.admin,
  user: env.credentials.user,
};
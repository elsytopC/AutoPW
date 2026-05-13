import { UserRole } from './auth.types';

type Credentials = {
    email: string | undefined;
    password: string | undefined;
};

export const authConfig: Record<UserRole, Credentials> = {
    admin: {
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
    },

    user: {
        email: process.env.USER_EMAIL,
        password: process.env.USER_PASSWORD,
    },
};
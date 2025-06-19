export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'OnPrez';
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  SETTINGS: '/settings',
} as const;

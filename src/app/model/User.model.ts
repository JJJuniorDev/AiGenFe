export interface User {
  id: string;
  email: string;
  plan: string;
  credits: number;
  brandLogoUrl?: string;
  primaryColor?: string;
  emailVerified: boolean;
}

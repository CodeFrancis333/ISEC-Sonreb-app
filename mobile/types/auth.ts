// mobile/types/auth.ts

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface AuthResult {
  user: User;
  token: string;      // access token
  refresh?: string;   // optional
}

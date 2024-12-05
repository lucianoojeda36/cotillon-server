export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  refresh_token?: string;
  created_at: string;
  updated_at: string;
}

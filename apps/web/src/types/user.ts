export interface UserRead {
  id: string;
  username: string;
  display_name: string;
  email?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface UserCreate {
  username: string;
  display_name?: string;
}

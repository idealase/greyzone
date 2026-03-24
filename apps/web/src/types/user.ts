export interface UserRead {
  id: string;
  username: string;
  display_name: string;
  created_at: string;
}

export interface UserCreate {
  username: string;
  display_name?: string;
}

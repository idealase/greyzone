import apiClient from "./client";
import { UserRead, UserCreate } from "../types/user";

export async function listUsers(): Promise<UserRead[]> {
  const response = await apiClient.get<UserRead[]>("/users");
  return response.data;
}

export async function getUser(id: string): Promise<UserRead> {
  const response = await apiClient.get<UserRead>(`/users/${id}`);
  return response.data;
}

export async function createUser(data: UserCreate): Promise<UserRead> {
  const response = await apiClient.post<UserRead>("/users", data);
  return response.data;
}

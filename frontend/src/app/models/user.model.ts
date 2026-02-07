export interface User {
  id: string;
  username: string;
  email: string;
  role: number;
  firstName?: string;
  lastName?: string;
  profileImagePath?: string;
  bio?: string;
  motto?: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  bio?: string;
  motto?: string;
  profileImagePath?: string;
}
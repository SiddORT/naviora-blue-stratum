export interface LoginCredentials {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface UserMe {
  uuid: string;
  email: string;
  full_name: string;
  username: string | null;
  avatar_url: string | null;
  status: string;
  organization_id: number | null;
  permissions: string[];
  roles: string[];
}

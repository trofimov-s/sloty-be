export type AuthResponse = {
  access_token: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
};

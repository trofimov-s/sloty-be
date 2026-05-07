export type AuthResponse = {
  access_token: string;
  user: {
    id: string;
    first_name: string;
    last_name: string | null;
    email: string;
    slug: string;
  };
};

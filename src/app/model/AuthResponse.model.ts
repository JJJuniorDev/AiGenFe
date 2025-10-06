import { User } from "./User.model";


export interface AuthResponse {
  token: string;
  user: User;
}

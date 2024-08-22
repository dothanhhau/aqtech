export interface HttpRequest extends Request {
  user: UserPayload;
}

export interface UserPayload {
  userId: string;
  username: string;
  roleNames?: string[];
  isNeedChangePassword?: boolean;
  exp?: number;
  iat?: number;
}

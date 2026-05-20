import { BaseApi } from '../core/baseApi';
import { LoginRequest, LoginResponse } from '../models/auth.model';

export class AuthApi extends BaseApi {
  async login(data: LoginRequest): Promise<LoginResponse> {
    return this.post<LoginResponse>('/login', data);
  }
}

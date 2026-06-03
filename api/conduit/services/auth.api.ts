import { BaseApi } from '@api/core/baseApi';
import {
  ConduitUser,
  LoginRequest,
  RegisterUserRequest,
  userEnvelopeSchema,
} from '@api/conduit/models/user.model';

export class ConduitAuthApi extends BaseApi {
  async register(data: RegisterUserRequest): Promise<ConduitUser> {
    const body = await this.post<unknown>('users', { user: data });
    return userEnvelopeSchema.parse(body).user;
  }

  async login(data: LoginRequest): Promise<ConduitUser> {
    const body = await this.post<unknown>('users/login', { user: data });
    return userEnvelopeSchema.parse(body).user;
  }
}

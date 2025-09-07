import { Injectable } from '@nestjs/common';
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
} from 'amazon-cognito-identity-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private userPool: CognitoUserPool;

  constructor(private readonly configService: ConfigService) {
    this.userPool = new CognitoUserPool({
      UserPoolId: this.configService.get<string>('COGNITO_USER_POOL_ID')!,
      ClientId: this.configService.get<string>('COGNITO_CLIENT_ID')!,
    });
  }

  async signIn(username: string, password: string): Promise<any> {
    const user = new CognitoUser({ Username: username, Pool: this.userPool });
    const authDetails = new AuthenticationDetails({
      Username: username,
      Password: password,
    });

    return new Promise((resolve, reject) => {
      user.authenticateUser(authDetails, {
        onSuccess: (result) => resolve(result.getIdToken().getJwtToken()),
        onFailure: (err) => reject(err),
      });
    });
  }
}

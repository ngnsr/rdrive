// amplify-config.ts
import { Amplify } from "aws-amplify";
import { AuthConfig } from "@aws-amplify/core";

export function configureAmplify(env: NodeJS.ProcessEnv) {
  if (!env.COGNITO_USER_POOL_ID || !env.COGNITO_CLIENT_ID) {
    throw new Error("Missing COGNITO_USER_POOL_ID or COGNITO_CLIENT_ID");
  }

  const authConfig: AuthConfig = {
    Cognito: {
      userPoolId: env.COGNITO_USER_POOL_ID,
      userPoolClientId: env.COGNITO_CLIENT_ID,
      signUpVerificationMethod: "code",
      loginWith: { email: true },
      userAttributes: {
        email: { required: true },
        email_verified: { required: true },
        name: { required: true },
      },
      mfa: { status: "off" },
    },
  };

  Amplify.configure({ Auth: authConfig });
}

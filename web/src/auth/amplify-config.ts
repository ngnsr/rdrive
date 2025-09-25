import { Amplify } from "aws-amplify";

export function configureAmplify() {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID!,
        userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID!,
        signUpVerificationMethod: "code",
        loginWith: { email: true },
        userAttributes: {
          email: { required: true },
          name: { required: true },
        },
        mfa: { status: "off" },
      },
    },
  });
}

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import {
  bearer,
  emailOTP,
  jwt,
  oneTimeToken,
  openAPI,
  organization,
} from "better-auth/plugins";
import { db } from "../db/drizzle";
import { schema } from "../db/schema/auth";
import { sendEmailToUser } from "../transactional/email";
import { ac, admin, member, owner } from "./permissions";
import { publicOrgPlugin } from "./plugins/organization";

export const auth = betterAuth({
  appName: "Bitstacks",
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["email-password", "google"],
    },
  },
  emailAndPassword: {
    enabled: false,
  },
  emailVerification: {
    autoSignInAfterVerification: true,
    async onEmailVerification(user, request) {
      console.log(user, request, "from onEmailVerification");
    },
  },
  plugins: [
    organization({
      ac: ac,
      roles: {
        owner,
        admin,
        member,
      },
      schema: {
        organization: {
          additionalFields: {
            contractAddress: {
              type: "string",
              required: true,
              input: true,
              unique: true,
              defaultValue: null,
            },
          },
        },
      },
    }),
    publicOrgPlugin(),
    openAPI(),
    oneTimeToken({
      expiresIn: 5,
    }),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        console.log(`Sending OTP ${otp} to ${email} for ${type}`);
        try {
          await sendEmailToUser(email, type, otp);
        } catch (error) {
          console.error("Failed to send verification OTP:", error);
          throw new Error("Failed to send verification OTP");
        }
      },
      expiresIn: 300,
      otpLength: 6,
      disableSignUp: false,
    }),
    bearer(),
    jwt({
      jwt: {
        expirationTime: "15m",
      },
    }),
    nextCookies(),
  ],
});

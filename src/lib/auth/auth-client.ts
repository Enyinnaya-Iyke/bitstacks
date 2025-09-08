import {
  emailOTPClient,
  inferAdditionalFields,
  organizationClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "./auth";
import { ac, admin, member, owner } from "./permissions";
import { publicOrgPluginClient } from "./plugins/organization/client";

export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields<typeof auth>(),
    organizationClient({
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
            public: {
              type: "boolean",
              input: true,
              required: true,
              defaultValue: true,
            },
          },
        },
      },
    }),
    publicOrgPluginClient(),
    emailOTPClient(),
  ],
});

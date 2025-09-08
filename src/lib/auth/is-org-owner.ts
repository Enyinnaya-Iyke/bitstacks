import { authClient } from "./auth-client";

export const isOrgOwner = await authClient.organization.hasPermission({
  permissions: {
    story: ["create", "update", "delete"],
  },
});

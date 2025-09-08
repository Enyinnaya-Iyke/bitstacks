import { createAccessControl } from "better-auth/plugins/access";

const statement = {
	story: ["create", "read", "update", "delete"],
} as const;

export const ac = createAccessControl(statement);

export const owner = ac.newRole({
	story: ["create", "read", "update", "delete"],
});

export const admin = ac.newRole({
	story: ["read", "update"],
});

export const member = ac.newRole({
	story: ["read"],
});

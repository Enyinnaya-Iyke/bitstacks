"use server";
import { headers } from "next/headers";
import { auth } from "../auth/auth";

export const isOrgOwner = async () => {
	return await auth.api.hasPermission({
		headers: await headers(),
		body: {
			permissions: {
				story: ["create", "update", "delete"],
			},
		},
	});
};

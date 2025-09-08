import type { BetterAuthPlugin } from "better-auth";
import { APIError, getSessionFromCtx } from "better-auth/api";
import { createAuthEndpoint } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import * as z from "zod/v4";
import { db } from "@/lib/db/drizzle";
import { organization } from "@/lib/db/schema/auth";
import { auth } from "../../auth";
import { getOrgAdapter } from "./adapter";
import { ORGANIZATION_ERROR_CODES } from "./error-codes";

export function parseRoles(roles: string | string[]): string {
	return Array.isArray(roles) ? roles.join(",") : roles;
}

const baseSchema = z.object({
	userId: z.coerce.string().meta({
		description:
			'The user Id which represents the user to be added as a member. If `null` is provided, then it\'s expected to provide session headers. Eg: "user-id"',
	}),
	role: z.union([z.string(), z.array(z.string())]).meta({
		description:
			'The role(s) to assign to the new member. Eg: ["admin", "sale"]',
	}),
	organizationId: z
		.string()
		.meta({
			description:
				'An optional organization ID to pass. If not provided, will default to the user\'s active organization. Eg: "org-id"',
		})
		.optional(),
	teamId: z
		.string()
		.meta({
			description: 'An optional team ID to add the member to. Eg: "team-id"',
		})
		.optional(),
});

export const publicOrgPlugin = (): BetterAuthPlugin => ({
	id: "public-org-plugin",

	schema: {
		organization: {
			fields: {
				public: {
					type: "boolean",
					input: true,
					required: true,
					defaultValue: true,
				},
			},
		},
	},

	endpoints: {
		listPublicOrganizations: createAuthEndpoint(
			"/organization/public",
			{ method: "GET" },
			async (ctx) => {
				try {
					const publicOrgs = await db
						.select()
						.from(organization)
						.where(eq(organization.public, true));

					return ctx.json(publicOrgs);
				} catch (err) {
					if (err instanceof APIError) throw err;
					throw new APIError("UNAUTHORIZED", {
						message: "Something went wrong.",
						status: 401,
						error: err instanceof Error ? err.message : "Unknown error",
					});
				}
			},
		),

		joinPublicOrganization: createAuthEndpoint(
			"/organization/:orgId/join",
			{
				method: "POST",
				body: z.object({ ...baseSchema.shape }),
			},
			async (ctx) => {
				try {
					const sessionData = await getSessionFromCtx<{
						session: { activeOrganizationId?: string };
						user: { id: string };
					}>(ctx).catch(() => null);

					if (!sessionData || !sessionData.user?.id) {
						throw new APIError("UNAUTHORIZED", {
							message: "Invalid or expired session",
							status: 401,
							code: "UNAUTHORIZED_INVALID_OR_EXPIRED_SESSION",
						});
					}

					const orgId =
						ctx.body.organizationId ||
						sessionData.session.activeOrganizationId ||
						ctx.params.orgId;

					if (!orgId) {
						throw new APIError("BAD_REQUEST", {
							message: ORGANIZATION_ERROR_CODES.NO_ACTIVE_ORGANIZATION,
							status: 400,
						});
					}

					const org = await db.query.organization.findFirst({
						where: eq(organization.id, orgId),
					});

					if (!org) {
						throw new APIError("NOT_FOUND", {
							message: "Organization not found",
							status: 404,
							code: "ORGANIZATION_NOT_FOUND",
						});
					}

					if (!org.public) {
						throw new APIError("FORBIDDEN", {
							message: "Organization is not public",
							status: 403,
							code: "ORGANIZATION_NOT_PUBLIC",
						});
					}

					const adapter = getOrgAdapter(ctx.context);
					const user = await ctx.context.internalAdapter.findUserById(
						ctx.body.userId,
					);

					if (!user) {
						throw new APIError("BAD_REQUEST", {
							message: auth.$ERROR_CODES.USER_NOT_FOUND,
							status: 400,
						});
					}

					const alreadyMember = await adapter.findMemberByEmail({
						email: user.email,
						organizationId: orgId,
					});

					if (alreadyMember) {
						throw new APIError("BAD_REQUEST", {
							message:
								ORGANIZATION_ERROR_CODES.USER_IS_ALREADY_A_MEMBER_OF_THIS_ORGANIZATION,
							status: 400,
						});
					}

					const { role, userId, organizationId, ...additionalFields } =
						ctx.body;

					const createdMember = await adapter.createMember({
						organizationId: orgId,
						userId: user.id,
						role: parseRoles(role as string | string[]),
						createdAt: new Date(),
						...additionalFields,
					});

					return ctx.json(createdMember);
				} catch (err) {
					if (err instanceof APIError) throw err;
					throw new APIError("UNAUTHORIZED", {
						message: "Something went wrong.",
						status: 401,
						error: err instanceof Error ? err.message : "Unknown error",
					});
				}
			},
		),
	},
});

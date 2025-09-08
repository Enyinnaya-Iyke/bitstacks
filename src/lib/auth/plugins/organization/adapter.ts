import type { AuthContext } from "better-auth";
import type {
	InferMember,
	InferOrganization,
	Member,
	MemberInput,
	OrganizationOptions,
} from "better-auth/plugins/organization";
import type { Session, User } from "@/types/auth";
// import type { InferAdditionalFieldsFromPluginOptions } from "../../db";

export const getOrgAdapter = <O extends OrganizationOptions>(
	context: AuthContext,
	options?: O,
) => {
	const adapter = context.adapter;
	return {
		findMemberByEmail: async (data: {
			email: string;
			organizationId: string;
		}) => {
			const user = await adapter.findOne<User>({
				model: "user",
				where: [
					{
						field: "email",
						value: data.email.toLowerCase(),
					},
				],
			});
			if (!user) {
				return null;
			}
			const member = await adapter.findOne<Member>({
				model: "member",
				where: [
					{
						field: "organizationId",
						value: data.organizationId,
					},
					{
						field: "userId",
						value: user.id,
					},
				],
			});
			if (!member) {
				return null;
			}
			return {
				...member,
				user: {
					id: user.id,
					name: user.name,
					email: user.email,
					image: user.image,
				},
			};
		},
		findMemberByOrgId: async (data: {
			userId: string;
			organizationId: string;
		}) => {
			const [member, user] = await Promise.all([
				await adapter.findOne<Member>({
					model: "member",
					where: [
						{
							field: "userId",
							value: data.userId,
						},
						{
							field: "organizationId",
							value: data.organizationId,
						},
					],
				}),
				await adapter.findOne<User>({
					model: "user",
					where: [
						{
							field: "id",
							value: data.userId,
						},
					],
				}),
			]);
			if (!user || !member) {
				return null;
			}
			return {
				...member,
				user: {
					id: user.id,
					name: user.name,
					email: user.email,
					image: user.image,
				},
			};
		},
		findMemberById: async (memberId: string) => {
			const member = await adapter.findOne<Member>({
				model: "member",
				where: [
					{
						field: "id",
						value: memberId,
					},
				],
			});
			if (!member) {
				return null;
			}
			const user = await adapter.findOne<User>({
				model: "user",
				where: [
					{
						field: "id",
						value: member.userId,
					},
				],
			});
			if (!user) {
				return null;
			}
			return {
				...member,
				user: {
					id: user.id,
					name: user.name,
					email: user.email,
					image: user.image,
				},
			};
		},
		createMember: async (
			data: Omit<MemberInput, "id"> & Record<string, any>,
		) => {
			const member = await adapter.create<
				typeof data,
				Member & InferAdditionalFieldsFromPluginOptions<"member", O, false>
			>({
				model: "member",
				data: {
					...data,
					createdAt: new Date(),
				},
			});
			return member;
		},
		setActiveOrganization: async (
			sessionToken: string,
			organizationId: string | null,
		) => {
			const session = await context.internalAdapter.updateSession(
				sessionToken,
				{
					activeOrganizationId: organizationId,
				},
			);
			return session as Session;
		},
		findOrganizationById: async (organizationId: string) => {
			const organization = await adapter.findOne<InferOrganization<O>>({
				model: "organization",
				where: [
					{
						field: "id",
						value: organizationId,
					},
				],
			});
			return organization;
		},
		checkMembership: async ({
			userId,
			organizationId,
		}: {
			userId: string;
			organizationId: string;
		}) => {
			const member = await adapter.findOne<InferMember<O>>({
				model: "member",
				where: [
					{
						field: "userId",
						value: userId,
					},
					{
						field: "organizationId",
						value: organizationId,
					},
				],
			});
			return member;
		},
	};
};

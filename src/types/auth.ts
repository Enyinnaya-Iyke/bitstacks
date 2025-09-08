import type { auth } from "@/lib/auth/auth";

export type Session = typeof auth.$Infer.Session;
export type User = (typeof auth.$Infer.Session)["user"];
export type Organization = typeof auth.$Infer.Organization;
export type Member = typeof auth.$Infer.Member;

export type AuthenticatedData = {
  accessToken: string;
  userId: string;
  session: Session;
};

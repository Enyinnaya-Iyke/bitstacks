"use server";
import { headers } from "next/headers";
import type { AuthenticatedData } from "@/types/auth";
import { auth } from "./auth";

export const assertUserAuthenticated = async (): Promise<AuthenticatedData> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("User Not authenticated");
  }

  const tokenData = await auth.api.getToken({
    headers: await headers(),
  });
  if (!tokenData.token) {
    throw new Error("Error trying to get the access token from BA");
  }

  try {
    return {
      accessToken: tokenData.token as string,
      userId: session.user.id,
      session: session,
    };
  } catch (error) {
    console.error("Error parsing user data:", error);
    throw new Error("Invalid authentication");
  }
};

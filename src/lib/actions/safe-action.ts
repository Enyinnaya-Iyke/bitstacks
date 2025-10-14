import { headers } from "next/headers";
import { createServerActionProcedure } from "zsa";
import { assertUserAuthenticated } from "../auth/assert-user-authenticated";
import { auth } from "../auth/auth";

export class PublicError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PUBLIC_ERROR";
  }
}

function shapeErrors({ err }: any) {
  const isAllowedError = err instanceof PublicError;
  const isDev = process.env.NODE_ENV === "development";
  if (isAllowedError || isDev) {
    console.error(err);
    return {
      code: err.code ?? "ERROR",
      message: `${!isAllowedError && isDev ? "DEV ONLY ENABLED - " : ""}${
        err.message
      }`,
    };
  }
  return {
    code: "ERROR",
    message: "Something went wrong",
  };
}

export const authenticatedAction = createServerActionProcedure()
  .experimental_shapeError(shapeErrors)
  .handler(async () => {
    const user = await assertUserAuthenticated();

    return { user };
  });

export const unauthenticatedAction = createServerActionProcedure()
  .experimental_shapeError(shapeErrors)
  .handler(async () => {});

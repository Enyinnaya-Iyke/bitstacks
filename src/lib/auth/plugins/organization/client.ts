import type { BetterAuthClientPlugin } from "better-auth";
import type { publicOrgPlugin } from ".";

type PublicOrgPlugin = typeof publicOrgPlugin;

export const publicOrgPluginClient = () => {
	return {
		id: "public-org-plugin",
		$InferServerPlugin: {} as ReturnType<PublicOrgPlugin>,
	} satisfies BetterAuthClientPlugin;
};

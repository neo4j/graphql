import { DirectiveNode, valueFromASTUntyped } from "graphql";
import { Auth, AuthRule } from "../types";

function getAuth(directive: DirectiveNode): Auth {
    const auth: Auth = { rules: [], type: "JWT" };

    const rules = directive.arguments?.find((x) => x.name.value === "rules");

    if (!rules) {
        throw new Error("auth rules required");
    }

    if (rules.value.kind !== "ListValue") {
        throw new Error("auth rules must be a ListValue");
    }

    auth.rules = valueFromASTUntyped(rules.value) as AuthRule[];

    return auth;
}

export default getAuth;

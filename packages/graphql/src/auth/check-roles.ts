import { Node, Context } from "../classes";
import { AuthOperations } from "../types";

function checkRoles({ node, context, operation }: { node: Node; context: Context; operation: AuthOperations }) {
    if (!node.auth) {
        return;
    }

    const rulesToCheck = node.auth.rules.filter(
        (x) => x.operations?.includes(operation) && x.isAuthenticated !== false
    );

    const allowStar = rulesToCheck.filter((x) => x.allow && x.allow === "*");

    if (allowStar.length) {
        return;
    }

    if (!rulesToCheck.length) {
        return;
    }

    const jwt = context.getJWT();

    if (!jwt) {
        throw new Error("Unauthorized");
    }

    const roles = jwt.Roles || jwt.roles || jwt.Role || jwt.role || [];

    rulesToCheck.forEach((rule) => {
        if (rule.roles) {
            rule.roles.forEach((role) => {
                if (!roles.includes(role)) {
                    throw new Error("Forbidden");
                }
            });
        }
    });
}

export default checkRoles;

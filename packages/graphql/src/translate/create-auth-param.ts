import dotProp from "dot-prop";
import { Context } from "../types";

function createAuthParam({ context }: { context: Context }) {
    const { jwt } = context;
    const param: { isAuthenticated: boolean; roles?: string[]; jwt: any } = {
        isAuthenticated: false,
        roles: [],
        jwt,
    };

    if (!jwt) {
        return param;
    }

    const dotPropKey = process.env.JWT_ROLES_OBJECT_PATH;

    if (dotPropKey) {
        param.roles = dotProp.get(jwt, dotPropKey);
    } else if (jwt.roles) {
        param.roles = jwt.roles;
    }

    param.isAuthenticated = true;

    return param;
}

export default createAuthParam;

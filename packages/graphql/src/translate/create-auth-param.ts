import { Context } from "../classes";

function createAuthParam({ context }: { context: Context }) {
    const param: { isAuthenticated: boolean; roles?: string[] } = { isAuthenticated: false, roles: [] };

    try {
        // TODO more roles
        const { roles } = context.getJWT();

        if (roles) {
            param.roles = roles;
        }
    } catch (error) {
        // TODO DEBUG

        return param;
    }

    param.isAuthenticated = true;

    return param;
}

export default createAuthParam;

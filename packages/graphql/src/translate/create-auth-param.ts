import { Context } from "../classes";

function createAuthParam({ context }: { context: Context }) {
    const param: { isAuthenticated: boolean; roles?: string[]; jwt: any } = {
        isAuthenticated: false,
        roles: [],
        jwt: {},
    };

    try {
        // TODO more roles
        const jwt = context.getJWT();

        if (jwt.roles) {
            param.roles = jwt.roles;
        }

        param.jwt = jwt;
    } catch (error) {
        // TODO DEBUG

        return param;
    }

    param.isAuthenticated = true;

    return param;
}

export default createAuthParam;

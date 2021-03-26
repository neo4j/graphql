import { IncomingMessage } from "http";
import jsonwebtoken from "jsonwebtoken";

function getJWT(context: any): any {
    const req = context instanceof IncomingMessage ? context : context.req || context.request;
    let result;

    if (
        !req ||
        !req.headers ||
        (!req.headers.authorization && !req.headers.Authorization) ||
        (!req && !req.cookies && !req.cookies.token)
    ) {
        return result;
    }

    const authorization = req.headers.authorization || req.headers.Authorization || req.cookies.token || "";
    const token = authorization.split("Bearer ")[1];
    if (!token) {
        return result;
    }

    try {
        const { JWT_SECRET, JWT_NO_VERIFY } = process.env;

        if (!JWT_SECRET && JWT_NO_VERIFY) {
            result = jsonwebtoken.decode(token);
        } else {
            result = jsonwebtoken.verify(token, JWT_SECRET as string, {
                algorithms: ["HS256", "RS256"],
            });
        }
    } catch (error) {
        // TODO DEBUG
    }

    return result;
}

export default getJWT;

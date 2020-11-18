import jsonwebtoken from "jsonwebtoken";
import { IncomingMessage } from "http";

function verifyAndDecodeToken({ context }: { context: any }) {
    const req = context instanceof IncomingMessage ? context : context.req || context.request;
    const { JWT_SECRET, JWT_NO_VERIFY } = process.env;

    if (
        !req ||
        !req.headers ||
        (!req.headers.authorization && !req.headers.Authorization) ||
        (!req && !req.cookies && !req.cookies.token)
    ) {
        throw new Error("Unauthorized");
    }

    const authorization = req.headers.authorization || req.headers.Authorization || req.cookies.token;

    try {
        const [_, token] = authorization.split("Bearer ");

        if (!JWT_SECRET && JWT_NO_VERIFY) {
            return jsonwebtoken.decode(token);
        }

        return jsonwebtoken.verify(token, JWT_SECRET, {
            algorithms: ["HS256", "RS256"],
        });
    } catch (err) {
        throw new Error("Unauthorized");
    }
}

export default verifyAndDecodeToken;

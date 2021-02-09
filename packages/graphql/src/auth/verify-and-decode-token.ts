import jsonwebtoken from "jsonwebtoken";

function verifyAndDecodeToken(token: string): any {
    const { JWT_SECRET, JWT_NO_VERIFY } = process.env;

    if (!JWT_SECRET && JWT_NO_VERIFY) {
        return jsonwebtoken.decode(token);
    }

    return jsonwebtoken.verify(token, JWT_SECRET as string, {
        algorithms: ["HS256", "RS256"],
    });
}

export default verifyAndDecodeToken;

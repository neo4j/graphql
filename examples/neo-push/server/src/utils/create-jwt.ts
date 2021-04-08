import jwt from "jsonwebtoken";
import * as config from "../config";

function createJWT(data: { sub: string }): Promise<string> {
    return new Promise((resolve, reject) => {
        jwt.sign(data, config.NEO4J_GRAPHQL_JWT_SECRET, (err, token) => {
            if (err) {
                return reject(err);
            }

            return resolve(token as string);
        });
    });
}

export default createJWT;

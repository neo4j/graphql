/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { IncomingMessage } from "http";
import jsonwebtoken from "jsonwebtoken";
import environment from "../environment";

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
        if (!environment.NEO4j_GRAPHQL_JWT_SECRET && environment.NEO4j_GRAPHQL_JWT_NO_VERIFY) {
            result = jsonwebtoken.decode(token);
        } else {
            result = jsonwebtoken.verify(token, environment.NEO4j_GRAPHQL_JWT_SECRET as string, {
                algorithms: ["HS256", "RS256"],
            });
        }
    } catch (error) {
        // TODO DEBUG
    }

    return result;
}

export default getJWT;

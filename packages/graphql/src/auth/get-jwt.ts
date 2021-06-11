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
import Debug from "debug";
import { Context } from "../types";
import { DEBUG_AUTH } from "../constants";

const debug = Debug(DEBUG_AUTH);

function getJWT(context: Context): any {
    const jwtConfig = context.neoSchema.config?.jwt;
    let result;

    if (!jwtConfig) {
        debug("JWT not configured");

        return result;
    }

    const req = context instanceof IncomingMessage ? context : context.req || context.request;

    if (!req) {
        debug("Could not get .req or .request from context");

        return result;
    }

    if (!req.headers && !req.cookies) {
        debug(".headers or .cookies not found on req");

        return result;
    }

    const authorization = (req.headers.authorization || req.headers.Authorization || req.cookies.token) as string;
    if (!authorization) {
        debug("Could not get .authorization, .Authorization or .cookies.token from req");

        return result;
    }

    const token = authorization.split("Bearer ")[1];
    if (!token) {
        debug("Authorization header was not in expected format 'Bearer <token>'");

        return result;
    }

    try {
        if (jwtConfig.noVerify) {
            debug("Skipping verifying JWT as noVerify is not set");

            result = jsonwebtoken.decode(token);
        } else {
            debug("Verifying JWT");

            result = jsonwebtoken.verify(token, jwtConfig.secret, {
                algorithms: ["HS256", "RS256"],
            });
        }
    } catch (error) {
        debug("%s", error);
    }

    return result;
}

export default getJWT;

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
import Debug from "debug";
import type { Context } from "../types";
import { DEBUG_AUTH } from "../constants";

const debug = Debug(DEBUG_AUTH);

type RequestLike = {
    headers?: { authorization?: string; Authorization?: string };
    rawHeaders?: Array<string>;
    cookies?: { token?: string };
};

export function getToken(context: Context): string | undefined {
    const req: RequestLike = context instanceof IncomingMessage ? context : context.req || context.request;

    if (!req) {
        debug("Could not get .req or .request from context");

        return;
    }

    if (!req.headers && !req.cookies) {
        debug(".headers or .cookies not found on req");

        return;
    }

    const authorization = req?.headers?.authorization || req?.headers?.Authorization || req.cookies?.token;

    if (!authorization) {
        debug("Could not get .authorization, .Authorization or .cookies.token from req");

        return;
    }

    const token = authorization.split("Bearer ")[1];

    if (!token) {
        debug("Authorization header was not in expected format 'Bearer <token>'");

        return token;
    }

    return token;
}

export function parseBearerToken(bearerAuth: string): string {
    const token = bearerAuth.split("Bearer ")[1];
    if (!token) {
        debug("Authorization header was not in expected format 'Bearer <token>'");
    }
    return token;
}

/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Debug from "debug";
import { DEBUG_AUTH } from "../../constants";

const debug = Debug(DEBUG_AUTH);

export function parseBearerToken(bearerAuth: string): string | undefined {
    if (!bearerAuth.startsWith("Bearer ")) {
        debug("Authorization header with authentication scheme 'Bearer <token>'");
        return bearerAuth;
    }

    const token = bearerAuth.split("Bearer ")[1];
    if (!token) {
        debug("Authorization header was not in expected format 'Bearer <token>'");
    }
    return token;
}

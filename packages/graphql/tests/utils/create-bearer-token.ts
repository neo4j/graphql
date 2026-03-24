/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import jsonwebtoken from "jsonwebtoken";

export function createBearerToken(secret: string, extraData: Record<string, any> = {}): string {
    const token = jsonwebtoken.sign(
        {
            roles: [],
            ...extraData,
        },
        secret,
        { noTimestamp: true }
    );

    return `Bearer ${token}`;
}

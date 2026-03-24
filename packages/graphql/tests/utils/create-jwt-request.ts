/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { IncomingMessage } from "http";
import jsonwebtoken from "jsonwebtoken";
import { Socket } from "net";
import { createBearerToken } from "./create-bearer-token";

/** Creates a JWT valid request with the given secret and the extraData in the JWT token */

export function createJwtRequest(secret: string, extraData: Record<string, any> = {}): IncomingMessage {
    const requestHeader = createBearerToken(secret, extraData);
    const socket = new Socket({ readable: true });
    const req = new IncomingMessage(socket);
    req.headers.authorization = requestHeader;
    return req;
}

export function createJwtHeader(secret: string, extraData: Record<string, any> = {}): string {
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

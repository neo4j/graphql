/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jError } from "neo4j-driver";

export function errorHasGQLStatus(error: Neo4jError, gqlStatus: string): boolean {
    if (error.gqlStatus === gqlStatus) {
        return true;
    }

    if (error.cause) {
        if (!(error.cause instanceof Neo4jError)) {
            return false;
        }
        return errorHasGQLStatus(error.cause, gqlStatus);
    }

    return false;
}

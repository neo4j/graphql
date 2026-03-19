/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { Session } from "neo4j-driver";
import toInternalStruct from "./to-internal-struct";
import graphqlFormatter from "./transforms/neo4j-graphql";
import type { Neo4jStruct } from "./types";

export async function toGenericStruct(sessionFactory: () => Session): Promise<Neo4jStruct> {
    return toInternalStruct(sessionFactory);
}

export async function toGraphQLTypeDefs(sessionFactory: () => Session, readonly = false): Promise<string> {
    const genericStruct = await toGenericStruct(sessionFactory);
    return graphqlFormatter(genericStruct, readonly);
}

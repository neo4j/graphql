/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { GraphQLWhereArg } from "../../types";
import type { Annotation } from "./Annotation";

export type AuthenticationOperation =
    | "READ"
    | "AGGREGATE"
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "CREATE_RELATIONSHIP"
    | "DELETE_RELATIONSHIP"
    | "SUBSCRIBE";

export class AuthenticationAnnotation implements Annotation {
    readonly name = "authentication";

    public readonly operations: Set<AuthenticationOperation>;
    public readonly jwt?: GraphQLWhereArg;

    constructor(operations: AuthenticationOperation[], jwt?: GraphQLWhereArg) {
        this.operations = new Set<AuthenticationOperation>(operations);
        this.jwt = jwt;
    }
}

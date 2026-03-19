/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLError } from "graphql";

export class Neo4jGraphQLError extends GraphQLError {
    readonly name;

    constructor(message: string) {
        super(message);

        // if no name provided, use the default. defineProperty ensures that it stays non-enumerable
        if (!this.name) {
            Object.defineProperty(this, "name", { value: "Neo4jGraphQLError" });
        }
    }
}

export class Neo4jGraphQLForbiddenError extends Neo4jGraphQLError {
    constructor(message: string) {
        super(message);

        Object.defineProperty(this, "name", { value: "Neo4jGraphQLForbiddenError" });
    }
}

export class Neo4jGraphQLAuthenticationError extends Neo4jGraphQLError {
    constructor(message: string) {
        super(message);

        Object.defineProperty(this, "name", { value: "Neo4jGraphQLAuthenticationError" });
    }
}

export class Neo4jGraphQLConstraintValidationError extends Neo4jGraphQLError {
    constructor(message: string) {
        super(message);

        Object.defineProperty(this, "name", { value: "Neo4jGraphQLConstraintValidationError" });
    }
}

export class Neo4jGraphQLRelationshipValidationError extends Neo4jGraphQLError {
    constructor(message: string) {
        super(message);

        Object.defineProperty(this, "name", { value: "Neo4jGraphQLRelationshipValidationError" });
    }
}

export class Neo4jGraphQLSchemaValidationError extends Neo4jGraphQLError {
    constructor(message: string) {
        super(message);

        Object.defineProperty(this, "name", { value: "Neo4jGraphQLSchemaValidationError" });
    }
}

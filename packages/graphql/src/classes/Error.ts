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

export class Neo4jGraphQLError extends Error {
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
    readonly name;

    constructor(message: string) {
        super(message);

        Object.defineProperty(this, "name", { value: "Neo4jGraphQLForbiddenError" });
    }
}

export class Neo4jGraphQLAuthenticationError extends Neo4jGraphQLError {
    readonly name;

    constructor(message: string) {
        super(message);

        Object.defineProperty(this, "name", { value: "Neo4jGraphQLAuthenticationError" });
    }
}

export class Neo4jGraphQLConstraintValidationError extends Neo4jGraphQLError {
    readonly name;

    constructor(message: string) {
        super(message);

        Object.defineProperty(this, "name", { value: "Neo4jGraphQLConstraintValidationError" });
    }
}

export class Neo4jGraphQLRelationshipValidationError extends Neo4jGraphQLError {
    readonly name;

    constructor(message: string) {
        super(message);

        Object.defineProperty(this, "name", { value: "Neo4jGraphQLRelationshipValidationError" });
    }
}

export class Neo4jGraphQLSchemaValidationError extends Neo4jGraphQLError {
    readonly name;

    constructor(message: string) {
        super(message);

        Object.defineProperty(this, "name", { value: "Neo4jGraphQLSchemaValidationError" });
    }
}

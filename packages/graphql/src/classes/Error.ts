/* eslint-disable max-classes-per-file */
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

/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { CypherQueryOptions } from ".";
import type { ExecutionContext, Neo4jGraphQLSessionConfig, UserTransactionConfig } from "../classes/Executor";
import type { Neo4jGraphQLContextInterface } from "./neo4j-graphql-context-interface";

export interface Neo4jGraphQLContext extends Neo4jGraphQLContextInterface {
    /**
     * Parameters to be used when querying with Cypher.
     *
     * To be used with directives such as `@node` and `@cypher`, and can be used directly as named here.
     *
     * @example
     * Given a `cypherParams` value as follows:
     * ```
     * { title: "The Matrix" }
     * ```
     * This can be referred to like `@cypher(statement: "RETURN $title AS title", columnName: "title")`.
     */
    cypherParams?: Record<string, unknown>;
    /**
     * Configures which {@link https://neo4j.com/docs/cypher-manual/current/query-tuning/query-options/ | Cypher query options} to use when executing the translated query.
     */
    cypherQueryOptions?: CypherQueryOptions;
    /**
     * The Neo4j driver, session or transaction which will be used to execute the translated query.
     */
    executionContext?: ExecutionContext;
    /**
     * Configuration that will be used during session construction if a driver was passed into the library on construction or if {@link executionContext} is an instance of a driver.
     */
    sessionConfig?: Neo4jGraphQLSessionConfig;
    /**
     * Attach metadata to the database transaction.
     * This can be used to output information to the query log not related to the query itself.
     * Will be ignored if {@link executionContext} is an instance of a transaction.
     *
     * @deprecated This method will be removed in a future version. Please, use {@link transaction} instead.
     *
     * @see {@link #transaction}
     */
    transactionMetadata?: Record<string, unknown>;

    /**
     * User transaction object which has both the metadata object and the timeout period inside
     */
    transaction?: UserTransactionConfig;
}

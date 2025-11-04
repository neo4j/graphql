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

import Debug from "debug";
import type { GraphQLResolveInfo } from "graphql";
import { print } from "graphql";
import type {
    Driver,
    ManagedTransaction,
    QueryResult,
    Result,
    Session,
    SessionConfig,
    SessionMode,
    Transaction,
} from "neo4j-driver";
import { Neo4jError } from "neo4j-driver";
import {
    AUTH_FORBIDDEN_ERROR,
    AUTH_UNAUTHENTICATED_ERROR,
    DEBUG_EXECUTE,
    RELATIONSHIP_REQUIREMENT_PREFIX,
} from "../constants";
import { debugCypherAndParams } from "../debug/debug-cypher-and-params";
import environment from "../environment";
import type { CypherQueryOptions } from "../types";
import {
    Neo4jGraphQLAuthenticationError,
    Neo4jGraphQLConstraintValidationError,
    Neo4jGraphQLForbiddenError,
    Neo4jGraphQLRelationshipValidationError,
} from "./Error";

const debug = Debug(DEBUG_EXECUTE);

interface DriverLike {
    session(config);
}

function isDriverLike(executionContext: any): executionContext is DriverLike {
    return typeof executionContext.session === "function";
}

interface SessionLike {
    beginTransaction(config);
}

function isSessionLike(executionContext: any): executionContext is SessionLike {
    return typeof executionContext.beginTransaction === "function";
}

type TransactionConfig = {
    metadata: {
        app: string;
        // Possible values from https://neo4j.com/docs/operations-manual/current/monitoring/logging/#attach-metadata-tx (will only be user-transpiled for @neo4j/graphql)
        type: "system" | "user-direct" | "user-action" | "user-transpiled";
        source?: {
            query: string;
        };
    };
};

export type ExecutionContext = Driver | Session | Transaction;

export type ExecutorConstructorParam = {
    executionContext: ExecutionContext;
    cypherQueryOptions?: CypherQueryOptions;
    sessionConfig?: SessionConfig;
    cypherParams?: Record<string, unknown>;
    transactionMetadata?: Record<string, unknown>;
};

export type Neo4jGraphQLSessionConfig = Pick<SessionConfig, "database" | "impersonatedUser" | "auth">;

export class Executor {
    private executionContext: ExecutionContext;

    /**
     * @deprecated Will be removed in 5.0.0.
     */
    public lastBookmark: string | null;

    private cypherQueryOptions: CypherQueryOptions | undefined;

    private sessionConfig: SessionConfig | undefined;

    private cypherParams: Record<string, unknown>;
    private transactionMetadata: Record<string, unknown>;

    constructor({
        executionContext,
        cypherQueryOptions,
        sessionConfig,
        cypherParams = {},
        transactionMetadata = {},
    }: ExecutorConstructorParam) {
        this.executionContext = executionContext;
        this.cypherQueryOptions = cypherQueryOptions;
        this.lastBookmark = null;
        this.cypherQueryOptions = cypherQueryOptions;
        this.sessionConfig = sessionConfig;
        this.cypherParams = cypherParams;
        this.transactionMetadata = transactionMetadata;
    }

    public async execute(
        query: string,
        parameters: Record<string, any>,
        sessionMode: SessionMode,
        info?: GraphQLResolveInfo
    ): Promise<QueryResult> {
        const params = { ...parameters, ...this.cypherParams };

        try {
            if (isDriverLike(this.executionContext)) {
                return await this.driverRun({
                    query,
                    parameters: params,
                    driver: this.executionContext,
                    sessionMode,
                    info,
                });
            }

            if (isSessionLike(this.executionContext)) {
                return await this.sessionRun({
                    query,
                    parameters: params,
                    sessionMode,
                    session: this.executionContext,
                    info,
                });
            }

            return await this.transactionRun(query, params, this.executionContext);
        } catch (error) {
            throw this.formatError(error);
        }
    }

    private formatError(error: unknown) {
        if (error instanceof Neo4jError) {
            if (error.message.includes(`Caused by: java.lang.RuntimeException: ${AUTH_FORBIDDEN_ERROR}`)) {
                return new Neo4jGraphQLForbiddenError("Forbidden");
            }

            if (error.message.includes(`Caused by: java.lang.RuntimeException: ${AUTH_UNAUTHENTICATED_ERROR}`)) {
                return new Neo4jGraphQLAuthenticationError("Unauthenticated");
            }

            if (error.message.includes(`Caused by: java.lang.RuntimeException: ${RELATIONSHIP_REQUIREMENT_PREFIX}`)) {
                const [, message] = error.message.split(RELATIONSHIP_REQUIREMENT_PREFIX);
                return new Neo4jGraphQLRelationshipValidationError(message || "");
            }

            if (error.code === "Neo.ClientError.Schema.ConstraintValidationFailed") {
                return new Neo4jGraphQLConstraintValidationError("Constraint validation failed");
            }
        }

        debug("%s", error);

        return error;
    }

    private generateQuery(query: string): string {
        if (this.cypherQueryOptions && Object.keys(this.cypherQueryOptions).length) {
            const cypherQueryOptions = `CYPHER ${Object.entries(this.cypherQueryOptions)
                .map(([key, value]) => `${key}=${value}`)
                .join(" ")}`;

            return `${cypherQueryOptions}\n${query}`;
        }

        return query;
    }

    private getTransactionConfig(info?: GraphQLResolveInfo): TransactionConfig {
        const app = `${environment.NPM_PACKAGE_NAME}@${environment.NPM_PACKAGE_VERSION}`;

        const transactionConfig: TransactionConfig = {
            metadata: {
                ...this.transactionMetadata,
                app,
                type: "user-transpiled",
            },
        };

        if (info) {
            const source = {
                // We avoid using print here, when possible, as it is a heavy process
                query:
                    info.operation.loc?.source.body ||
                    // Print both fragments and operation, otherwise printed queries are invalid due to missing fragments
                    [Object.values(info.fragments).map((fragment) => print(fragment)), print(info.operation)].join(
                        "\n\n"
                    ),
            };

            transactionConfig.metadata.source = source;
        }

        return transactionConfig;
    }

    private async driverRun({
        query,
        parameters,
        driver,
        sessionMode,
        info,
    }: {
        query: string;
        parameters: Record<string, any>;
        driver: Driver;
        sessionMode: SessionMode;
        info?: GraphQLResolveInfo;
    }): Promise<QueryResult> {
        const session = driver.session({
            // Always specify a default database to avoid requests for routing table
            database: "neo4j",
            ...this.sessionConfig,
            bookmarkManager: driver.executeQueryBookmarkManager,
            defaultAccessMode: sessionMode,
        });

        try {
            const result = await this.sessionRun({ query, parameters, info, session, sessionMode });
            return result;
        } finally {
            await session.close();
        }
    }

    private async sessionRun({
        query,
        parameters,
        session,
        sessionMode,
        info,
    }: {
        query: string;
        parameters: Record<string, any>;
        session: Session;
        sessionMode: SessionMode;
        info?: GraphQLResolveInfo;
    }): Promise<QueryResult> {
        let result: QueryResult | undefined;

        switch (sessionMode) {
            case "READ":
                result = await session.executeRead((tx: ManagedTransaction) => {
                    return this.transactionRun(query, parameters, tx);
                }, this.getTransactionConfig(info));
                break;
            case "WRITE":
                result = await session.executeWrite((tx: ManagedTransaction) => {
                    return this.transactionRun(query, parameters, tx);
                }, this.getTransactionConfig(info));
                break;
        }

        // TODO: remove in 5.0.0, only kept to not make client breaking changes in 4.0.0
        const lastBookmark = session.lastBookmarks();
        if (lastBookmark[0]) {
            this.lastBookmark = lastBookmark[0];
        }

        return result;
    }

    private transactionRun(
        query: string,
        parameters: Record<string, any>,
        transaction: Transaction | ManagedTransaction
    ): Result {
        const queryToRun = this.generateQuery(query);

        debugCypherAndParams(debug, queryToRun, parameters);

        return transaction.run(queryToRun, parameters);
    }
}

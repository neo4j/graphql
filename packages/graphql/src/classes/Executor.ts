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

import { Driver, Neo4jError, QueryResult, Result, ServerInfo, Session, SessionMode, Transaction } from "neo4j-driver";
import Debug from "debug";

import type { AuthContext, CypherQueryOptions, Neo4jDatabaseInfo } from "../types";
import environment from "../environment";
import {
    Neo4jGraphQLAuthenticationError,
    Neo4jGraphQLConstraintValidationError,
    Neo4jGraphQLForbiddenError,
    Neo4jGraphQLRelationshipValidationError,
    VersionMismatchError,
} from "./Error";
import {
    AUTH_FORBIDDEN_ERROR,
    AUTH_UNAUTHENTICATED_ERROR,
    DEBUG_EXECUTE,
    RELATIONSHIP_REQUIREMENT_PREFIX,
} from "../constants";

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

type SessionParam = {
    defaultAccessMode?: SessionMode;
    bookmarks?: string | string[];
    database?: string;
    impersonatedUser?: string;
    fetchSize?: number;
};

type TransactionConfig = {
    metadata: {
        app: string;
        // Possible values from https://neo4j.com/docs/operations-manual/current/monitoring/logging/#attach-metadata-tx (will only be user-transpiled for @neo4j/graphql)
        type: "system" | "user-direct" | "user-action" | "user-transpiled";
    };
};

export type ExecutionContext = Driver | Session | Transaction;

export type ExecutorConstructorParam = {
    executionContext: ExecutionContext;
    auth: AuthContext;
    queryOptions?: CypherQueryOptions;
    database?: string;
    bookmarks?: string | string[];
    neo4jDatabaseInfo?: Neo4jDatabaseInfo;
};

export class Executor {
    private executionContext: Driver | Session | Transaction;

    public lastBookmark: string | null;

    private queryOptions: CypherQueryOptions | undefined;
    private auth: AuthContext;

    private database: string | undefined;
    private bookmarks: string | string[] | undefined;
    private neo4jDatabaseInfo: Neo4jDatabaseInfo | undefined;

    constructor({ executionContext, auth, queryOptions, database, bookmarks, neo4jDatabaseInfo }: ExecutorConstructorParam) {
        this.executionContext = executionContext;
        this.lastBookmark = null;
        this.queryOptions = queryOptions;
        this.auth = auth;
        this.database = database;
        this.bookmarks = bookmarks;
        this.neo4jDatabaseInfo = neo4jDatabaseInfo;
    }

    public async execute(query: string, parameters: any, defaultAccessMode: SessionMode): Promise<QueryResult> {
        try {
            if (isDriverLike(this.executionContext)) {
                const session = this.executionContext.session(this.getSessionParam(defaultAccessMode));
                const result = await this.sessionRun(query, parameters, defaultAccessMode, session);
                await session.close();
                return result;
            }

            if (isSessionLike(this.executionContext)) {
                return await this.sessionRun(query, parameters, defaultAccessMode, this.executionContext);
            }

            const result = await this.transactionRun(query, parameters, this.executionContext);
            this.throwIfVersionMismatch(result.summary.server);
            return result;
        } catch (error) {
            throw this.formatError(error);
        }
    }

    private formatError(error: unknown) {
        if (error instanceof VersionMismatchError) {
            return error;
        }
        if (error instanceof Neo4jError) {
            if (error.message.includes(`Caused by: java.lang.RuntimeException: ${AUTH_FORBIDDEN_ERROR}`)) {
                return new Neo4jGraphQLForbiddenError("Forbidden");
            }

            if (error.message.includes(`Caused by: java.lang.RuntimeException: ${AUTH_UNAUTHENTICATED_ERROR}`)) {
                return new Neo4jGraphQLAuthenticationError("Unauthenticated");
            }

            if (error.message.includes(`Caused by: java.lang.RuntimeException: ${RELATIONSHIP_REQUIREMENT_PREFIX}`)) {
                const [, message] = error.message.split(RELATIONSHIP_REQUIREMENT_PREFIX);
                return new Neo4jGraphQLRelationshipValidationError(message);
            }

            if (error.code === "Neo.ClientError.Schema.ConstraintValidationFailed") {
                return new Neo4jGraphQLConstraintValidationError("Constraint validation failed");
            }
        }

        debug("%s", error);

        return error;
    }

    private generateQuery(query: string): string {
        if (this.queryOptions && Object.keys(this.queryOptions).length) {
            const queryOptions = `CYPHER ${Object.entries(this.queryOptions)
                .map(([key, value]) => `${key}=${value}`)
                .join(" ")}`;

            return `${queryOptions}\n${query}`;
        }

        return query;
    }

    private generateParameters(query: string, parameters: any): Record<string, any> {
        if (query.includes("$auth.") || query.includes("auth: $auth") || query.includes("auth:$auth")) {
            return { ...parameters, auth: this.auth };
        }

        return parameters;
    }

    private getSessionParam(defaultAccessMode: SessionMode): SessionParam {
        // Always specify a default database to avoid requests for routing table
        const sessionParam: SessionParam = { defaultAccessMode, database: "neo4j" };

        if (this.database) {
            sessionParam.database = this.database;
        }

        if (this.bookmarks) {
            sessionParam.bookmarks = this.bookmarks;
        }

        return sessionParam;
    }

    private getTransactionConfig(): TransactionConfig {
        const app = `${environment.NPM_PACKAGE_NAME}@${environment.NPM_PACKAGE_VERSION}`;

        return {
            metadata: {
                app,
                type: "user-transpiled",
            },
        };
    }
    
    private throwIfVersionMismatch(serverInfo: ServerInfo) {
        if (this.neo4jDatabaseInfo) {
            const protocolVersion = serverInfo.protocolVersion;
            if (protocolVersion) {
                const versions = protocolVersion.toString().split(".").map(digit => parseInt(digit, 10));
                const major = versions[0];
                const minor = versions[1] ?? 0;
                if (major !== this.neo4jDatabaseInfo.version.major || minor !== this.neo4jDatabaseInfo.version.minor) {
                    throw new VersionMismatchError(major, minor);
                }
            }
        }
    }

    private async sessionRun(query: string, parameters, defaultAccessMode, session): Promise<QueryResult> {
        const transactionType = `${defaultAccessMode.toLowerCase()}Transaction`;
        const result = await session[transactionType](async (transaction: Transaction) => {
            const txResult = await this.transactionRun(query, parameters, transaction);
            this.throwIfVersionMismatch(txResult.summary.server);
            return txResult;
        }, this.getTransactionConfig());
        const lastBookmark = session.lastBookmark();
        if (Array.isArray(lastBookmark) && lastBookmark[0]) {
            this.lastBookmark = lastBookmark[0];
        }
        return result;
    }

    private transactionRun(query: string, parameters, transaction: Transaction): Result {
        const queryToRun = this.generateQuery(query);
        const parametersToRun = this.generateParameters(query, parameters);

        debug(
            "%s",
            `About to execute Cypher:\nCypher:\n${queryToRun}\nParams:\n${JSON.stringify(parametersToRun, null, 2)}`
        );

        return transaction.run(queryToRun, parametersToRun);
    }
}

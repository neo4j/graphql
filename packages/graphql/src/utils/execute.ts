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

import { SessionMode, QueryResult, Neo4jError, Session, Driver, Transaction } from "neo4j-driver";
import Debug from "debug";
import {
    Neo4jGraphQLForbiddenError,
    Neo4jGraphQLAuthenticationError,
    Neo4jGraphQLConstraintValidationError,
    Neo4jGraphQLRelationshipValidationError,
} from "../classes";
import {
    AUTH_FORBIDDEN_ERROR,
    AUTH_UNAUTHENTICATED_ERROR,
    DEBUG_EXECUTE,
    RELATIONSHIP_REQUIREMENT_PREFIX,
} from "../constants";
import createAuthParam from "../translate/create-auth-param";
import { Context, DriverConfig } from "../types";
import environment from "../environment";

const debug = Debug(DEBUG_EXECUTE);

export interface ExecuteResult {
    bookmark: string | null;
    result: QueryResult;
    statistics: Record<string, number>;
    records: Record<PropertyKey, any>[];
}

const getSessionParams = (input: { defaultAccessMode: SessionMode; context: Context }) => {
    const sessionParams: {
        defaultAccessMode?: SessionMode;
        bookmarks?: string | string[];
        database?: string;
    } = { defaultAccessMode: input.defaultAccessMode };

    const driverConfig = input.context.driverConfig as DriverConfig;
    if (driverConfig) {
        if (driverConfig.database) {
            sessionParams.database = driverConfig.database;
        }

        if (driverConfig.bookmarks) {
            sessionParams.bookmarks = driverConfig.bookmarks;
        }
    }

    return sessionParams;
};

const getTransactionConfig = () => {
    const app = `${environment.NPM_PACKAGE_NAME}@${environment.NPM_PACKAGE_VERSION}`;
    return {
        metadata: {
            app,
            type: "user-transpiled",
        },
    };
}

const getExecutor = (input: {
    defaultAccessMode: SessionMode;
    context: Context;
}): { driver?: Driver; session?: Session; transaction: Transaction } => {
    if (!input.context.executionContext) {
        const driver = input.context.driver;
        const session = driver.session(getSessionParams(input));
        const transaction = session.beginTransaction(getTransactionConfig());
        return { driver, session, transaction };
    }

    const executionContextType = Object.getPrototypeOf(input.context.executionContext).constructor.name;

    if (executionContextType === "Driver") {
        const driver = input.context.executionContext as Driver;
        const session = driver.session(getSessionParams(input));
        const transaction = session.beginTransaction(getTransactionConfig());
        return { driver, session, transaction };
    }

    if (executionContextType === "Session") {
        const session = input.context.executionContext as Session;
        const transaction = session.beginTransaction(getTransactionConfig());
        return { session, transaction };
    }

    if (executionContextType === "Transaction") {
        const transaction = input.context.executionContext as Transaction;
        return { transaction };
    }

    throw Error("Not reached");
};

async function execute(input: {
    cypher: string;
    params: any;
    defaultAccessMode: SessionMode;
    context: Context;
}): Promise<ExecuteResult> {
    const executor = getExecutor(input);

    // Its really difficult to know when users are using the `auth` param. For Simplicity it better to do the check here
    if (
        input.cypher.includes("$auth.") ||
        input.cypher.includes("auth: $auth") ||
        input.cypher.includes("auth:$auth")
    ) {
        input.params.auth = createAuthParam({ context: input.context });
    }

    const cypher =
        input.context.queryOptions && Object.keys(input.context.queryOptions).length
            ? `CYPHER ${Object.entries(input.context.queryOptions)
                  .map(([key, value]) => `${key}=${value}`)
                  .join(" ")}\n${input.cypher}`
            : input.cypher;

    try {
        debug("%s", `About to execute Cypher:\nCypher:\n${cypher}\nParams:\n${JSON.stringify(input.params, null, 2)}`);

        const result: QueryResult | undefined = await executor.transaction.run(cypher, input.params);

        if (!result) {
            throw new Error("Unable to execute query against Neo4j database");
        }

        if (executor.session) {
            await executor.transaction.commit();
        }

        const records = result.records.map((r) => r.toObject());

        debug(`Execute successful, received ${records.length} records`);

        const bookmark = executor.session ? executor.session.lastBookmark() : null;

        return {
            // Despite being typed as `string | null`, seems to return `string[]`
            bookmark: bookmark && Array.isArray(bookmark) && bookmark[0] ? bookmark[0] : null,
            result,
            statistics: result.summary.counters.updates(),
            records: result.records.map((r) => r.toObject()),
        };
    } catch (error) {
        if (error instanceof Neo4jError) {
            if (error.message.includes(`Caused by: java.lang.RuntimeException: ${AUTH_FORBIDDEN_ERROR}`)) {
                throw new Neo4jGraphQLForbiddenError("Forbidden");
            }

            if (error.message.includes(`Caused by: java.lang.RuntimeException: ${AUTH_UNAUTHENTICATED_ERROR}`)) {
                throw new Neo4jGraphQLAuthenticationError("Unauthenticated");
            }

            if (error.message.includes(`Caused by: java.lang.RuntimeException: ${RELATIONSHIP_REQUIREMENT_PREFIX}`)) {
                const [, message] = error.message.split(RELATIONSHIP_REQUIREMENT_PREFIX);
                throw new Neo4jGraphQLRelationshipValidationError(message);
            }

            if (error.code === "Neo.ClientError.Schema.ConstraintValidationFailed") {
                throw new Neo4jGraphQLConstraintValidationError("Constraint validation failed");
            }
        }

        debug("%s", error);

        throw error;
    } finally {
        if (executor.driver && executor.session) {
            await executor.session.close();
        }
    }
}

export default execute;

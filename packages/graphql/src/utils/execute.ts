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

import { SessionMode } from "neo4j-driver";
import Debug from "debug";
import { Neo4jGraphQLForbiddenError, Neo4jGraphQLAuthenticationError } from "../classes";
import { AUTH_FORBIDDEN_ERROR, AUTH_UNAUTHENTICATED_ERROR, DEBUG_EXECUTE } from "../constants";
import createAuthParam from "../translate/create-auth-param";
import { Context, DriverConfig } from "../types";
import environment from "../environment";

const debug = Debug(DEBUG_EXECUTE);

async function execute(input: {
    cypher: string;
    params: any;
    defaultAccessMode: SessionMode;
    statistics?: boolean;
    raw?: boolean;
    context: Context;
}): Promise<any> {
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

    const userAgent = `${environment.NPM_PACKAGE_NAME}/${environment.NPM_PACKAGE_VERSION}`;

    // @ts-ignore: below
    if (input.context.driver?._config) {
        // @ts-ignore: (driver >= 4.3)
        input.context.driver._config.userAgent = userAgent; // eslint-disable-line no-underscore-dangle
    }

    // @ts-ignore: (driver <= 4.2)
    input.context.driver._userAgent = userAgent; // eslint-disable-line no-underscore-dangle

    const session = input.context.driver.session(sessionParams);

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

        const result = await session[`${input.defaultAccessMode.toLowerCase()}Transaction`]((tx) =>
            tx.run(cypher, input.params)
        );

        if (input.statistics) {
            return result.summary.updateStatistics._stats; // eslint-disable-line no-underscore-dangle
        }

        if (input.raw) {
            return result;
        }

        const records = result.records.map((r) => r.toObject());

        debug(`Execute successful, received ${records.length} records`);

        return records;
    } catch (error) {
        if (error.message.includes(`Caused by: java.lang.RuntimeException: ${AUTH_FORBIDDEN_ERROR}`)) {
            throw new Neo4jGraphQLForbiddenError("Forbidden");
        }

        if (error.message.includes(`Caused by: java.lang.RuntimeException: ${AUTH_UNAUTHENTICATED_ERROR}`)) {
            throw new Neo4jGraphQLAuthenticationError("Unauthenticated");
        }

        debug("%s", error);

        throw error;
    } finally {
        await session.close();
    }
}

export default execute;

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
import { Neo4jGraphQLForbiddenError, Neo4jGraphQLAuthenticationError } from "../classes";
import { AUTH_FORBIDDEN_ERROR, AUTH_UNAUTHENTICATED_ERROR } from "../constants";
import createAuthParam from "../translate/create-auth-param";
import { Context, DriverConfig } from "../types";

// https://stackoverflow.com/a/58632373/10687857
const { npm_package_version: npmPackageVersion, npm_package_name: npmPackageName } = process.env;

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

    const session = input.context.driver.session(sessionParams);

    // @ts-ignore: Required to set connection user agent
    input.context.driver._userAgent = `${npmPackageVersion}/${npmPackageName}`; // eslint-disable-line no-underscore-dangle

    // Its really difficult to know when users are using the `auth` param. For Simplicity it better to do the check here
    if (
        input.cypher.includes("$auth.") ||
        input.cypher.includes("auth: $auth") ||
        input.cypher.includes("auth:$auth")
    ) {
        input.params.auth = createAuthParam({ context: input.context });
    }

    try {
        input.context.neoSchema.debug(`Cypher: ${input.cypher}\nParams: ${JSON.stringify(input.params, null, 2)}`);

        const result = await session[`${input.defaultAccessMode.toLowerCase()}Transaction`]((tx) =>
            tx.run(input.cypher, input.params)
        );

        if (input.statistics) {
            return result.summary.updateStatistics._stats; // eslint-disable-line no-underscore-dangle
        }

        if (input.raw) {
            return result;
        }

        return result.records.map((r) => r.toObject());
    } catch (error) {
        if (error.message.includes(`Caused by: java.lang.RuntimeException: ${AUTH_FORBIDDEN_ERROR}`)) {
            throw new Neo4jGraphQLForbiddenError("Forbidden");
        }

        if (error.message.includes(`Caused by: java.lang.RuntimeException: ${AUTH_UNAUTHENTICATED_ERROR}`)) {
            throw new Neo4jGraphQLAuthenticationError("Unauthenticated");
        }

        throw error;
    } finally {
        await session.close();
    }
}

export default execute;

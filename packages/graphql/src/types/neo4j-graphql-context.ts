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

import type { Driver, Session, Transaction } from "neo4j-driver";
import type { JWTPayload } from "jose";
import type { CypherQueryOptions, DriverConfig } from ".";
import type { Neo4jDatabaseInfo } from "../classes";

export interface Neo4jGraphQLContext {
    /**
     * @deprecated Use the {@link executionContext} property instead.
     */
    driver?: Driver;
    /**
     * If using a driver, configures the database and bookmarks to be used when acquiring a session.
     */
    driverConfig?: DriverConfig;
    /**
     * The Neo4j driver, session or transaction which will be used to execute the translated query.
     */
    executionContext?: Driver | Session | Transaction;
    /**
     * A decoded JWT payload which can be provided for use in authentication and authorization.
     */
    jwt?: JWTPayload;
    /**
     * @deprecated This property will be removed in 4.0.0.
     */
    neo4jDatabaseInfo?: Neo4jDatabaseInfo;
    /**
     * Configures which {@link https://neo4j.com/docs/cypher-manual/current/query-tuning/query-options/ | Cypher query options}
     * when executing the translated query.
     */
    queryOptions?: CypherQueryOptions;
}

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

import Cypher from "@neo4j/cypher-builder";
import type { ExecutionResult, GraphQLArgs } from "graphql";
import { graphql as graphqlRuntime } from "graphql";
import * as neo4j from "neo4j-driver";
import type { Neo4jGraphQLConstructor, Neo4jGraphQLContext } from "../../src";
import { Neo4jGraphQL } from "../../src";
import { Neo4jDatabaseInfo } from "../../src/classes";
import type { Neo4jEdition } from "../../src/classes/Neo4jDatabaseInfo";
import { createBearerToken } from "./create-bearer-token";
import { UniqueType } from "./graphql-types";

const INT_TEST_DB_NAME = "neo4jgraphqlinttestdatabase";
const DEFAULT_DB = "neo4j";

export class TestHelper {
    private _database: string = DEFAULT_DB;
    private neo4jGraphQL: Neo4jGraphQL | undefined;
    private uniqueTypes: UniqueType[] = [];
    private driver: neo4j.Driver | undefined;

    private lock: boolean = false; // Lock to avoid race condition between initNeo4jGraphQL

    private customDB: string | undefined;

    private cdc: boolean;
    constructor({ cdc = false }: { cdc: boolean } = { cdc: false }) {
        this.cdc = cdc;
    }

    public get database(): string {
        return this.customDB ?? this._database;
    }

    public createBearerToken(secret: string, extraData?: Record<string, any>) {
        return createBearerToken(secret, extraData);
    }

    public async initNeo4jGraphQL(options: Omit<Neo4jGraphQLConstructor, "driver">): Promise<Neo4jGraphQL> {
        if (this.neo4jGraphQL || this.lock) {
            throw new Error("Neo4jGraphQL already initialized. Did you forget calling .close()?");
        }
        this.lock = true;
        const driver = await this.getDriver();
        this.neo4jGraphQL = new Neo4jGraphQL({
            ...options,
            driver,
        });

        return this.neo4jGraphQL;
    }

    public createUniqueType(type: string): UniqueType {
        const uniqueType = new UniqueType(type);
        this.uniqueTypes.push(uniqueType);
        return uniqueType;
    }

    public async executeCypher(query: string, params: Record<string, unknown> = {}): Promise<neo4j.QueryResult> {
        const driver = await this.getDriver();
        return driver.executeQuery(query, params, { database: this.database });
    }

    public async executeGraphQL(
        query: string,
        args: Partial<Pick<GraphQLArgs, "variableValues" | "contextValue" | "schema">> = {}
    ): Promise<ExecutionResult> {
        if (!this.neo4jGraphQL) {
            throw new Error("Neo4j GraphQL not ready. Did you forget calling 'initNeo4jGraphQL'?");
        }
        if (args.contextValue instanceof Promise) {
            throw new Error("contextValue is a promise. Did you forget to use await with 'getContextValue'?");
        }
        const schema = await this.neo4jGraphQL.getSchema();

        return graphqlRuntime({
            schema,
            ...args,
            source: query,
            contextValue: await this.getContextValue(args.contextValue as Partial<Neo4jGraphQLContext> | undefined),
        });
    }

    public async executeGraphQLWithToken(
        query: string,
        token: string,
        args: Partial<Pick<GraphQLArgs, "variableValues">> = {}
    ): Promise<ExecutionResult> {
        return this.executeGraphQL(query, {
            ...args,
            contextValue: await this.getContextValue({ token }),
        });
    }

    public async close(preClose?: () => Promise<void>): Promise<void> {
        if (!this.driver) {
            this.reset();
            throw new Error("Closing unopened testHelper. Did you forget to call initNeo4jGraphQL?");
        }
        const driver = await this.getDriver();
        if (preClose) {
            try {
                await preClose();
            } catch (err) {
                // Ignore error
            }
        }
        await this.cleanNodes(driver, this.uniqueTypes);
        await driver.close();
        this.reset();
    }

    private reset() {
        this.driver = undefined;
        this.uniqueTypes = [];
        this.neo4jGraphQL = undefined;
        this.lock = false;
    }

    /** Use this if using graphql() directly. If possible, use .runGraphQL */
    public async getContextValue(options?: Record<string, unknown>): Promise<Neo4jGraphQLContext> {
        const driver = await this.getDriver();
        return {
            executionContext: driver,
            sessionConfig: { database: this.database },
            ...(options || {}),
        };
    }

    public async getDriver(): Promise<neo4j.Driver> {
        if (this.driver) {
            return this.driver;
        }
        const { NEO_USER = "neo4j", NEO_PASSWORD = "password", NEO_URL = "neo4j://localhost:7687/neo4j" } = process.env;

        // if (process.env.NEO_WAIT) {
        //     await util.promisify(setTimeout)(Number(process.env.NEO_WAIT));
        // }

        const auth = neo4j.auth.basic(NEO_USER, NEO_PASSWORD);
        const driver = neo4j.driver(NEO_URL, auth);
        try {
            this._database = await this.checkConnectivity(driver);
        } catch (error: any) {
            await driver.close();
            throw new Error(`Could not connect to neo4j @ ${NEO_URL}, Error: ${error.message}`);
        }

        if (this.cdc) {
            await driver.executeQuery(`ALTER DATABASE ${this.database} SET OPTION txLogEnrichment "FULL"`);
        }

        this.driver = driver;
        return this.driver;
    }

    /** Use only for tests needing a session, for normal tests use `.runGraphQL` instead.
     * Note that sessions will **not** be cleaned up with `testHelper.close`
     * */
    public async getSession(options?: Record<string, unknown>): Promise<neo4j.Session> {
        const driver = await this.getDriver();

        const appliedOptions = { ...options, database: this.database };
        return driver.session(appliedOptions);
    }

    /** Creates a new database, need to call `dropDatabase` afterwards */
    public async createDatabase(db: string): Promise<void> {
        if (this.customDB) {
            throw new Error("Cannot create new database. Did you forget to call dropDatabase?");
        }
        await this.executeCypher(`CREATE DATABASE ${Cypher.utils.escapeVariable(db)} WAIT`);
        this.customDB = db;
    }

    public async dropDatabase(): Promise<void> {
        if (!this.customDB) {
            throw new Error("Cannot drop database. Did you forget to call createDatabase?");
        }
        await this.executeCypher(`DROP DATABASE  ${Cypher.utils.escapeVariable(this.customDB)}`);
        this.customDB = undefined;
    }

    public async getDatabaseInfo(): Promise<Neo4jDatabaseInfo> {
        const DBMS_COMPONENTS_QUERY =
            "CALL dbms.components() YIELD versions, edition UNWIND versions AS version RETURN version, edition";
        const { records } = await this.executeCypher(DBMS_COMPONENTS_QUERY);
        const rawRow = records[0] as any;
        const [rawVersion, edition] = rawRow as [string, Neo4jEdition];
        return new Neo4jDatabaseInfo(rawVersion, edition);
    }

    private async checkConnectivity(driver: neo4j.Driver): Promise<string> {
        if (process.env.USE_DEFAULT_DB) {
            return this.checkConnectivityToDefaultDatabase(driver);
        } else {
            return this.verifyConnectivityToTestDatabase(driver);
        }
    }

    private async checkConnectivityToDefaultDatabase(driver: neo4j.Driver): Promise<string> {
        await driver.verifyConnectivity();
        return DEFAULT_DB;
    }

    private async verifyConnectivityToTestDatabase(driver: neo4j.Driver): Promise<string> {
        try {
            await driver.verifyConnectivity({ database: INT_TEST_DB_NAME });
            return INT_TEST_DB_NAME;
        } catch (error: any) {
            if (
                error.message.includes("Could not perform discovery. No routing servers available.") ||
                error.message.includes(
                    `Unable to get a routing table for database '${INT_TEST_DB_NAME}' because this database does not exist`
                ) ||
                error.message.includes(`Database does not exist. Database name: '${INT_TEST_DB_NAME}'`)
            ) {
                await this.checkConnectivityToDefaultDatabase(driver);
                return DEFAULT_DB;
            } else {
                throw error;
            }
        }
    }

    /** Removes all nodes with the given labels from the database */
    private async cleanNodes(driver: neo4j.Driver, labels: Array<string | UniqueType>): Promise<void> {
        if (labels.length === 0) {
            // We don't want to delete all nodes
            return;
        }

        const nodeRef = new Cypher.Node({});

        const nodeHasLabelPredicates = labels.map((l) => {
            return nodeRef.hasLabel(`${l}`);
        });

        const nodeHasAnyLabelPredicate = Cypher.or(...nodeHasLabelPredicates);

        const query = new Cypher.Match(nodeRef).where(nodeHasAnyLabelPredicate).detachDelete(nodeRef);
        const { cypher } = query.build();

        await driver.executeQuery(cypher, {}, { database: this.database });
    }
}

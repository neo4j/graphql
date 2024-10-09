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

import type { Neo4jGraphQLConstructor } from "@neo4j/graphql";
import { Neo4jGraphQL } from "@neo4j/graphql";
import type { GraphQLSchema } from "graphql";
import type { Driver, SessionConfig } from "neo4j-driver";
import { filterDocument } from "../utils/filter-document";
import Model from "./Model";

export interface OGMConstructor extends Neo4jGraphQLConstructor {
    database?: string;
}

type Neo4jGraphQLSessionConfig = Pick<SessionConfig, "database" | "impersonatedUser" | "auth">;

class OGM<ModelMap = unknown> {
    public checkNeo4jCompat: (input?: { driver?: Driver; sessionConfig?: Neo4jGraphQLSessionConfig }) => Promise<void>;
    public assertIndexesAndConstraints: (input?: {
        driver?: Driver;
        sessionConfig?: Neo4jGraphQLSessionConfig;
    }) => Promise<void>;
    private models: Model[];
    private neoSchema: Neo4jGraphQL;
    private _schema?: GraphQLSchema;
    private initializer?: Promise<void>;
    private database?: string;

    constructor(input: OGMConstructor) {
        const { typeDefs, database, ...rest } = input;

        this.models = [];
        this.database = database;

        this.neoSchema = new Neo4jGraphQL({
            ...rest,
            typeDefs: filterDocument(typeDefs),
        });

        this.checkNeo4jCompat = function checkNeo4jCompat({
            driver,
            sessionConfig,
        }: {
            driver?: Driver;
            sessionConfig?: Neo4jGraphQLSessionConfig;
        } = {}) {
            return this.neoSchema.checkNeo4jCompat({
                driver: driver || rest.driver,
                sessionConfig: sessionConfig || (database && { database }) || undefined,
            });
        };

        this.assertIndexesAndConstraints = async ({
            driver,
            sessionConfig,
        }: {
            driver?: Driver;
            sessionConfig?: Neo4jGraphQLSessionConfig;
        } = {}): Promise<void> => {
            try {
                await this.neoSchema.assertIndexesAndConstraints({
                    driver: driver || rest.driver,
                    sessionConfig: sessionConfig || (database && { database }) || undefined,
                });
            } catch (e: unknown) {
                if (
                    e instanceof Error &&
                    e.message.includes("You must await `.getSchema()` before `.assertIndexesAndConstraints()`")
                ) {
                    throw new Error("You must await `.init()` before `.assertIndexesAndConstraints()`");
                }
                throw e;
            }
        };
    }

    public get schema(): GraphQLSchema {
        if (!this._schema) {
            throw new Error("You must await `.init()` before accessing `schema`");
        }

        return this._schema;
    }

    public async init(): Promise<void> {
        if (!this.initializer) {
            this.initializer = this.createInitializer();
        }

        return this.initializer;
    }

    public model<M extends T extends keyof ModelMap ? ModelMap[T] : Model, T extends keyof ModelMap | string = string>(
        name: T
    ): M {
        let model = this.models.find((n) => n.name === name);

        if (model) {
            return model as M;
        }

        model = new Model(name as string, this.database);

        if (this._schema) {
            this.initModel(model);
        }

        this.models.push(model);
        return model as M;
    }

    private get nodes() {
        try {
            return this.neoSchema["nodes"];
        } catch {
            throw new Error("You must await `.init()` before accessing `nodes`");
        }
    }

    private initModel(model: Model) {
        const node = this.neoSchema["nodes"].find((n) => n.name === model.name);

        if (!node) {
            throw new Error(`Could not find model ${model.name}`);
        }

        const selectionSet = `
                    {
                        ${[node.primitiveFields, node.scalarFields, node.enumFields, node.temporalFields].reduce(
                            (res: string[], v) => [...res, ...v.map((x) => x.fieldName)],
                            []
                        )}
                    }
                `;

        model.init({
            schema: this.schema,
            selectionSet,
            namePluralized: node.plural,
            rootTypeFieldNames: node.rootTypeFieldNames,
        });
    }

    private createInitializer(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.neoSchema
                .getSchema()
                .then((schema) => {
                    this._schema = schema;

                    this.models.forEach((model) => this.initModel(model));

                    resolve();
                })
                .catch((e) => {
                    reject(e);
                });
        });
    }
}

export default OGM;

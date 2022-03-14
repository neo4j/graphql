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

import { Neo4jGraphQL, Neo4jGraphQLConstructor, Node } from "@neo4j/graphql";
import { GraphQLSchema } from "graphql";
import Model from "./Model";
import { filterDocument } from "../utils";

export type OGMConstructor = Neo4jGraphQLConstructor;

class OGM<ModelMap = {}> {
    public checkNeo4jCompat: () => Promise<void>;
    private models: Model[];
    private neoSchema: Neo4jGraphQL;
    private _schema?: GraphQLSchema;
    private initializer?: Promise<void>;

    constructor(input: OGMConstructor) {
        const { typeDefs, ...rest } = input;

        this.models = [];

        this.neoSchema = new Neo4jGraphQL({
            ...rest,
            typeDefs: filterDocument(typeDefs),
        });

        this.checkNeo4jCompat = function checkNeo4jCompat() {
            return this.neoSchema.checkNeo4jCompat({
                driver: rest.driver,
                ...(rest.config?.driverConfig ? { driverConfig: rest.config.driverConfig } : {}),
            });
        };
    }

    public get schema(): GraphQLSchema {
        if (!this._schema) {
            throw new Error("You must await `.init()` before accessing `schema`");
        }

        return this._schema;
    }

    public get nodes(): Node[] {
        try {
            return this.neoSchema.nodes;
        } catch {
            throw new Error("You must await `.init()` before accessing `nodes`");
        }
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

        model = new Model(name as string);

        if (this._schema) {
            this.initModel(model);
        }

        this.models.push(model);
        return model as M;
    }

    private initModel(model: Model) {
        const node = this.neoSchema.nodes.find((n) => n.name === model.name);

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
        return new Promise((resolve) => {
            this.neoSchema.getSchema().then((schema) => {
                this._schema = schema;

                this.models.forEach((model) => this.initModel(model));

                resolve();
            });
        });
    }
}

export default OGM;

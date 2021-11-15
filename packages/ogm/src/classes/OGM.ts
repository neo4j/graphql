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

import { Neo4jGraphQL, Neo4jGraphQLConstructor } from "@neo4j/graphql";
import Model from "./Model";
import { filterDocument } from "../utils";

export type OGMConstructor = Neo4jGraphQLConstructor;

class OGM<ModelMap = {}> {
    public models: Model[];

    checkNeo4jCompat: () => Promise<void>;

    public neoSchema: Neo4jGraphQL;

    constructor(input: OGMConstructor) {
        const { typeDefs, ...rest } = input;

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

        this.models = this.neoSchema.nodes.map((n) => {
            const selectionSet = `
                {
                    ${[n.primitiveFields, n.scalarFields, n.enumFields, n.temporalFields].reduce(
                        (res: string[], v) => [...res, ...v.map((x) => x.fieldName)],
                        []
                    )}
                }
            `;

            return new Model({
                neoSchema: this.neoSchema,
                name: n.name,
                selectionSet,
            });
        });
    }

    model<M extends T extends keyof ModelMap ? ModelMap[T] : Model, T extends keyof ModelMap | string = string>(
        name: T
    ): M {
        const found = this.models.find((n) => n.name === name);

        if (!found) {
            throw new Error(`Could not find model ${name}`);
        }

        return (found as unknown) as M;
    }
}

export default OGM;

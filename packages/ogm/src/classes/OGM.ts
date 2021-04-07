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

import { Driver } from "neo4j-driver";
import { Neo4jGraphQL, Neo4jGraphQLConstructor } from "@neo4j/graphql";
import Model from "./Model";
import { filterDocument } from "../utils";

class OGM {
    public neoSchema: Neo4jGraphQL;

    public models: Model[];

    public input: Neo4jGraphQLConstructor;

    constructor(input: Neo4jGraphQLConstructor) {
        this.input = input;

        this.neoSchema = new Neo4jGraphQL({
            typeDefs: filterDocument(input.typeDefs),
            driver: input.driver,
            resolvers: input.resolvers,
            schemaDirectives: input.schemaDirectives,
            debug: input.debug,
            driverConfig: input.driverConfig,
        });

        this.models = this.neoSchema.nodes.map((n) => {
            const selectionSet = `
                {
                    ${[n.primitiveFields, n.scalarFields, n.enumFields, n.dateTimeFields].reduce(
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

    model(name: string): Model {
        const found = this.models.find((n) => n.name === name);

        if (!found) {
            throw new Error(`Could not find model ${name}`);
        }

        return found;
    }

    async checkNeo4jCompat(input: { driver?: Driver } = {}): Promise<void> {
        const driver = input.driver || this.input.driver;

        return this.neoSchema.checkNeo4jCompat({ driver });
    }
}

export default OGM;

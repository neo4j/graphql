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

import type { DocumentNode } from "graphql";
import gql from "graphql-tag";
import type { Neo4jGraphQLSchemaModel } from "../../../src/schema-model/Neo4jGraphQLSchemaModel";
import { generateModel } from "../../../src/schema-model/generate-model";

export class SchemaModelBuilder {
    private schemaModel: Neo4jGraphQLSchemaModel;

    constructor(typeDefs: DocumentNode | string) {
        if (typeof typeDefs === "string") {
            typeDefs = gql(typeDefs);
        }
        this.schemaModel = generateModel(typeDefs);
    }

    public instance(): Neo4jGraphQLSchemaModel {
        return this.schemaModel;
    }
}

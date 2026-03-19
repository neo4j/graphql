/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
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

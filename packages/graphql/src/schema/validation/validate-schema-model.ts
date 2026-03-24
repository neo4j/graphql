/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { GraphQLError } from "graphql";
import type { Neo4jGraphQLSchemaModel } from "../../schema-model/Neo4jGraphQLSchemaModel";
import { pluralConflict } from "./schema-model-rules/plural-conflict";

type SchemaModelValidationRule = (model: Neo4jGraphQLSchemaModel) => GraphQLError[];

export function validateSchemaModel(schemaModel: Neo4jGraphQLSchemaModel): void {
    const rules: SchemaModelValidationRule[] = [pluralConflict];

    const errors = rules.flatMap((rule) => {
        return rule(schemaModel);
    });

    if (errors.length > 0) {
        throw errors;
    }
}

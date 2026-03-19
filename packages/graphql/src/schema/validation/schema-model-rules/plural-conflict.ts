/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLError } from "graphql";
import type { Neo4jGraphQLSchemaModel } from "../../../schema-model/Neo4jGraphQLSchemaModel";

export function pluralConflict(schemaModel: Neo4jGraphQLSchemaModel): GraphQLError[] {
    const entities = schemaModel.entities.values();
    const errors: GraphQLError[] = [];

    const plurals = new Set<string>();
    for (const entity of entities) {
        if (plurals.has(entity.plural)) {
            errors.push(new GraphQLError(`Ambiguous plural "${entity.plural}" in "${entity.name}"`));
        }
        plurals.add(entity.plural);
    }

    return errors;
}

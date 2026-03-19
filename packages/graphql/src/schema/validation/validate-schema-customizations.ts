/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { DocumentNode, GraphQLSchema } from "graphql";
import { getDefinitionCollection } from "../../schema-model/parser/definition-collection";
import { validateCustomResolverRequires } from "./validate-custom-resolver-requires";

export function validateSchemaCustomizations({ document, schema }: { document: DocumentNode; schema: GraphQLSchema }) {
    const definitionCollection = getDefinitionCollection(document);

    for (const objectType of definitionCollection.objectTypes.values()) {
        validateCustomResolverRequires(objectType, schema);
    }
}

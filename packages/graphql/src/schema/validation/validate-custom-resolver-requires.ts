/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { mergeSchemas } from "@graphql-tools/schema";
import type { DocumentNode, GraphQLSchema, InterfaceTypeDefinitionNode, ObjectTypeDefinitionNode } from "graphql";
import { Kind, parse, validate } from "graphql";

export function validateCustomResolverRequires(objType: ObjectTypeDefinitionNode, schema: GraphQLSchema) {
    if (!objType.fields) {
        return;
    }

    for (const field of objType.fields) {
        if (!field.directives) {
            continue;
        }

        const customResolverDirective = field.directives.find((directive) => directive.name.value === "customResolver");
        if (!customResolverDirective || !customResolverDirective.arguments) {
            continue;
        }

        const requiresArg = customResolverDirective.arguments.find((arg) => arg.name.value === "requires");
        if (!requiresArg) {
            continue;
        }

        if (requiresArg.value.kind !== Kind.STRING) {
            throw new Error("@customResolver requires expects a string");
        }

        const selectionSetDocument = parse(`{ ${requiresArg.value.value} }`);
        validateSelectionSet(schema, objType, selectionSetDocument);
    }
}

function validateSelectionSet(
    baseSchema: GraphQLSchema,
    object: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
    selectionSetDocument: DocumentNode
) {
    const validationSchema = mergeSchemas({
        schemas: [baseSchema],
        typeDefs: `
                schema {
                    query: ${object.name.value}
                }
            `,
        assumeValid: true,
    });
    const errors = validate(validationSchema, selectionSetDocument);
    if (errors.length) {
        throw new Error(
            `Invalid selection set provided to @customResolver on ${object.name.value}:\n${errors.join("\n")}`
        );
    }
}

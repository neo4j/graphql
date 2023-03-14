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

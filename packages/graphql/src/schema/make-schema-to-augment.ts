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

import type { DefinitionNode, DocumentNode, ObjectTypeDefinitionNode } from "graphql";
import { Kind } from "graphql";
import getFieldTypeMeta from "./get-field-type-meta";

export function makeSchemaToAugment(document: DocumentNode): {
    document: DocumentNode;
    typesExcludedFromGeneration: { jwtPayload?: ObjectTypeDefinitionNode };
} {
    const jwtTypeDefinitions: ObjectTypeDefinitionNode[] = [];
    const definitions: DefinitionNode[] = [];

    for (const definition of document.definitions) {
        if (
            definition.kind === Kind.OBJECT_TYPE_DEFINITION &&
            (definition.directives || []).some((x) => x.name.value === "jwtPayload")
        ) {
            jwtTypeDefinitions.push(definition);
        } else {
            definitions.push(definition);
        }
    }

    const jwtPayload = parseJwtPayload(jwtTypeDefinitions);
    if (!jwtPayload) {
        return {
            document,
            typesExcludedFromGeneration: {},
        };
    }
    return {
        document: {
            ...document,
            definitions,
        },
        typesExcludedFromGeneration: { jwtPayload },
    };
}

function parseJwtPayload(jwtPayloadAnnotatedTypes: ObjectTypeDefinitionNode[]): ObjectTypeDefinitionNode | undefined {
    if (!jwtPayloadAnnotatedTypes.length) {
        return undefined;
    }
    if (jwtPayloadAnnotatedTypes.length > 1) {
        throw new Error(`@jwtPayload directive can only be used once in the Type Definitions.`);
    }
    const jwtPayload = jwtPayloadAnnotatedTypes[0];
    if ((jwtPayload?.directives || []).length > 1) {
        throw new Error(`@jwtPayload directive cannot be combined with other directives.`);
    }
    jwtPayload?.fields?.forEach((f) => {
        const typeMeta = getFieldTypeMeta(f.type);
        if (!["String", "ID", "Int", "Float", "Boolean"].includes(typeMeta.name)) {
            throw new Error("fields of a @jwtPayload type can only be Scalars or Lists of Scalars.");
        }
    });
    return jwtPayload;
}

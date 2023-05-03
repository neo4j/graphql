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

import type { DocumentNode, ObjectTypeDefinitionNode } from "graphql";
import { Kind } from "graphql";
import getFieldTypeMeta from "./get-field-type-meta";

// TODO: alternatively use get-obj-field-meta for validation and make schema-validation find the @jwtPayload annotated type
function makeSchemaToAugment(document: DocumentNode): {
    document: DocumentNode;
    typesExcludedFromGeneration: { jwtPayload?: ObjectTypeDefinitionNode };
} {
    const jwtPayloadAnnotatedTypes = document.definitions.filter(
        (def) =>
            def.kind === Kind.OBJECT_TYPE_DEFINITION &&
            (def.directives || []).find((x) => x.name.value === "jwtPayload")
    );
    if (!jwtPayloadAnnotatedTypes.length) {
        return {
            document,
            typesExcludedFromGeneration: {},
        };
    }

    if (jwtPayloadAnnotatedTypes.length > 1) {
        throw new Error(`@jwtPayload directive can only be used once in the Type Definitions.`);
    }
    const jwtPayload = jwtPayloadAnnotatedTypes[0] as ObjectTypeDefinitionNode;
    if ((jwtPayload.directives || []).length > 1) {
        throw new Error(`@jwtPayload directive cannot be combined with other directives.`);
    }
    jwtPayload.fields?.forEach((f) => {
        const typeMeta = getFieldTypeMeta(f.type);
        if (!["String", "ID", "Int", "Float", "Boolean"].includes(typeMeta.name)) {
            throw new Error("fields of a @jwtPayload type can only be Scalars or Lists of Scalars.");
        }
    });

    return {
        document: {
            ...document,
            definitions: document.definitions.filter((d) => !jwtPayloadAnnotatedTypes.includes(d)),
        },
        typesExcludedFromGeneration: { jwtPayload },
    };
}

export default makeSchemaToAugment;

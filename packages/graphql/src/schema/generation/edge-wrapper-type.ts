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
import type { InputTypeComposer, SchemaComposer } from "graphql-compose";
import type { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";

function getEdgeWrapperTypeDescription({
    inputType,
    relationshipAdapter,
}: {
    inputType: InputTypeComposer;
    relationshipAdapter: RelationshipAdapter;
}): string {
    const initialDescription = `Relationship properties when source node is of type:`;
    const entryInDescription = `* ${relationshipAdapter.source.name}`;

    return [
        inputType.hasField(relationshipAdapter.propertiesTypeName as string)
            ? inputType.getField(relationshipAdapter.propertiesTypeName as string).description
            : initialDescription,
        entryInDescription,
    ].join("\n");
}

export function withEdgeWrapperType({
    edgeTypeName,
    edgeFieldTypeName,
    edgeFieldAdapter,
    composer,
}: {
    edgeTypeName: string;
    edgeFieldTypeName: string;
    edgeFieldAdapter: RelationshipAdapter;
    composer: SchemaComposer;
}): InputTypeComposer | undefined {
    if (!edgeFieldAdapter.propertiesTypeName) {
        return;
    }
    const inputType = composer.getOrCreateITC(edgeTypeName);
    inputType.addFields({
        [edgeFieldAdapter.propertiesTypeName]: {
            type: edgeFieldTypeName,
            description: getEdgeWrapperTypeDescription({ inputType, relationshipAdapter: edgeFieldAdapter }),
        },
    });
    return inputType;
}

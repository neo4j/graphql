/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
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

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

import type {
    InputTypeComposer,
    ObjectTypeComposer,
    ObjectTypeComposerArgumentConfigMapDefinition,
    SchemaComposer,
} from "graphql-compose";
import type { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";

/** Returns the type and args for groupBy field in connections */
export function makeConnectionGroupByType({
    entityAdapter,
    composer,
}: {
    entityAdapter: ConcreteEntityAdapter;
    composer: SchemaComposer;
}): { type: ObjectTypeComposer; args: ObjectTypeComposerArgumentConfigMapDefinition } | undefined {
    const typeName = entityAdapter.operations.getConnectionGroupByTypename();
    const groupByFields = entityAdapter.groupByFields;

    if (groupByFields.length === 0) {
        return undefined;
    }

    return getOrCreateConnectionGroupBy({
        typeName,
        composer,
        edgeType: getGroupByEdgeType({ composer, entityAdapter }),
        entityAdapter,
    });
}

function getOrCreateConnectionGroupBy({
    typeName,
    composer,
    edgeType,
    entityAdapter,
}: {
    typeName: string;
    composer: SchemaComposer;
    edgeType: ObjectTypeComposer;
    entityAdapter: ConcreteEntityAdapter;
}): {
    type: ObjectTypeComposer;
    args: ObjectTypeComposerArgumentConfigMapDefinition;
} {
    const inputArgs = getInputArgs({ entityAdapter, composer });

    if (composer.has(typeName)) {
        return { type: composer.getOTC(typeName), args: inputArgs };
    }

    const connectionGroupByOTC = composer.createObjectTC(typeName);
    connectionGroupByOTC.addFields({
        edges: edgeType.NonNull.List.NonNull,
    });

    return { type: connectionGroupByOTC, args: inputArgs };
}

function getGroupByEdgeType({
    entityAdapter,
    composer,
}: {
    entityAdapter: ConcreteEntityAdapter | RelationshipAdapter;
    composer: SchemaComposer;
}): ObjectTypeComposer {
    const edgeTypeName = entityAdapter.operations.getConnectionGroupByEdgeTypename();
    return composer.getOrCreateOTC(edgeTypeName, (oc) => {
        const nodeType = composer.getOTC(entityAdapter.name);
        oc.addFields({
            node: nodeType.NonNull,
        });
    });
}

function getInputArgs({ entityAdapter, composer }: { entityAdapter: ConcreteEntityAdapter; composer: SchemaComposer }) {
    const inputType = getOrCreateConnectionGroupByInputType({ entityAdapter, composer });
    return {
        fields: inputType.NonNull,
    };
}

function getOrCreateConnectionGroupByInputType({
    entityAdapter,
    composer,
}: {
    entityAdapter: ConcreteEntityAdapter;
    composer: SchemaComposer;
}): InputTypeComposer {
    const typeName = entityAdapter.operations.getConnectionGroupByInputTypename();
    if (composer.has(typeName)) {
        return composer.getITC(typeName);
    }

    const connectionGroupByITC = composer.createInputTC(typeName);
    for (const attribute of entityAdapter.groupByFields) {
        connectionGroupByITC.addFields({
            [attribute.name]: "Boolean",
        });
    }

    return connectionGroupByITC;
}

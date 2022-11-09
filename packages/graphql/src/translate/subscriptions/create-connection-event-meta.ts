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

import { META_CYPHER_VARIABLE } from "../../constants";

export type SubscriptionsEventType = "connect" | "disconnect";

type EventMetaParameters = {
    event: SubscriptionsEventType;
    relVariable: string;
    node1Variable: string;
    node2Variable: string;
    typename: string;
    node1Typename: string;
    node2Typename: string;
};

export function createConnectionEventMeta(params: EventMetaParameters): string {
    return `${META_CYPHER_VARIABLE} + ${createConnectionEventMetaObject(params)} AS ${META_CYPHER_VARIABLE}`;
}

export function createConnectionEventMetaObject({
    event,
    relVariable,
    node1Variable,
    node2Variable,
    typename,
    node1Typename,
    node2Typename,
}: EventMetaParameters): string {
    const idsAndProperties = createEventMetaIdsAndProperties({ relVariable, node1Variable, node2Variable });
    return `{ event: "${event}", ${idsAndProperties}, timestamp: timestamp(), relationshipName: "${typename}", node1Typename: "${node1Typename}", node2Typename: "${node2Typename}" }`;
}

function createEventMetaIdsAndProperties({
    relVariable,
    node1Variable,
    node2Variable,
}: {
    relVariable: string;
    node1Variable: string;
    node2Variable: string;
}): string {
    const projectAllProperties = (varName: string): string => `${varName} { .* }`;
    const idsStr = `id_node1: id(${node1Variable}), id_node2: id(${node2Variable}), id: id(${relVariable})`;
    const propertiesStr = `properties: { node1: ${projectAllProperties(node1Variable)}, node2: ${projectAllProperties(
        node2Variable
    )}, relationship: ${projectAllProperties(relVariable)} }`;
    return [idsStr, propertiesStr].join(", ");
}

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
    typename: string;
    fromVariable: string;
    toVariable: string;
    fromTypename?: string;
    toTypename?: string;
    fromLabels?: string;
    toLabels?: string;
    toProperties?: string;
    fromProperties?: string;
};

export function createConnectionEventMeta(params: EventMetaParameters): string {
    return `${META_CYPHER_VARIABLE} + ${createConnectionEventMetaObject(params)} AS ${META_CYPHER_VARIABLE}`;
}

export function createConnectionEventMetaObject({
    event,
    relVariable,
    fromVariable,
    toVariable,
    typename,
    fromTypename,
    toTypename,
    fromLabels,
    toLabels,
    toProperties,
    fromProperties,
}: EventMetaParameters): string {
    const projectAllProperties = (varName: string): string => `${varName} { .* }`;

    const commonFieldsStr = `event: "${event}", timestamp: timestamp()`;
    const identifiersStr = `id_from: id(${fromVariable}), id_to: id(${toVariable}), id: id(${relVariable})`;
    const propertiesStr = `properties: { from: ${fromProperties || projectAllProperties(fromVariable)}, to: ${
        toProperties || projectAllProperties(toVariable)
    }, relationship: ${projectAllProperties(relVariable)} }`;

    const useTypenames = !!fromTypename;
    const typeIdentifiersStr = useTypenames
        ? `relationshipName: "${typename}", fromTypename: "${fromTypename}", toTypename: "${toTypename}"`
        : `relationshipName: ${typename}, fromLabels: ${fromLabels}, toLabels: ${toLabels}`;

    return `{ ${[commonFieldsStr, identifiersStr, typeIdentifiersStr, propertiesStr].join(", ")} }`;
}

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

export type SubscriptionsEventType = "create_relationship" | "delete_relationship";

type EventMetaParameters = EventMetaTypenameParameters | EventMetaLabelsParameters;
type EventMetaCommonParameters = {
    event: SubscriptionsEventType;
    relVariable: string;
    typename: string;
    fromVariable: string;
    toVariable: string;
};
type EventMetaTypenameParameters = EventMetaCommonParameters & {
    fromTypename: string;
    toTypename: string;
};
type EventMetaLabelsParameters = EventMetaCommonParameters & {
    fromLabels: string;
    toLabels: string;
    toProperties: string;
    fromProperties: string;
};

function isEventMetaWithTypenames(event: EventMetaParameters): event is EventMetaTypenameParameters {
    return !!event["fromTypename"];
}

function projectAllProperties(varName: string): string {
    return `${varName} { .* }`;
}

export function createConnectionEventMeta(params: EventMetaParameters): string {
    return `${META_CYPHER_VARIABLE} + ${createConnectionEventMetaObject(params)} AS ${META_CYPHER_VARIABLE}`;
}

export function createConnectionEventMetaObject(eventMeta: EventMetaParameters): string {
    const { event, relVariable, typename, fromVariable, toVariable } = eventMeta;

    const commonFieldsStr = `event: "${event}", timestamp: timestamp()`;
    const identifiersStr = `id_from: id(${fromVariable}), id_to: id(${toVariable}), id: id(${relVariable})`;

    if (isEventMetaWithTypenames(eventMeta)) {
        return `{ ${[
            commonFieldsStr,
            identifiersStr,
            `relationshipName: "${typename}", fromTypename: "${eventMeta.fromTypename}", toTypename: "${eventMeta.toTypename}"`,
            `properties: { from: ${projectAllProperties(fromVariable)}, to: ${projectAllProperties(
                toVariable,
            )}, relationship: ${projectAllProperties(relVariable)} }`,
        ].join(", ")} }`;
    } else {
        return `{ ${[
            commonFieldsStr,
            identifiersStr,
            `relationshipName: ${typename}, fromLabels: ${eventMeta.fromLabels}, toLabels: ${eventMeta.toLabels}`,
            `properties: { from: ${eventMeta.fromProperties}, to: ${
                eventMeta.toProperties
            }, relationship: ${projectAllProperties(relVariable)} }`,
        ].join(", ")} }`;
    }
}

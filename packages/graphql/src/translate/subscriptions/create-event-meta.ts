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

import { META_CYPHER_VARIABLE, META_OLD_PROPS_CYPHER_VARIABLE } from "../../constants";

export type SubscriptionsEventType = "create" | "update" | "delete";

type EventMetaParameters = {
    event: SubscriptionsEventType;
    nodeVariable: string;
    typename: string;
};

export function createEventMeta(params: EventMetaParameters): string {
    return `${META_CYPHER_VARIABLE} + ${createEventMetaObject(params)} AS ${META_CYPHER_VARIABLE}`;
}

export function createEventMetaObject({ event, nodeVariable, typename }: EventMetaParameters): string {
    const properties = createEventMetaProperties({ event, nodeVariable });
    return `{ event: "${event}", id: id(${nodeVariable}), ${properties}, timestamp: timestamp(), typename: "${typename}" }`;
}

function createEventMetaProperties({
    event,
    nodeVariable,
}: {
    event: SubscriptionsEventType;
    nodeVariable: string;
}): string {
    let oldProps: string;
    let newProps: string;

    switch (event) {
        case "create":
            oldProps = "null";
            newProps = `${nodeVariable} { .* }`;
            break;
        case "update":
            oldProps = META_OLD_PROPS_CYPHER_VARIABLE;
            newProps = `${nodeVariable} { .* }`;
            break;
        case "delete":
            oldProps = `${nodeVariable} { .* }`;
            newProps = "null";
            break;
        // no default
    }

    return `properties: { old: ${oldProps}, new: ${newProps} }`;
}

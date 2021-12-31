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

import { ResolveTree } from "graphql-parse-resolve-info";
import { Node } from "../../classes";
import { MutationMetaType, MutationSubscriptionResult, SubscriptionFilter, MutationEvent } from "../../types";

export function preProcessFilters(
    filter: SubscriptionFilter,
) {
    
    let types: MutationMetaType[] = [ 'Updated', 'Created', 'Deleted', 'Connected', 'Disconnected' ];
    // We can use the provided input in our asyncIterator because
    // it is validated by the graphql enum "NodeUpdatedType"
    if (filter?.type) {
        types = [ filter.type ];
    } else if (filter?.type_IN) {
        types = filter.type_IN;
    } else if (filter?.type_NOT) {
        types = types.filter((t) => filter.type_NOT !== t);
    } else if (filter?.type_NOT_IN) {
        types = types.filter((t) => !filter.type_NOT_IN?.includes(t));
    } else if (filter?.type_UNDEFINED !== undefined) {
        // This is essentially pointless (no results would be returned)
        // but it's here for consistency
        types = filter?.type_UNDEFINED ? [] : types;
    } else {
        types = [ 'Updated', 'Created' ];
    }

    return types;
}

export function filterSubscriptionResult(
    payload: MutationEvent,
    filter: SubscriptionFilter,
) {
    if (!payload || !payload.id) { return false; }
    if (!filter) { return true; }
    
    for (const filterName of [
        'type', // This may be filtered muliple times (in pubsub and here)
        'id',
        'toID',
        'relationshipID',
        'toName',
        'relationshipName',
        'handle',
    ]) {
        const value = payload[filterName];
        const filter_vals = {
            filter: filter[filterName],
            not: filter[`${ filterName }_NOT`],
            in: filter[`${filterName }_IN`],
            not_in: filter[`${filterName }_NOT_IN`],
            undefined: filter[`${filterName }_UNDEFINED`],
        };

        if (filter_vals.filter !== undefined && filter_vals.filter !== value) {
            return false;
        }

        if (filter_vals.not !== undefined && filter_vals.not === value) {
            return false;
        }

        if (filter_vals.in !== undefined && !filter_vals.in.includes(value)) {
            return false;
        }

        if (filter_vals.not_in !== undefined && filter_vals.in.includes(value)) {
            return false;
        }

        if ((filter_vals.undefined === true && value) || filter_vals.undefined === false && value === undefined) {
            return false;
        }
    }

    if (filter.propsUpdated) {
        const propsUpdated: string[] = 'properties' in payload ? Object.keys((payload as any).properties) : [];
        let found = false;
        for (const prop of filter.propsUpdated) {
            if (propsUpdated.includes(prop)) {
                found = true;
                break;
            }
        }
        if (!found) { return false; }
    }

    return true;
}

/**
 * Resolves a subscription result and determines if it should be resolved/filtered out
 * @param payload 
 * @param args 
 * @returns 
 */
export function resolveSubscriptionResult(
    node: Node,
    payload: MutationEvent,
    filter: SubscriptionFilter,
    subCache?: { [key: string]: any },
) {
    if (!filterSubscriptionResult(payload, filter)) {
        return false;
    }

    if (payload.type === 'Deleted') {
        if (!subCache) { return false; }

        const cached = subCache[payload.id];
        if (!cached) { return false; }

        // eslint-disable-next-line no-param-reassign
        payload[node.name.toLowerCase()] = cached;
    }

    return true;
}

export function writeSubscriptionResultToCache(
    node: Node,
    payload: MutationSubscriptionResult,
    self: any,
    subCache?: { [key: string]: any },
) {
    // eslint-disable-next-line no-param-reassign
    payload[node.name.toLowerCase()] = self;
    subCache = subCache || {};

    if ([ 'Updated', 'Created' ].includes(payload.type)) {
        // eslint-disable-next-line no-param-reassign
        subCache[payload.id] = self;
    }

    return subCache;
}

export function resolveNodeFieldFromSubscriptionResponseAndAddInternalID(
    node: Node,
    resolveTree: ResolveTree,
) {

    const fields = resolveTree.fieldsByTypeName;
    const rtSubResponse = fields ? fields[`${ node.name }SubscriptionResponse`] : {};
    fields[`${ node.name }SubscriptionResponse`] = rtSubResponse;

    const rtPath = rtSubResponse[node.name.toLowerCase()] || {};
    rtSubResponse[node.name.toLowerCase()] = rtPath;

    rtPath.fieldsByTypeName = rtPath.fieldsByTypeName || {};
    const rtNode = rtPath.fieldsByTypeName[node.name] || {};
    rtPath.fieldsByTypeName[node.name] = rtNode;
    rtPath.args = resolveTree.args;

    // eslint-disable-next-line no-underscore-dangle
    rtNode._id = {
        alias: '_id',
        args: {},
        fieldsByTypeName: {},
        name: '_id',
    };

    return rtPath;
}

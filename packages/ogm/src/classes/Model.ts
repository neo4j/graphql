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

import { filterSubscriptionResult, localPubSub, Neo4jGraphQL, preProcessFilters, upperFirst } from "@neo4j/graphql";
import { MutationEventWithResult } from "@neo4j/graphql/src/types";
import camelCase from "camelcase";
import { DocumentNode, graphql, parse, print, SelectionSetNode } from "graphql";
import { PubSubEngine } from "graphql-subscriptions";
import pluralize from "pluralize";
import { Observable, Subject } from "rxjs";
import { DeleteInfo, GraphQLOptionsArg, GraphQLWhereArg, SubscriptionFilter } from "../types";
import Debug from "debug";

const debug = Debug('@neo4j/graphql-ogm');

export interface ModelConstructor {
    name: string;
    selectionSet: string;
    neoSchema: Neo4jGraphQL;
}

function printSelectionSet(selectionSet: string | DocumentNode | SelectionSetNode): string {
    if (typeof selectionSet === "string") {
        return print(parse(selectionSet));
    }

    return print(selectionSet);
}

class Model {
    public name: string;

    private namePluralized: string;

    private camelCaseName: string;

    private neoSchema: Neo4jGraphQL;

    protected selectionSet: string;

    constructor(input: ModelConstructor) {
        this.name = input.name;
        this.namePluralized = pluralize(input.name);
        this.camelCaseName = camelCase(this.namePluralized);
        this.neoSchema = input.neoSchema;
        this.selectionSet = input.selectionSet;
    }

    public setSelectionSet(selectionSet: string | DocumentNode) {
        this.selectionSet = printSelectionSet(selectionSet);
    }

    async find<T = any[]>({
        where,
        fulltext,
        options,
        selectionSet,
        args = {},
        context = {},
        rootValue = null,
    }: {
        where?: GraphQLWhereArg;
        fulltext?: any;
        options?: GraphQLOptionsArg;
        selectionSet?: string | DocumentNode | SelectionSetNode;
        args?: any;
        context?: any;
        rootValue?: any;
    } = {}): Promise<T> {
        const argWorthy = Boolean(where || options || fulltext);

        const argDefinitions = [
            `${argWorthy ? "(" : ""}`,
            `${where ? `$where: ${this.name}Where` : ""}`,
            `${options ? `$options: ${this.name}Options` : ""}`,
            `${fulltext ? `$fulltext: ${this.name}Fulltext` : ""}`,
            `${argWorthy ? ")" : ""}`,
        ];

        const argsApply = [
            `${argWorthy ? "(" : ""}`,
            `${where ? `where: $where` : ""}`,
            `${options ? `options: $options` : ""}`,
            `${fulltext ? `fulltext: $fulltext` : ""}`,
            `${argWorthy ? ")" : ""}`,
        ];

        const selection = printSelectionSet(selectionSet || this.selectionSet);

        const query = `
            query ${argDefinitions.join(" ")}{
                ${this.camelCaseName}${argsApply.join(" ")} ${selection}
            }
        `;

        const variableValues = { where, options, ...args };

        const result = await graphql(this.neoSchema.schema, query, rootValue, context, variableValues);

        if (result.errors?.length) {
            throw new Error(result.errors[0].message);
        }

        return (result.data as any)[this.camelCaseName] as T;
    }

    /**
     * Observe subscription events emitted for this model's
     * type using rxjs.
     * 
     * **Example:**
     * 
     * ```typescript
     * 
     * const Movie = ogm.model('Movie');
     * const obs = Movie.observe({
     *   filter: { type_IN: [ 'Created', 'Updated', 'Connected', 'Disconnected' ] },
     *   where: {
     *     released: true,
     *   }
     * });
     * 
     * const sub = obs.subscribe((payload) => {
     *   if (payload.properties && payload.properties.released) {
     *      sendEmailToAllMembers(
     *         `${ payload.result.name } was just released!`
     *          + `Get your tickets now! `
     *     `);
     *   }
     * })
     * 
     * // Ensure cleanup somewhere when you're done observing:
     * sub.unsubscribe();
     * await obs.close();
     * 
     * ```
     * 
     * ## Cleanup
     *
     * Ensure that you cleanup this function with `await obs.close();`
     * 
     * ## Default Types
     * 
     * By default, this function only observes "Created" and "Updated"
     * events. Change the "filter.type_IN" option to add other events.
     * 
     * ## subCache for deleted nodes
     * 
     * For `Deleted` events, if you want a record of the node that was deleted,
     * you may set `enableSubCache` to true. This will build a cache at the
     * beginning of the observe function (if possible) and the cache will try
     * to stay up to date with any updates, creates, etc.
     * 
     * ## Horizontal Scalability
     * 
     * By default, OGM will only listen to `local` pubsub events which occur
     * on *this* instance
     * of the application (IE OGM must be running alongside Neo4j GraphQL).
     * If you have multiple applications or multiple instances of this running
     * where OGM runs in parallel with Neo4j Graphql then you should be set to
     * go by default. If you run OGM on a seperate instance from Neo4j Graphql
     * you will have to roll out your own event system. You may set `pubsub: 'foreign'`
     * as to use OGM's `pubsub` instance or you may pass a custom pubsub instance in.
     * 
     * In most cases, so long as OGM and Neo4j GraphQL have similar versions, then this
     * should work. If you plan to use the `foreign` pubsub in this model *and* you
     * have horizontal scalability implemented for this applicaiton then please consider,
     * when designing this application, to roll out some kind of exclusive event system
     * to prevent code from being executed multiple times on the same machine. Neo4J GraphQL
     * does not provide this as we assume the user will be OK with executing events
     * within the same application instance that they were emitted.
     * 
     * @param params 
     * @returns An observable which can be subscribed to which contains event payloads.
     * This observable must be closed to clean it up properly & prevent memory leaks and
     * a degredation in performance. It also holds the subCache which is used to retrieve
     * deleted items.
     */
    observe<T>(params: {
        /**
         * Filter events by node using neo4j where conditions
         * for this model.
         */
        where?: GraphQLWhereArg;
        /**
         * Options to use for the deleteCache.
         */
        options?: GraphQLOptionsArg;

        /**
         * Filter events before they are resolved & emitted
         */
        filter?: SubscriptionFilter;
        selectionSet?: string | DocumentNode | SelectionSetNode;
        args?: any;
        context?: any;
        rootValue?: any;

        /**
         * See `Horizontal Scalability` under Model.observe for more information.
         * 
         * Set to 'local' to use this applications localPubSub instance.
         * 
         * Set to 'foreign' to use OGM's pubsub instance
         * 
         * Can also set to a custom pubsub engine.
         */
        pubsub?: 'local' | 'foreign' | PubSubEngine;

        /**
         * If enabled, will add a cached result to the "Deleted" event types.
         * To build that cache, the system must load all objects at the beginning
         * of the event. It will also update that cache if any "Updated" or "Created"
         * events occur. The cache can be accessed as the "subCache" return property.
         * 
         * Increases load on DB and memory used if subCache is used.
         * 
         * Disables the deleted cache. This is only used when "Deleted"
         * is in the list of event types to subscribe to.
         * 
         * This property will be ignored (not set) if `disableResolve`
         * is set to `true`.
         */
        enableSubCache?: boolean;

        /**
         * Callback which is fired after the subCache is initialized or there was
         * an error initializing the subCache.
         */
        cbSubCacheResolved?: (err?: Error) => void;

        /**
         * Increases event emit speed and load on DB if resolve is used.
         * 
         * If this is set to true, it will disable the subscription resolver
         * and drastically increase the performance of this function. However,
         * `where` and `options` arguments will be ignored and "result" in the
         * payloads will be `undefined`. This also disables the subCache.
         * 
         * **Note:**  
         *  `payload.properties` will still contain the values that changed for
         * that event. 
         * 
         * **For example:**  
         * Given you set this value to true, when you observe `Movie` with a
         * where filter of `{name_IN: ['Pulp Fiction', 'The Dark Knight']}`, then movies with a
         * different name will still be sent to all subscriptions and `payload.result` will
         * be undefined instead of the movie.
         */ 
        disableResolve?: boolean;


        /**
         * No performance gain.
         * 
         * If an event does not resolve to a node then continue to pass the event on
         * to subscriptions with `payload.result` set to undefined.
         */
        keepUnresolved?: boolean;

    } = {}) {
        let pubsub: PubSubEngine;
        if (typeof params.pubsub === 'object') {
            pubsub = params.pubsub;
        } else if (params.pubsub === 'foreign') {
            pubsub = this.neoSchema.pubsub;
        } else {
            pubsub = localPubSub;
        }

        if (!pubsub) { throw new Error(`Pubsub not defined.`); }


        params.filter = params.filter || {};
        // params.args = params.args || {};

        const types = preProcessFilters(params.filter);

        if (params.disableResolve) {
            params.enableSubCache = false;
        }

        /**
         * Loads objects given `where` and `options` params.
         * Provide an option _id to also resolve by internal ID
         * @param _id 
         * @returns 
         */
        const loadObjects = async (_id?: number) => {
            const argsDef = `(
                $where: ${ this.name }Where
            )`;

            const argsApply = `(
                where: $where
            )`;
    
            let selection = printSelectionSet(params.selectionSet || this.selectionSet);
            selection = selection.replace('{', '{\n_id');
    
            const query = `
                query ${ argsDef }{
                    ${this.camelCaseName}${ argsApply } ${selection}
                }
            `;

            const input = {
                ...params.args,
                where: {
                    ...params.where,
                },
            };

            if (_id) {
                input.where._id = _id;
            }

            const result = await graphql(this.neoSchema.schema, query, params.rootValue, params.context || {}, input);
            if (result.errors?.length) {
                throw new Error(result.errors[0].message);
            }
            
            if (result?.data && result.data[this.camelCaseName]) {
                const objs = result.data[this.camelCaseName];

                if (subCache && params.enableSubCache) {
                    for (const obj of objs) {
                        console.log(obj);
                        if (!obj._id) { continue; }
                        subCache[obj._id] = obj;
                    }
                }
                return objs;
            }

            return [];
        }

        const resolveResultFromPayload = async (value: MutationEventWithResult<T>) => {
            if (value.type === 'Deleted') {
                // resolve object from sub cache if available.
                value.result = subCache ? subCache[value.id] : undefined;
                return value;
            }

            const [ obj ] = await loadObjects(value.id);
            if (obj) {
                value.result = obj;
            }

            return value;
        }

        const subCache = {};
        if (params.enableSubCache) {
            // Load objects now to retrieve them after they have been deleted
            // figure out if we need to do a load of objects
            loadObjects().then((objs) => {
                if (params.cbSubCacheResolved) {
                    params.cbSubCacheResolved();
                }

            }).catch((err) => {
                debug('Could not resolve subCache: %s', err);
                if (params.cbSubCacheResolved) {
                    params.cbSubCacheResolved(err);
                }
            });
        }

        const iterators = types.map((ev) => `${ this.name }.${ ev }`);
        const iterator = pubsub.asyncIterator<MutationEventWithResult<T>>(iterators);

        const sub = new Subject<MutationEventWithResult<T>>();
        const obs: Observable<MutationEventWithResult<T>> & {
            close: () => Promise<IteratorResult<MutationEventWithResult<T>, any> | undefined>;
            closed?: boolean;
            subCache?: { [ id: number ]: T },
        } = sub.asObservable() as any;
        obs.subCache = subCache;
        let promResolve;
    
        /**
         * Cleanup `observe` function. Delete the subCache,
         * delete the subject, and return the iterator.
         * @returns 
         */
        const close = async () => {
            promResolve();
            sub.complete();
            delete obs.subCache;
            for (const key in subCache) {
                delete subCache[key];
            }
            obs.close = async () => undefined;
            obs.closed = true;
            if (iterator.return) {
                return iterator.return();
            }
        }
        obs.close = close;

        new Promise(async (resolve) => {
            promResolve = resolve;
            const iterable = {
                [Symbol.asyncIterator]() { return iterator; }
            };

            for await (const payload of iterable) {
                try {
                    const args = { filter: params.filter || {} };

                    if (!filterSubscriptionResult(payload, args?.filter)) {
                        continue;
                    }

                    if (payload.type === 'Deleted') {
                        if (!subCache) { continue; }

                        const cached = subCache[payload.id];
                        if (!cached) { continue; }

                        payload.result = cached;
                    }

                    if (params.disableResolve) {
                        sub.next(payload);
                    } else {
                        const mapped = await resolveResultFromPayload(payload);
                        if (mapped.result || params.keepUnresolved) {
                            sub.next(mapped);
                        }
                    }
                } catch(err) {

                    debug(err);
                    sub.error(err);
                }
            }
        }).catch((err) => {
            debug(err);
            sub.error(err);
            close();
        });

        return obs;
    }

    async count({
        where,
        fulltext,
    }: {
        where?: GraphQLWhereArg;
        fulltext?: any;
    } = {}): Promise<number> {
        const argWorthy = Boolean(where || fulltext);

        const argDefinitions = [
            `${argWorthy ? "(" : ""}`,
            `${where ? `$where: ${this.name}Where` : ""}`,
            `${fulltext ? `$fulltext: ${this.name}Fulltext` : ""}`,
            `${argWorthy ? ")" : ""}`,
        ];

        const argsApply = [
            `${argWorthy ? "(" : ""}`,
            `${where ? `where: $where` : ""}`,
            `${fulltext ? `fulltext: $fulltext` : ""}`,
            `${argWorthy ? ")" : ""}`,
        ];

        const query = `
            query ${argDefinitions.join(" ")}{
                ${this.camelCaseName}Count${argsApply.join(" ")}
            }
        `;

        const variableValues = { where };

        const result = await graphql(this.neoSchema.schema, query, null, {}, variableValues);

        if (result.errors?.length) {
            throw new Error(result.errors[0].message);
        }

        return (result.data as any)[`${this.camelCaseName}Count`] as number;
    }

    async create<T = any>({
        input,
        selectionSet,
        args = {},
        context = {},
        rootValue = null,
    }: {
        input?: any;
        selectionSet?: string | DocumentNode | SelectionSetNode;
        args?: any;
        context?: any;
        rootValue?: any;
    } = {}): Promise<T> {
        const mutationName = `create${upperFirst(this.namePluralized)}`;

        let selection = "";
        if (selectionSet) {
            selection = printSelectionSet(selectionSet);
        } else {
            selection = `
               {
                   ${this.camelCaseName}
                   ${printSelectionSet(selectionSet || this.selectionSet)}
               }
           `;
        }

        const mutation = `
            mutation ($input: [${this.name}CreateInput!]!){
               ${mutationName}(input: $input) ${selection}
            }
        `;

        const variableValues = { ...args, input };

        const result = await graphql(this.neoSchema.schema, mutation, rootValue, context, variableValues);

        if (result.errors?.length) {
            throw new Error(result.errors[0].message);
        }

        return (result.data as any)[mutationName] as T;
    }

    async update<T = any>({
        where,
        update,
        connect,
        disconnect,
        create,
        connectOrCreate,
        selectionSet,
        args = {},
        context = {},
        rootValue = null,
    }: {
        where?: GraphQLWhereArg;
        update?: any;
        connect?: any;
        disconnect?: any;
        connectOrCreate?: any;
        create?: any;
        selectionSet?: string | DocumentNode | SelectionSetNode;
        args?: any;
        context?: any;
        rootValue?: any;
    } = {}): Promise<T> {
        const mutationName = `update${upperFirst(this.namePluralized)}`;
        const argWorthy = Boolean(where || update || connect || disconnect || create || connectOrCreate);

        let selection = "";
        if (selectionSet) {
            selection = printSelectionSet(selectionSet);
        } else {
            selection = `
               {
                   ${this.camelCaseName}
                   ${printSelectionSet(selectionSet || this.selectionSet)}
               }
           `;
        }

        const argDefinitions = [
            `${argWorthy ? "(" : ""}`,
            `${where ? `$where: ${this.name}Where` : ""}`,
            `${update ? `$update: ${this.name}UpdateInput` : ""}`,
            `${connect ? `$connect: ${this.name}ConnectInput` : ""}`,
            `${disconnect ? `$disconnect: ${this.name}DisconnectInput` : ""}`,
            `${connectOrCreate ? `$connectOrCreate: ${this.name}ConnectOrCreateInput` : ""}`,
            `${create ? `$create: ${this.name}RelationInput` : ""}`,
            `${argWorthy ? ")" : ""}`,
        ];

        const argsApply = [
            `${argWorthy ? "(" : ""}`,
            `${where ? `where: $where` : ""}`,
            `${update ? `update: $update` : ""}`,
            `${connect ? `connect: $connect` : ""}`,
            `${disconnect ? `disconnect: $disconnect` : ""}`,
            `${connectOrCreate ? `connectOrCreate: $connectOrCreate` : ""}`,
            `${create ? `create: $create` : ""}`,
            `${argWorthy ? ")" : ""}`,
        ];

        const mutation = `
            mutation ${argDefinitions.join(" ")}{
               ${mutationName}${argsApply.join(" ")}
               ${selection}
            }
        `;

        const variableValues = { ...args, where, update, connect, disconnect, create, connectOrCreate };

        const result = await graphql(this.neoSchema.schema, mutation, rootValue, context, variableValues);

        if (result.errors?.length) {
            throw new Error(result.errors[0].message);
        }

        return (result.data as any)[mutationName] as T;
    }

    async delete({
        where,
        delete: deleteInput,
        context = {},
        rootValue = null,
    }: {
        where?: GraphQLWhereArg;
        delete?: any;
        context?: any;
        rootValue?: any;
    } = {}): Promise<DeleteInfo> {
        const mutationName = `delete${upperFirst(this.namePluralized)}`;
        const argWorthy = where || deleteInput;

        const argDefinitions = [
            `${argWorthy ? "(" : ""}`,
            `${where ? `$where: ${this.name}Where` : ""}`,
            `${deleteInput ? `$delete: ${this.name}DeleteInput` : ""}`,
            `${argWorthy ? ")" : ""}`,
        ];

        const argsApply = [
            `${argWorthy ? "(" : ""}`,
            `${where ? `where: $where` : ""}`,
            `${deleteInput ? `delete: $delete` : ""}`,
            `${argWorthy ? ")" : ""}`,
        ];

        const mutation = `
            mutation ${argDefinitions.join(" ")}{
               ${mutationName}${argsApply.join(" ")} {
                   nodesDeleted
                   relationshipsDeleted
               }
            }
        `;

        const variableValues = { where, delete: deleteInput };

        const result = await graphql(this.neoSchema.schema, mutation, rootValue, context, variableValues);

        if (result.errors?.length) {
            throw new Error(result.errors[0].message);
        }

        return (result.data as any)[mutationName] as DeleteInfo;
    }

    async aggregate<T = any>({
        where,
        fulltext,
        aggregate,
        context = {},
        rootValue = null,
    }: {
        where?: GraphQLWhereArg;
        fulltext?: any;
        aggregate: any;
        context?: any;
        rootValue?: any;
    }): Promise<T> {
        const queryName = `${pluralize(camelCase(this.name))}Aggregate`;
        const selections: string[] = [];
        const argWorthy = Boolean(where || fulltext);

        const argDefinitions = [
            `${argWorthy ? "(" : ""}`,
            `${where ? `$where: ${this.name}Where` : ""}`,
            `${fulltext ? `$fulltext: ${this.name}Fulltext` : ""}`,
            `${argWorthy ? ")" : ""}`,
        ];

        const argsApply = [
            `${argWorthy ? "(" : ""}`,
            `${where ? `where: $where` : ""}`,
            `${fulltext ? `fulltext: $fulltext` : ""}`,
            `${argWorthy ? ")" : ""}`,
        ];

        Object.entries(aggregate).forEach((entry) => {
            if (entry[0] === "count") {
                selections.push(entry[0]);

                return;
            }

            const thisSelections: string[] = [];
            Object.entries(entry[1] as any).forEach((e) => {
                if (Boolean(e[1]) === false) {
                    return;
                }

                thisSelections.push(e[0]);
            });

            if (thisSelections.length) {
                selections.push(`${entry[0]} {\n`);
                selections.push(thisSelections.join("\n"));
                selections.push(`}\n`);
            }
        });

        const query = `
            query ${argDefinitions.join(" ")}{
               ${queryName}${argsApply.join(" ")} {
                   ${selections.join("\n")}
               }
            }
        `;

        const variableValues = { where };

        const result = await graphql(this.neoSchema.schema, query, rootValue, context, variableValues);

        if (result.errors?.length) {
            throw new Error(result.errors[0].message);
        }

        return (result.data as any)[queryName] as T;
    }
}

export default Model;

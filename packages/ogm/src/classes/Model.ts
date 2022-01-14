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

import { DocumentNode, graphql, parse, print, SelectionSetNode } from "graphql";
import pluralize from "pluralize";
import { Neo4jGraphQL, upperFirst } from "@neo4j/graphql";
import { GraphQLOptionsArg, GraphQLWhereArg, DeleteInfo } from "../types";
import { lowerFirst } from "../utils/lower-first";

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
    private neoSchema: Neo4jGraphQL;
    protected selectionSet: string;

    constructor(input: ModelConstructor) {
        this.name = input.name;
        this.namePluralized = lowerFirst(pluralize(input.name));
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
                ${this.namePluralized}${argsApply.join(" ")} ${selection}
            }
        `;

        const variableValues = { where, options, ...args };

        const result = await graphql({
            schema: this.neoSchema.schema,
            source: query,
            rootValue,
            contextValue: context,
            variableValues,
        });

        if (result.errors?.length) {
            throw new Error(result.errors[0].message);
        }

        return (result.data as any)[this.namePluralized] as T;
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
                   ${this.namePluralized}
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

        const result = await graphql({
            schema: this.neoSchema.schema,
            source: mutation,
            rootValue,
            contextValue: context,
            variableValues,
        });

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
                   ${this.namePluralized}
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

        const result = await graphql({
            schema: this.neoSchema.schema,
            source: mutation,
            rootValue,
            contextValue: context,
            variableValues,
        });

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

        const result = await graphql({
            schema: this.neoSchema.schema,
            source: mutation,
            rootValue,
            contextValue: context,
            variableValues,
        });

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
        const queryName = `${this.namePluralized}Aggregate`;
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

        const result = await graphql({
            schema: this.neoSchema.schema,
            source: query,
            rootValue,
            contextValue: context,
            variableValues,
        });

        if (result.errors?.length) {
            throw new Error(result.errors[0].message);
        }

        return (result.data as any)[queryName] as T;
    }
}

export default Model;

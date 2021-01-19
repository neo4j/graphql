import { DocumentNode, graphql, GraphQLSchema, parse, print } from "graphql";
import pluralize from "pluralize";
import camelCase from "camelcase";
import { GraphQLOptionsArg, GraphQLWhereArg, DeleteInfo } from "../types";
import { upperFirstLetter } from "../utils";

export interface ModelConstructor {
    name: string;
    selectionSet: string;
    getGraphQLSchema: () => GraphQLSchema;
}

function printSelectionSet(selectionSet: string | DocumentNode): string {
    if (typeof selectionSet === "string") {
        return print(parse(selectionSet));
    }

    return print(selectionSet);
}

function removeNull(data: any) {
    return JSON.parse(JSON.stringify(data), (_key, value) => {
        if (value === null) {
            return undefined;
        }

        return value;
    });
}

class Model {
    public name: string;

    private namePluralized: string;

    private camelCaseName: string;

    private getGraphQLSchema: () => GraphQLSchema;

    protected selectionSet: string;

    constructor(input: ModelConstructor) {
        this.name = input.name;
        this.namePluralized = pluralize(input.name);
        this.camelCaseName = camelCase(this.namePluralized);
        this.getGraphQLSchema = input.getGraphQLSchema;
        this.selectionSet = input.selectionSet;
    }

    setSelectionSet(selectionSet: string | DocumentNode) {
        this.selectionSet = printSelectionSet(selectionSet);
    }

    async find<T = any[]>({
        where,
        options,
        selectionSet,
        args = {},
        context = {},
        rootValue = null,
    }: {
        where?: GraphQLWhereArg;
        options?: GraphQLOptionsArg;
        selectionSet?: string | DocumentNode;
        args?: any;
        context?: any;
        rootValue?: any;
    } = {}): Promise<T> {
        const argDefinitions = [
            `${where || options ? "(" : ""}`,
            `${where ? `$where: ${this.name}Where` : ""}`,
            `${options ? `$options: ${this.name}Options` : ""}`,
            `${where || options ? ")" : ""}`,
        ];

        const argsApply = [
            `${where || options ? "(" : ""}`,
            `${where ? `where: $where` : ""}`,
            `${options ? `options: $options` : ""}`,
            `${where || options ? ")" : ""}`,
        ];

        const selection = printSelectionSet(selectionSet || this.selectionSet);

        const query = `
            query ${argDefinitions.join(" ")}{
                ${this.camelCaseName}${argsApply.join(" ")} ${selection}
            }
        `;

        const schema = this.getGraphQLSchema();
        const variableValues = { where, options, ...args };

        const result = await graphql(schema, query, rootValue, context, variableValues);

        if (result.errors?.length) {
            throw new Error(result.errors[0].message);
        }

        return removeNull((result.data as any)[this.camelCaseName]) as T;
    }

    async create<T = any>({
        input,
        selectionSet,
        args = {},
        context = {},
        rootValue = null,
    }: {
        input?: any;
        selectionSet?: string | DocumentNode;
        args?: any;
        context?: any;
        rootValue?: any;
    } = {}): Promise<T> {
        const mutationName = `create${upperFirstLetter(this.namePluralized)}`;

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
            mutation ($input: [${this.name}CreateInput]!){
               ${mutationName}(input: $input) ${selection}
            }
        `;

        const schema = this.getGraphQLSchema();
        const variableValues = { ...args, input };

        const result = await graphql(schema, mutation, rootValue, context, variableValues);

        if (result.errors?.length) {
            throw new Error(result.errors[0].message);
        }

        return removeNull((result.data as any)[mutationName]) as T;
    }

    async update<T = any>({
        where,
        update,
        connect,
        disconnect,
        create,
        selectionSet,
        args = {},
        context = {},
        rootValue = null,
    }: {
        where?: GraphQLWhereArg;
        update?: any;
        connect?: any;
        disconnect?: any;
        create?: any;
        selectionSet?: string | DocumentNode;
        args?: any;
        context?: any;
        rootValue?: any;
    } = {}): Promise<T> {
        const mutationName = `update${upperFirstLetter(this.namePluralized)}`;

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

        const argWorthy = where || update || connect || disconnect || create;

        const argDefinitions = [
            `${argWorthy ? "(" : ""}`,
            `${where ? `$where: ${this.name}Where` : ""}`,
            `${update ? `$update: ${this.name}UpdateInput` : ""}`,
            `${connect ? `$connect: ${this.name}ConnectInput` : ""}`,
            `${disconnect ? `$disconnect: ${this.name}DisconnectInput` : ""}`,
            `${create ? `$create: ${this.name}RelationInput` : ""}`,
            `${argWorthy ? ")" : ""}`,
        ];

        const argsApply = [
            `${argWorthy ? "(" : ""}`,
            `${where ? `where: $where` : ""}`,
            `${update ? `update: $update` : ""}`,
            `${connect ? `connect: $connect` : ""}`,
            `${disconnect ? `disconnect: $disconnect` : ""}`,
            `${create ? `create: $create` : ""}`,
            `${argWorthy ? ")" : ""}`,
        ];

        const mutation = `
            mutation ${argDefinitions.join(" ")}{
               ${mutationName}${argsApply.join(" ")}
               ${selection}
            }
        `;

        const schema = this.getGraphQLSchema();
        const variableValues = { ...args, where, update, connect, disconnect, create };

        const result = await graphql(schema, mutation, rootValue, context, variableValues);

        if (result.errors?.length) {
            throw new Error(result.errors[0].message);
        }

        return removeNull((result.data as any)[mutationName]) as T;
    }

    async delete({
        where,
        context = {},
        rootValue = null,
    }: {
        where?: GraphQLWhereArg;
        context?: any;
        rootValue?: any;
    } = {}): Promise<DeleteInfo> {
        const mutationName = `delete${upperFirstLetter(this.namePluralized)}`;

        const argDefinitions = [
            `${where ? "(" : ""}`,
            `${where ? `$where: ${this.name}Where` : ""}`,
            `${where ? ")" : ""}`,
        ];

        const argsApply = [`${where ? "(" : ""}`, `${where ? `where: $where` : ""}`, `${where ? ")" : ""}`];

        const mutation = `
            mutation ${argDefinitions.join(" ")}{
               ${mutationName}${argsApply.join(" ")} {
                   nodesDeleted
                   relationshipsDeleted
               }
            }
        `;

        const schema = this.getGraphQLSchema();
        const variableValues = { where };

        const result = await graphql(schema, mutation, rootValue, context, variableValues);

        if (result.errors?.length) {
            throw new Error(result.errors[0].message);
        }

        return (result.data as any)[mutationName] as DeleteInfo;
    }
}

export default Model;

import { DocumentNode, graphql, GraphQLSchema, parse, print } from "graphql";
import pluralize from "pluralize";
import { GraphQLOptionsArg } from "../types";

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

class Model<T = any> {
    public name: string;

    private namePluralized: string;

    private getGraphQLSchema: () => GraphQLSchema;

    protected selectionSet: string;

    constructor(input: ModelConstructor) {
        this.name = input.name;
        this.namePluralized = pluralize(input.name);
        this.getGraphQLSchema = input.getGraphQLSchema;
        this.selectionSet = input.selectionSet;
    }

    setSelectionSet(selectionSet: string | DocumentNode) {
        this.selectionSet = printSelectionSet(selectionSet);
    }

    async find({
        where,
        options,
        selectionSet,
        args = {},
        context = {},
        rootValue = null,
    }: {
        where?: any;
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

        const query = `
            query ${argDefinitions.join(" ")}{
                ${this.namePluralized}${argsApply.join(" ")} ${printSelectionSet(selectionSet || this.selectionSet)}
            }
        `;

        const schema = this.getGraphQLSchema();
        const variableValues = { where, options, ...args };

        const result = await graphql(schema, query, rootValue, context, variableValues);

        if (result.errors?.length) {
            throw new Error(result.errors[0].message);
        }

        return removeNull((result.data as any)[this.namePluralized]) as T;
    }

    async create({
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
        let upperFirst: string | string[] = this.namePluralized.split("");
        upperFirst[0] = upperFirst[0].toLocaleUpperCase();
        upperFirst = upperFirst.join("");

        const mutationName = `create${upperFirst}`;

        const mutation = `
            mutation ($input: [${this.name}CreateInput]!){
               ${mutationName}(input: $input) ${printSelectionSet(selectionSet || this.selectionSet)}
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

    async update({
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
        where?: any;
        update?: any;
        connect?: any;
        disconnect?: any;
        create?: any;
        selectionSet?: string | DocumentNode;
        args?: any;
        context?: any;
        rootValue?: any;
    } = {}): Promise<T> {
        let upperFirst: string | string[] = this.namePluralized.split("");
        upperFirst[0] = upperFirst[0].toLocaleUpperCase();
        upperFirst = upperFirst.join("");

        const mutationName = `update${upperFirst}`;

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
               ${mutationName}${argsApply.join(" ")} ${printSelectionSet(selectionSet || this.selectionSet)}
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
}

export default Model;

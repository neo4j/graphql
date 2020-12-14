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

class Model<T = any> {
    public name: string;

    public namePluralized: string;

    private getGraphQLSchema: () => GraphQLSchema;

    private selectionSet: string;

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
    }: { where?: any; options?: GraphQLOptionsArg; selectionSet?: string | DocumentNode; args?: any } = {}) {
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
        const rootValue = null;
        const contextValue = {};
        const variableValues = { where, options, ...args };

        const result = await graphql(schema, query, rootValue, contextValue, variableValues);

        if (result.errors?.length) {
            throw new Error(result.errors[0].message);
        }

        return JSON.parse(JSON.stringify((result.data as any)[this.namePluralized] as T[]), (_key, value) => {
            if (value === null) {
                return undefined;
            }

            return value;
        });
    }
}

export default Model;

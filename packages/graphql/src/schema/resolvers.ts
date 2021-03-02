import camelCase from "camelcase";
import { GraphQLResolveInfo } from "graphql";
import pluralize from "pluralize";
import { isInt, Driver } from "neo4j-driver";
import { execute } from "../utils";
import { translate } from "../translate";
import { Neo4jGraphQL, Node, Context } from "../classes";
import { BaseField } from "../types";
import { graphqlArgsToCompose } from "./to-compose";
import createAuthAndParams from "../translate/create-auth-and-params";
import createAuthParam from "../translate/create-auth-param";
import { AUTH_FORBIDDEN_ERROR } from "../constants";

export function updateResolver({ node, neoSchema }: { node: Node; neoSchema: Neo4jGraphQL }) {
    async function resolve(_root: any, _args: any, context: any, resolveInfo: GraphQLResolveInfo) {
        context.neoSchema = neoSchema;
        if (neoSchema.input.context) {
            context = { ...context, ...neoSchema.input.context };
        }

        const { driver } = context;
        if (!driver) {
            throw new Error("context.driver missing");
        }

        const [cypher, params] = translate({ context, resolveInfo });

        const result = await execute({
            cypher,
            params,
            driver,
            defaultAccessMode: "WRITE",
            neoSchema,
            graphQLContext: context,
        });

        return { [pluralize(camelCase(node.name))]: result.map((x) => x.this) };
    }

    return {
        type: `Update${pluralize(node.name)}MutationResponse!`,
        resolve,
        args: {
            where: `${node.name}Where`,
            update: `${node.name}UpdateInput`,
            ...(node.relationFields.length
                ? {
                      connect: `${node.name}ConnectInput`,
                      disconnect: `${node.name}DisconnectInput`,
                      create: `${node.name}RelationInput`,
                      delete: `${node.name}DeleteInput`,
                  }
                : {}),
        },
    };
}

export function deleteResolver({ node, neoSchema }: { node: Node; neoSchema: Neo4jGraphQL }) {
    async function resolve(_root: any, _args: any, context: any, resolveInfo: GraphQLResolveInfo) {
        context.neoSchema = neoSchema;
        if (neoSchema.input.context) {
            context = { ...context, ...neoSchema.input.context };
        }

        const { driver } = context;
        if (!driver) {
            throw new Error("context.driver missing");
        }

        const [cypher, params] = translate({ context, resolveInfo });

        const result = await execute({
            cypher,
            params,
            driver,
            defaultAccessMode: "WRITE",
            neoSchema,
            statistics: true,
            graphQLContext: context,
        });

        return result;
    }

    return {
        type: `DeleteInfo!`,
        resolve,
        args: {
            where: `${node.name}Where`,
            ...(node.relationFields.length
                ? {
                      delete: `${node.name}DeleteInput`,
                  }
                : {}),
        },
    };
}

export function createResolver({ node, neoSchema }: { node: Node; neoSchema: Neo4jGraphQL }) {
    async function resolve(_root: any, _args: any, context: any, resolveInfo: GraphQLResolveInfo) {
        context.neoSchema = neoSchema;
        if (neoSchema.input.context) {
            context = { ...context, ...neoSchema.input.context };
        }

        const { driver } = context;
        if (!driver) {
            throw new Error("context.driver missing");
        }

        const [cypher, params] = translate({ context, resolveInfo });

        const result = await execute({
            cypher,
            params,
            driver,
            defaultAccessMode: "WRITE",
            neoSchema,
            graphQLContext: context,
        });

        return {
            [pluralize(camelCase(node.name))]: Object.values(result[0] || {}),
        };
    }

    return {
        type: `Create${pluralize(node.name)}MutationResponse!`,
        resolve,
        args: { input: `[${node.name}CreateInput]!` },
    };
}

export function findResolver({ node, neoSchema }: { node: Node; neoSchema: Neo4jGraphQL }) {
    async function resolve(_root: any, _args: any, context: any, resolveInfo: GraphQLResolveInfo) {
        context.neoSchema = neoSchema;
        if (neoSchema.input.context) {
            context = { ...context, ...neoSchema.input.context };
        }

        const { driver } = context;
        if (!driver) {
            throw new Error("context.driver missing");
        }

        const [cypher, params] = translate({ context, resolveInfo });

        const result = await execute({
            cypher,
            params,
            driver,
            defaultAccessMode: "READ",
            neoSchema,
            graphQLContext: context,
        });

        return result.map((x) => x.this);
    }

    return {
        type: `[${node.name}]!`,
        resolve,
        args: { where: `${node.name}Where`, options: `${node.name}Options` },
    };
}

/**
 * Called on custom (Queries & Mutations "TOP LEVEL") with a @cypher directive. Not to mistaken for @cypher type fields.
 */
export function cypherResolver({
    field,
    statement,
    neoSchema,
}: {
    field: BaseField;
    statement: string;
    neoSchema: Neo4jGraphQL;
}) {
    async function resolve(_root: any, args: any, graphQLContext: any) {
        const { driver } = graphQLContext;
        if (!driver) {
            throw new Error("context.driver missing");
        }

        const context = new Context({
            graphQLContext,
            neoSchema,
            driver: driver as Driver,
        });

        const cypherStrs: string[] = [];
        let params = { ...args, auth: createAuthParam({ context }) };

        const preAuth = createAuthAndParams({ entity: field, context });
        if (preAuth[0]) {
            params = { ...params, ...preAuth[1] };
            cypherStrs.push(`CALL apoc.util.validate(NOT(${preAuth[0]}), "${AUTH_FORBIDDEN_ERROR}", [0])`);
        }

        cypherStrs.push(statement);

        const result = await execute({
            cypher: cypherStrs.join("\n"),
            params,
            driver,
            defaultAccessMode: "WRITE",
            neoSchema,
            raw: true,
            graphQLContext: context,
        });

        const values = result.records.map((record) => {
            // eslint-disable-next-line no-underscore-dangle
            const value = record._fields[0];

            if (["number", "string", "boolean"].includes(typeof value)) {
                return value;
            }

            if (!value) {
                return undefined;
            }

            if (isInt(value)) {
                return Number(value);
            }

            if (value.identity && value.labels && value.properties) {
                return value.properties;
            }

            return value;
        });

        if (!field.typeMeta.array) {
            return values[0];
        }

        return values;
    }

    return {
        type: field.typeMeta.pretty,
        resolve,
        args: graphqlArgsToCompose(field.arguments),
    };
}

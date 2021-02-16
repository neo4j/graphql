import { isInt, Driver } from "neo4j-driver";
import { execute } from "../utils";
import { BaseField } from "../types";
import { NeoSchema, Context } from "../classes";
import graphqlArgsToCompose from "./graphql-arg-to-compose";
import createAuthAndParams from "../translate/create-auth-and-params";
import createAuthParam from "../translate/create-auth-param";
import { AUTH_FORBIDDEN_ERROR } from "../constants";

/**
 * Called on custom (Queries & Mutations "TOP LEVEL") with a @cypher directive. Not to mistaken for @cypher type fields.
 */
function cypherResolver({
    field,
    statement,
    getSchema,
}: {
    field: BaseField;
    statement: string;
    getSchema: () => NeoSchema;
}) {
    async function resolve(_root: any, args: any, graphQLContext: any) {
        const neoSchema = getSchema();

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
        });

        const values = result.records.map((record) => {
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

export default cypherResolver;

import { isInt } from "neo4j-driver";
import { execute } from "../../utils";
import { Context } from "../../classes";
import { BaseField } from "../../types";
import { graphqlArgsToCompose } from "../to-compose";
import createAuthAndParams from "../../translate/create-auth-and-params";
import createAuthParam from "../../translate/create-auth-param";
import { AUTH_FORBIDDEN_ERROR } from "../../constants";

export default function cypherResolver({ field, statement }: { field: BaseField; statement: string }) {
    async function resolve(_root: any, args: any, graphQLContext: any) {
        const context = new Context({
            graphQLContext,
            neoSchema: graphQLContext.neoSchema,
            driver: graphQLContext.driver,
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
            driver: graphQLContext.driver,
            defaultAccessMode: "WRITE",
            neoSchema: context.neoSchema,
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

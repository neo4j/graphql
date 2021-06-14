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

import { isInt } from "neo4j-driver";
import { execute } from "../../utils";
import { BaseField, Context } from "../../types";
import { graphqlArgsToCompose } from "../to-compose";
import createAuthAndParams from "../../translate/create-auth-and-params";
import createAuthParam from "../../translate/create-auth-param";
import { AUTH_FORBIDDEN_ERROR } from "../../constants";
import createProjectionAndParams from "../../translate/create-projection-and-params";

export default function cypherResolver({
    field,
    statement,
    type,
}: {
    field: BaseField;
    statement: string;
    type: "Query" | "Mutation";
}) {
    async function resolve(_root: any, args: any, _context: unknown) {
        const context = _context as Context;
        const {
            resolveTree: { fieldsByTypeName },
        } = context;
        const cypherStrs: string[] = [];
        let params = { ...args, auth: createAuthParam({ context }) };
        let projectionStr = "";
        let projectionAuthStr = "";
        const isPrimitive = ["ID", "String", "Boolean", "Float", "Int", "DateTime", "BigInt"].includes(
            field.typeMeta.name
        );

        const preAuth = createAuthAndParams({ entity: field, context });
        if (preAuth[0]) {
            params = { ...params, ...preAuth[1] };
            cypherStrs.push(`CALL apoc.util.validate(NOT(${preAuth[0]}), "${AUTH_FORBIDDEN_ERROR}", [0])`);
        }

        const referenceNode = context.neoSchema.nodes.find((x) => x.name === field.typeMeta.name);
        if (referenceNode) {
            const recurse = createProjectionAndParams({
                fieldsByTypeName,
                node: referenceNode,
                context,
                varName: `this`,
            });
            [projectionStr] = recurse;
            params = { ...params, ...recurse[1] };
            if (recurse[2]?.authValidateStrs?.length) {
                projectionAuthStr = recurse[2].authValidateStrs.join(" AND ");
            }
        }

        const expectMultipleValues = referenceNode && field.typeMeta.array ? "true" : "false";
        const apocParams = Object.entries(args).reduce(
            (r: { strs: string[]; params: any }, entry) => {
                return {
                    strs: [...r.strs, `${entry[0]}: $${entry[0]}`],
                    params: { ...r.params, [entry[0]]: entry[1] },
                };
            },
            { strs: ["auth: $auth"], params }
        ) as { strs: string[]; params: any };
        const apocParamsStr = `{${apocParams.strs.length ? `${apocParams.strs.join(", ")}` : ""}}`;

        if (type === "Query") {
            cypherStrs.push(`
                WITH apoc.cypher.runFirstColumn("${statement}", ${apocParamsStr}, ${expectMultipleValues}) as x
                UNWIND x as this
            `);
        } else {
            cypherStrs.push(`
                CALL apoc.cypher.doIt("${statement}", ${apocParamsStr}) YIELD value
                WITH apoc.map.values(value, [keys(value)[0]])[0] AS this
            `);
        }

        if (projectionAuthStr) {
            cypherStrs.push(
                `WHERE apoc.util.validatePredicate(NOT(${projectionAuthStr}), "${AUTH_FORBIDDEN_ERROR}", [0])`
            );
        }

        if (!isPrimitive) {
            cypherStrs.push(`RETURN this ${projectionStr} AS this`);
        } else {
            cypherStrs.push(`RETURN this`);
        }

        const result = await execute({
            cypher: cypherStrs.join("\n"),
            params,
            defaultAccessMode: "WRITE",
            raw: true,
            context,
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

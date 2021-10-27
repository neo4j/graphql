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

import { execute } from "../../utils";
import { BaseField, ConnectionField, Context } from "../../types";
import { graphqlArgsToCompose } from "../to-compose";
import createAuthAndParams from "../../translate/create-auth-and-params";
import createAuthParam from "../../translate/create-auth-param";
import { AUTH_FORBIDDEN_ERROR } from "../../constants";
import createProjectionAndParams from "../../translate/create-projection-and-params";
import createConnectionAndParams from "../../translate/connection/create-connection-and-params";
import { isNeoInt } from "../../utils/utils";

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
        const { resolveTree } = context;
        const cypherStrs: string[] = [];
        let params = { ...args, auth: createAuthParam({ context }), cypherParams: context.cypherParams };
        let projectionStr = "";
        const connectionProjectionStrs: string[] = [];
        let projectionAuthStr = "";
        const isPrimitive = ["ID", "String", "Boolean", "Float", "Int", "DateTime", "BigInt"].includes(
            field.typeMeta.name
        );
        const isEnum = context.neoSchema.document.definitions.find(
            (x) => x.kind === "EnumTypeDefinition" && x.name.value === field.typeMeta.name
        );
        const isScalar = context.neoSchema.document.definitions.find(
            (x) => x.kind === "ScalarTypeDefinition" && x.name.value === field.typeMeta.name
        );

        const preAuth = createAuthAndParams({ entity: field, context });
        if (preAuth[0]) {
            params = { ...params, ...preAuth[1] };
            cypherStrs.push(`CALL apoc.util.validate(NOT(${preAuth[0]}), "${AUTH_FORBIDDEN_ERROR}", [0])`);
        }

        const referenceNode = context.neoSchema.nodes.find((x) => x.name === field.typeMeta.name);
        if (referenceNode) {
            const recurse = createProjectionAndParams({
                fieldsByTypeName: resolveTree.fieldsByTypeName,
                node: referenceNode,
                context,
                varName: `this`,
            });
            const [str, p, meta] = recurse;
            projectionStr = str;
            params = { ...params, ...p };

            if (meta?.authValidateStrs?.length) {
                projectionAuthStr = meta.authValidateStrs.join(" AND ");
            }

            if (meta?.connectionFields?.length) {
                meta.connectionFields.forEach((connectionResolveTree) => {
                    const connectionField = referenceNode.connectionFields.find(
                        (x) => x.fieldName === connectionResolveTree.name
                    ) as ConnectionField;

                    const nestedConnection = createConnectionAndParams({
                        resolveTree: connectionResolveTree,
                        field: connectionField,
                        context,
                        nodeVariable: "this",
                    });
                    const [nestedStr, nestedP] = nestedConnection;
                    connectionProjectionStrs.push(nestedStr);
                    params = { ...params, ...nestedP };
                });
            }
        }

        const initApocParamsStrs = ["auth: $auth", ...(context.cypherParams ? ["cypherParams: $cypherParams"] : [])];
        const apocParams = Object.entries(resolveTree.args).reduce(
            (r: { strs: string[]; params: any }, entry) => {
                return {
                    strs: [...r.strs, `${entry[0]}: $${entry[0]}`],
                    params: { ...r.params, [entry[0]]: entry[1] },
                };
            },
            { strs: initApocParamsStrs, params }
        ) as { strs: string[]; params: any };

        params = { ...params, ...apocParams.params };

        const apocParamsStr = `{${apocParams.strs.length ? `${apocParams.strs.join(", ")}` : ""}}`;

        const expectMultipleValues = !isPrimitive && !isScalar && !isEnum && field.typeMeta.array ? "true" : "false";
        if (type === "Query") {
            cypherStrs.push(`
                WITH apoc.cypher.runFirstColumn("${statement}", ${apocParamsStr}, ${expectMultipleValues}) as x
                UNWIND x as this
                WITH this
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

        cypherStrs.push(connectionProjectionStrs.join("\n"));

        if (isPrimitive || isEnum || isScalar) {
            cypherStrs.push(`RETURN this`);
        } else {
            cypherStrs.push(`RETURN this ${projectionStr} AS this`);
        }

        const executeResult = await execute({
            cypher: cypherStrs.join("\n"),
            params,
            defaultAccessMode: "WRITE",
            context,
        });

        const values = executeResult.result.records.map((record) => {
            const value = record.get(0);

            if (["number", "string", "boolean"].includes(typeof value)) {
                return value;
            }

            if (!value) {
                return undefined;
            }

            if (isNeoInt(value)) {
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

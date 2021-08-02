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
import { UnionTypeDefinitionNode } from "graphql/language/ast";
import { ResolveTree } from "graphql-parse-resolve-info";
import { execute } from "../../utils";
import { BaseField, ConnectionField, Context } from "../../types";
import { graphqlArgsToCompose } from "../to-compose";
import createAuthAndParams from "../../translate/create-auth-and-params";
import createAuthParam from "../../translate/create-auth-param";
import { AUTH_FORBIDDEN_ERROR } from "../../constants";
import createProjectionAndParams from "../../translate/create-projection-and-params";
import createConnectionAndParams from "../../translate/connection/create-connection-and-params";
import { Node } from "../../classes";

export default function cypherResolver({
    field,
    statement,
    type,
}: {
    field: BaseField;
    statement: string;
    type: "Query" | "Mutation";
}) {
    // Separate previos logic to reuse in simple and union node
    function getNodeProjection(referenceNode: Node, resolveTree: ResolveTree, context: Context, resolveType: boolean) {
        let projectionAuthStr = "";
        let connectionProjectionStr = "";
        let params: any;
        const recurse = createProjectionAndParams({
            fieldsByTypeName: resolveTree.fieldsByTypeName,
            node: referenceNode,
            resolveType,
            context,
            varName: `this`,
        });
        const [str, p, meta] = recurse;
        const projectionStr = str;
        params = p;

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
                const [strc, pc] = nestedConnection;
                connectionProjectionStr = strc;
                params = { ...params, ...pc };
            });
        }
        return { projectionStr, params, connectionProjectionStr, projectionAuthStr };
    }
    // Separate previos logic to reuse in simple and union node
    function addSecurityAndConnection(
        context: Context,
        args: any,
        params: any,
        projectionAuthStr: string,
        connectionProjectionStr: string
    ) {
        const cypherStrs: string[] = [];
        const initApocParamsStrs = ["auth: $auth", ...(context.cypherParams ? ["cypherParams: $cypherParams"] : [])];
        const apocParams = Object.entries(args).reduce(
            (r: { strs: string[]; params: any }, entry) => {
                return {
                    strs: [...r.strs, `${entry[0]}: $${entry[0]}`],
                    params: { ...r.params, [entry[0]]: entry[1] },
                };
            },
            { strs: initApocParamsStrs, params }
        ) as { strs: string[]; params: any };
        const apocParamsStr = `{${apocParams.strs.length ? `${apocParams.strs.join(", ")}` : ""}}`;

        const expectMultipleValues = field.typeMeta.array ? "true" : "false";
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

        if (connectionProjectionStr) {
            cypherStrs.push(connectionProjectionStr);
        }
        return cypherStrs;
    }
    async function resolve(_root: any, args: any, _context: unknown) {
        const context = _context as Context;
        const { resolveTree } = context;
        const cypherStrs: string[] = [];
        let params = { ...args, auth: createAuthParam({ context }), cypherParams: context.cypherParams };
        let projectionStr = "";
        let connectionProjectionStr = "";
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
        const unions = context.neoSchema.document.definitions.filter(
            (x) => x.kind === "UnionTypeDefinition"
        ) as UnionTypeDefinitionNode[];
        const referenceUnion = unions.find((u) => u.name.value === field.typeMeta.name);
        const subresolves: {
            projectionStr: string;
            params: any;
            connectionProjectionStr: string;
            projectionAuthStr: string;
            nodeName: string;
            cypherStrs: string[];
        }[] = [];
        if (referenceNode) {
            const {
                projectionStr: ps,
                params: p,
                connectionProjectionStr: cps,
                projectionAuthStr: pas,
            } = getNodeProjection(referenceNode, resolveTree, context, false);
            projectionAuthStr = pas;
            params = { ...p, ...params };
            connectionProjectionStr = cps;
            projectionStr = ps;
        }
        if (referenceUnion) {
            const referencedNodes = referenceUnion?.types?.map((u) =>
                context.neoSchema.nodes.find((n) => n.name === u.name.value)
            );
            if (referencedNodes) {
                referencedNodes
                    .filter((b) => b !== undefined)
                    .filter((n) => Object.keys(resolveTree.fieldsByTypeName).includes(n?.name ?? ""))
                    .forEach((node) => {
                        // Build cypher for every node in union type
                        if (node) {
                            const clonests = JSON.parse(JSON.stringify(cypherStrs)); // clone original sentence array to each child node union type
                            const unionNodeProjection = getNodeProjection(
                                node,
                                {
                                    fieldsByTypeName: { [node.name]: resolveTree.fieldsByTypeName[node.name] },
                                } as ResolveTree,
                                context,
                                true
                            );
                            addSecurityAndConnection(
                                context,
                                args,
                                (params = { ...unionNodeProjection.params, ...params }),
                                unionNodeProjection.projectionAuthStr,
                                unionNodeProjection.connectionProjectionStr
                            ).forEach((a) => clonests.push(a));

                            subresolves.push({
                                ...unionNodeProjection,
                                nodeName: node.name,
                                cypherStrs: clonests,
                            });
                        }
                    });
            }
        } else {
            addSecurityAndConnection(context, args, params, projectionAuthStr, connectionProjectionStr).forEach((a) =>
                cypherStrs.push(a)
            );
        }
        if (referenceUnion) {
            cypherStrs.splice(0, cypherStrs.length);
            cypherStrs.push("call {\n");
            const subquerys = subresolves.map(
                (sub) => `${sub.cypherStrs.join("\n")}
            match(thisnode:${sub.nodeName})

            where thisnode=this or apoc.map.merge(properties(thisnode), { __resolveType: '${
                sub.nodeName
            }' })=properties(this)
            return thisnode ${sub.projectionStr} as this`
            );
            cypherStrs.push(subquerys.join("\nunion\n"));
            cypherStrs.push("}");
            cypherStrs.push(`with this AS this
            RETURN this`);
        } else if (!isPrimitive) {
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

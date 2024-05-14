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

import Cypher from "@neo4j/cypher-builder";
import type { Node, Relationship } from "../classes";
import type { CallbackBucket } from "../classes/CallbackBucket";
import type { EntityAdapter } from "../schema-model/entity/EntityAdapter";
import { InterfaceEntity } from "../schema-model/entity/InterfaceEntity";
import type { ConcreteEntityAdapter } from "../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { InterfaceEntityAdapter } from "../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import type { RelationField } from "../types";
import type { Neo4jGraphQLTranslationContext } from "../types/neo4j-graphql-translation-context";
import { caseWhere } from "../utils/case-where";
import { compileCypherIfExists } from "../utils/compile-cypher";
import { getEntityAdapterFromNode } from "../utils/get-entity-adapter-from-node";
import { asArray } from "../utils/utils";
import { checkAuthentication } from "./authorization/check-authentication";
import { createAuthorizationAfterAndParams } from "./authorization/compatibility/create-authorization-after-and-params";
import { createAuthorizationBeforeAndParams } from "./authorization/compatibility/create-authorization-before-and-params";
import { createRelationshipValidationString } from "./create-relationship-validation-string";
import createSetRelationshipPropertiesAndParams from "./create-set-relationship-properties-and-params";
import { createConnectionEventMetaObject } from "./subscriptions/create-connection-event-meta";
import { filterMetaVariable } from "./subscriptions/filter-meta-variable";
import { createWhereNodePredicate } from "./where/create-where-predicate";

interface Res {
    connects: string[];
    params: any;
}

type Filters = {
    preComputedSubqueries?: string;
    predicate: [string, Record<string, any>];
};

function createConnectAndParams({
    withVars,
    value,
    varName,
    relationField,
    parentVar,
    refNodes,
    context,
    callbackBucket,
    labelOverride,
    parentNode,
    includeRelationshipValidation,
    isFirstLevel = true,
    source,
    indexPrefix,
}: {
    withVars: string[];
    value: any;
    varName: string;
    relationField: RelationField;
    parentVar: string;
    context: Neo4jGraphQLTranslationContext;
    callbackBucket: CallbackBucket;
    refNodes: Node[];
    labelOverride?: string;
    parentNode: Node;
    includeRelationshipValidation?: boolean;
    isFirstLevel?: boolean;
    source: "CREATE" | "UPDATE" | "CONNECT";
    indexPrefix?: string;
}): [string, any] {
    checkAuthentication({ context, node: parentNode, targetOperations: ["CREATE_RELATIONSHIP"] });

    function createSubqueryContents(
        relatedNode: Node,
        connect: any,
        index: number,
        filters?: Filters
    ): { subquery: string; params: Record<string, any> } {
        checkAuthentication({ context, node: relatedNode, targetOperations: ["CREATE_RELATIONSHIP"] });

        let params = {};
        const nodeName = getConnectNodeName(varName, index);
        const relationshipName = getConnectEdgeName(varName, index);
        const inStr = relationField.direction === "IN" ? "<-" : "-";
        const outStr = relationField.direction === "OUT" ? "->" : "-";
        const relTypeStr = `[${relationField.properties || context.subscriptionsEnabled ? relationshipName : ""}:${
            relationField.type
        }]`;
        const isOverwriteNotAllowed = connect.overwrite === false;

        const subquery: string[] = [];
        const labels = relatedNode.getLabelString(context);
        const label = labelOverride ? `:${labelOverride}` : labels;

        subquery.push(`\tWITH ${filterMetaVariable(withVars).join(", ")}`);
        if (context.subscriptionsEnabled) {
            const innerMetaStr = `, [] as meta`;
            subquery.push(`\tWITH ${filterMetaVariable(withVars).join(", ")}${innerMetaStr}`);
        }
        subquery.push(`\tOPTIONAL MATCH (${nodeName}${label})`);

        const whereStrs: string[] = [];
        if (filters) {
            whereStrs.push(filters.predicate[0]);
            params = { ...filters.predicate[1] };
            if (filters.preComputedSubqueries) {
                subquery.push(filters.preComputedSubqueries);
            }
        }

        const authorizationNodes = [{ node: relatedNode, variable: nodeName }];
        // If the source is a create operation, it is likely that authorization
        // rules are not satisfied until connect operation is complete
        if (source !== "CREATE") {
            authorizationNodes.push({ node: parentNode, variable: parentVar });
        }

        const authorizationBeforeAndParams = createAuthorizationBeforeAndParams({
            context,
            nodes: authorizationNodes,
            operations: ["CREATE_RELATIONSHIP"],
            indexPrefix,
        });

        if (authorizationBeforeAndParams) {
            const { cypher, params: authWhereParams, subqueries } = authorizationBeforeAndParams;

            whereStrs.push(cypher);
            params = { ...params, ...authWhereParams };

            if (subqueries) {
                subquery.push(subqueries);

                if (whereStrs.length) {
                    subquery.push("WITH *");
                }
            }
        }

        if (whereStrs.length) {
            const predicate = `${whereStrs.join(" AND ")}`;
            if (filters?.preComputedSubqueries?.length) {
                const columns = [new Cypher.NamedVariable(nodeName)];
                const caseWhereClause = caseWhere(new Cypher.Raw(predicate), columns);
                const { cypher } = caseWhereClause.build("aggregateWhereFilter");
                subquery.push(cypher);
            } else {
                subquery.push(`\tWHERE ${predicate}`);
            }
        }

        /*
           TODO
           Replace with subclauses https://neo4j.com/developer/kb/conditional-cypher-execution/
           https://neo4j.slack.com/archives/C02PUHA7C/p1603458561099100
        */
        subquery.push("\tCALL {");
        subquery.push("\t\tWITH *");
        const withVarsInner = [
            ...withVars.filter((v) => v !== parentVar),
            `collect(${nodeName}) as connectedNodes`,
            `collect(${parentVar}) as parentNodes`,
        ];
        if (context.subscriptionsEnabled) {
            withVarsInner.push(`[] as meta`);
        }
        subquery.push(`\t\tWITH ${filterMetaVariable(withVarsInner).join(", ")}`);

        subquery.push("\t\tCALL {"); //
        subquery.push("\t\t\tWITH connectedNodes, parentNodes"); //
        subquery.push(`\t\t\tUNWIND parentNodes as ${parentVar}`);
        subquery.push(`\t\t\tUNWIND connectedNodes as ${nodeName}`);
        const connectOperator = isOverwriteNotAllowed ? "CREATE" : "MERGE";
        subquery.push(`\t\t\t${connectOperator} (${parentVar})${inStr}${relTypeStr}${outStr}(${nodeName})`);

        if (relationField.properties) {
            const relationship = context.relationships.find(
                (x) => x.properties === relationField.properties
            ) as unknown as Relationship;
            const setA = createSetRelationshipPropertiesAndParams({
                properties: connect.edge ?? {},
                varName: relationshipName,
                relationship,
                operation: "CREATE",
                callbackBucket,
            });
            subquery.push(`\t\t\t${setA[0]}`);
            params = { ...params, ...setA[1] };
        }

        if (context.subscriptionsEnabled) {
            const [fromVariable, toVariable] =
                relationField.direction === "IN" ? [nodeName, parentVar] : [parentVar, nodeName];
            const [fromTypename, toTypename] =
                relationField.direction === "IN"
                    ? [relatedNode.name, parentNode.name]
                    : [parentNode.name, relatedNode.name];

            const eventWithMetaStr = createConnectionEventMetaObject({
                event: "create_relationship",
                relVariable: relationshipName,
                fromVariable,
                toVariable,
                typename: relationField.typeUnescaped,
                fromTypename,
                toTypename,
            });
            subquery.push(`\t\t\tWITH ${eventWithMetaStr} as meta`);
            subquery.push(`\t\t\tRETURN collect(meta) as update_meta`);
        }

        subquery.push("\t\t}");

        if (context.subscriptionsEnabled) {
            subquery.push(`\t\tWITH meta + update_meta as meta`);
            subquery.push(`\t\tRETURN meta AS connect_meta`);
        }
        subquery.push("\t}");

        let innerMetaStr = "";
        if (context.subscriptionsEnabled) {
            innerMetaStr = `, connect_meta + meta AS meta`;
        }

        if (includeRelationshipValidation || isOverwriteNotAllowed) {
            const relValidationStrs: string[] = [];
            const matrixItems = [
                [parentNode, parentVar],
                [relatedNode, nodeName],
            ] as [Node, string][];

            matrixItems.forEach((mi) => {
                const relValidationStr = createRelationshipValidationString({
                    node: mi[0],
                    context,
                    varName: mi[1],
                    ...(isOverwriteNotAllowed && { relationshipFieldNotOverwritable: relationField.fieldName }),
                });
                if (relValidationStr) {
                    relValidationStrs.push(relValidationStr);
                }
            });

            if (relValidationStrs.length) {
                subquery.push(`\tWITH ${[...filterMetaVariable(withVars), nodeName].join(", ")}${innerMetaStr}`);
                subquery.push(relValidationStrs.join("\n"));

                if (context.subscriptionsEnabled) {
                    innerMetaStr = ", meta";
                }
            }
        }

        subquery.push(`WITH ${[...filterMetaVariable(withVars), nodeName].join(", ")}${innerMetaStr}`);

        if (connect.connect) {
            const connects = (Array.isArray(connect.connect) ? connect.connect : [connect.connect]) as any[];

            connects.forEach((c) => {
                const reduced = Object.entries(c).reduce(
                    (r: Res, [k, v]: [string, any]) => {
                        const relField = relatedNode.relationFields.find((x) => k === x.fieldName) as RelationField;
                        const newRefNodes: Node[] = [];

                        if (relField.union) {
                            Object.keys(v).forEach((modelName) => {
                                newRefNodes.push(context.nodes.find((x) => x.name === modelName) as Node);
                            });
                        } else if (relField.interface) {
                            (relField.interface.implementations as string[]).forEach((modelName) => {
                                newRefNodes.push(context.nodes.find((x) => x.name === modelName) as Node);
                            });
                        } else {
                            newRefNodes.push(context.nodes.find((x) => x.name === relField.typeMeta.name) as Node);
                        }

                        newRefNodes.forEach((newRefNode) => {
                            const recurse = createConnectAndParams({
                                withVars: [...withVars, nodeName],
                                value: relField.union ? v[newRefNode.name] : v,
                                varName: `${nodeName}_${k}${relField.union ? `_${newRefNode.name}` : ""}`,
                                relationField: relField,
                                parentVar: nodeName,
                                context,
                                callbackBucket,
                                refNodes: [newRefNode],
                                parentNode: relatedNode,
                                labelOverride: relField.union ? newRefNode.name : "",
                                includeRelationshipValidation: true,
                                isFirstLevel: false,
                                source: "CONNECT",
                            });
                            r.connects.push(recurse[0]);
                            r.params = { ...r.params, ...recurse[1] };
                        });

                        return r;
                    },
                    { connects: [], params: {} }
                );

                subquery.push(reduced.connects.join("\n"));
                params = { ...params, ...reduced.params };
            });
        }

        const authorizationAfterAndParams = createAuthorizationAfterAndParams({
            context,
            nodes: [
                { node: parentNode, variable: parentVar },
                { node: relatedNode, variable: nodeName },
            ],
            operations: ["CREATE_RELATIONSHIP"],
            indexPrefix,
        });

        if (authorizationAfterAndParams) {
            const { cypher, params: authWhereParams, subqueries } = authorizationAfterAndParams;

            if (cypher) {
                if (subqueries) {
                    subquery.push(`WITH *`);
                    subquery.push(`${subqueries}`);
                    subquery.push(`WITH *`);
                } else {
                    subquery.push(`WITH ${[...withVars, nodeName].join(", ")}`);
                }

                subquery.push(`WHERE ${cypher}`);
                params = { ...params, ...authWhereParams };
            }
        }

        if (context.subscriptionsEnabled) {
            subquery.push(`WITH collect(meta) AS connect_meta`);
            subquery.push(`RETURN REDUCE(m=[],m1 IN connect_meta | m+m1 ) as connect_meta`);
        } else {
            subquery.push(`\tRETURN count(*) AS connect_${varName}_${relatedNode.name}${index}`);
        }

        return { subquery: subquery.join("\n"), params };
    }

    function reducer(res: Res, connect: any, index: number): Res {
        if (isFirstLevel) {
            res.connects.push(`WITH *`);
        }

        const inner: string[] = [];

        if (relationField.interface) {
            const subqueries: string[] = [];
            const targetInterface = context.schemaModel.compositeEntities.find(
                (x) => x.name === relationField.typeMeta.name
            );
            if (!targetInterface || !(targetInterface instanceof InterfaceEntity)) {
                throw new Error(`Target with name ${relationField.typeMeta.name} not found`);
            }
            const entity = new InterfaceEntityAdapter(targetInterface);
            refNodes.forEach((refNode, i) => {
                const nodeName = getConnectNodeName(varName, i);
                const targetEntity = entity.concreteEntities.find((x) => x.name === refNode.name);
                const filters = getFilters({ connect, context, entity, nodeName, targetEntity });

                const subquery = createSubqueryContents(refNode, connect, i, filters);
                if (subquery.subquery) {
                    subqueries.push(subquery.subquery);
                    res.params = { ...res.params, ...subquery.params };
                }
            });
            if (subqueries.length > 0) {
                if (context.subscriptionsEnabled) {
                    const withStatement = `WITH ${filterMetaVariable(withVars).join(
                        ", "
                    )}, connect_meta + meta AS meta`;
                    inner.push(subqueries.join(`\n}\n${withStatement}\nCALL {\n\t`));
                } else {
                    inner.push(subqueries.join("\n}\nCALL {\n\t"));
                }
            }
        } else {
            const targetNode = refNodes[0];
            if (!targetNode) {
                throw new Error("No refNodes found");
            }
            const entity = getEntityAdapterFromNode(targetNode, context);
            const nodeName = getConnectNodeName(varName, index);
            const filters = getFilters({ connect, context, entity, nodeName });
            const subquery = createSubqueryContents(targetNode, connect, index, filters);
            inner.push(subquery.subquery);
            res.params = { ...res.params, ...subquery.params };
        }

        if (inner.length > 0) {
            res.connects.push("CALL {");
            res.connects.push(...inner);
            res.connects.push("}");

            if (context.subscriptionsEnabled) {
                res.connects.push(`WITH connect_meta + meta AS meta, ${filterMetaVariable(withVars).join(", ")}`);
            }
        }

        return res;
    }

    const { connects, params } = asArray(value).reduce(reducer, {
        connects: [],
        params: {},
    });

    return [connects.join("\n"), params];
}

// function to have a single source of truth for the node name of a connect operation, until the refactor to use CypherBuilder.
function getConnectNodeName(varName: string, index: number): string {
    return `${varName}${index}_node`;
}
// function to have a single source of truth for the edge name of a connect operation, until the refactor to use CypherBuilder.
function getConnectEdgeName(varName: string, index: number): string {
    return `${varName}${index}_relationship`;
}

function getFilters({
    connect,
    entity,
    targetEntity,
    context,
    nodeName,
}: {
    connect: any;
    entity: EntityAdapter;
    targetEntity?: ConcreteEntityAdapter;
    context: Neo4jGraphQLTranslationContext;
    nodeName: string;
}): Filters | undefined {
    if (!connect.where) {
        return;
    }

    const targetElement = new Cypher.NamedNode(nodeName);
    const whereInput = connect.where.node ?? {};

    const { predicate: wherePredicate, preComputedSubqueries } = createWhereNodePredicate({
        entity,
        context,
        whereInput,
        targetElement,
        targetEntity,
    });
    let preComputedWhereFieldsResult = "";

    const whereCypher = new Cypher.Raw((env: Cypher.Environment) => {
        preComputedWhereFieldsResult = compileCypherIfExists(preComputedSubqueries, env);
        const cypher = (wherePredicate as any)?.getCypher(env) || "";
        return [cypher, {}];
    });

    const result = whereCypher.build(`${nodeName}_`);

    if (result.cypher) {
        return {
            predicate: [result.cypher, result.params],
            preComputedSubqueries: preComputedWhereFieldsResult,
        };
    }
}

export default createConnectAndParams;

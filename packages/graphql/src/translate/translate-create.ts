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

import type { Node } from "../classes";
import createProjectionAndParams from "./create-projection-and-params";
import createCreateAndParams from "./create-create-and-params";
import type { Context, ConnectionField, RelationField } from "../types";
import { AUTH_FORBIDDEN_ERROR, META_CYPHER_VARIABLE } from "../constants";
import createConnectionAndParams from "./connection/create-connection-and-params";
import { filterTruthy } from "../utils/utils";
import { CallbackBucket } from "../classes/CallbackBucket";
import * as CypherBuilder from "./cypher-builder/CypherBuilder";
import { compileCypherIfExists } from "./cypher-builder/utils/utils";
import { SetClause } from "./cypher-builder/clauses/sub-clauses/Set";

type CreateInput = Record<string, any>;
/* 
{ id: "2", actors: { create: [{ node: { name: "actor 2" }, edge: { year: 1999 } }] } }
{ id: "3", website: { create: { node: { address: "mywebsite.com" } } } }
{ id: "4", actors: { connect: { where: { node: { id: "2" } } } } } 
*/
/* 
const fakeTree = {
    properties: ["id"],
    childrens: {
        actors: {
            properties: [],
            childrens: {
                create: {
                    properties: [],
                    childrens: {
                        properties: [],
                        childrens: {
                            node: {
                                properties: ["name"],
                                childrens: {},
                            },
                            edge: {
                                properties: ["year"],
                                childrens: {},
                            },
                        },
                    },
                },
                connect: {
                    properties: [],
                    childrens: {
                        where: {
                            properties: [],
                            childrens: {
                                node: {
                                    properties: ["id"],
                                    childrens: {},
                                },
                            },
                        },
                    },
                },
            },
        },
        website: {
            properties: [],
            childrens: {
                create: {
                    properties: [],
                    childrens: {
                        node: {
                            properties: ["address"],
                            childrens: {},
                        },
                    },
                },
            },
        },
    },
}; */

// at this point may be not longer necessary and just let it parse as params
function inputTreeToCypherMap(input: CreateInput[] | CreateInput): CypherBuilder.List | CypherBuilder.Map {
    if (Array.isArray(input)) {
        return new CypherBuilder.List(input.map((node: CreateInput) => inputTreeToCypherMap(node)));
    }

    const properties = (Object.entries(input) as CreateInput).reduce(
        (obj: Record<string, CypherBuilder.Expr>, [key, value]: any[]) => {
            if (typeof value === "object" && value !== null) {
                if (Array.isArray(value)) {
                    obj[key] = new CypherBuilder.List(value.map((node: CreateInput) => inputTreeToCypherMap(node)));
                } else {
                    obj[key] = inputTreeToCypherMap(value as CreateInput[] | CreateInput) as CypherBuilder.Map;
                }
            } else {
                obj[key] = new CypherBuilder.Literal(value);
            }
            return obj;
        },
        {} as Record<string, CypherBuilder.Expr>
    ) as Record<string, CypherBuilder.Expr>;
    return new CypherBuilder.Map(properties);
}

interface TreeDescriptor {
    properties: Set<string>;
    childrens: Record<string, TreeDescriptor>;
}

function mergeTreeDescriptors(input: TreeDescriptor[]): TreeDescriptor {
    return input.reduce(
        (previous: TreeDescriptor, node: TreeDescriptor) => {
            previous.properties = new Set([...previous.properties, ...node.properties]);
            const entries = [...new Set([...Object.keys(previous.childrens), ...Object.keys(node.childrens)])].map(
                (childrenKey) => {
                    const previousChildren: TreeDescriptor =
                        previous.childrens[childrenKey] ?? ({ properties: new Set(), childrens: {} } as TreeDescriptor);
                    const nodeChildren: TreeDescriptor =
                        node.childrens[childrenKey] ?? ({ properties: new Set(), childrens: {} } as TreeDescriptor);
                    return [childrenKey, mergeTreeDescriptors([previousChildren, nodeChildren])];
                }
            ) as [string, TreeDescriptor][];
            previous.childrens = Object.fromEntries(entries);
            return previous;
        },
        { properties: new Set(), childrens: {} } as TreeDescriptor
    );
}

function getTreeDescriptor(input: CreateInput): TreeDescriptor {
    return Object.entries(input).reduce(
        (previous, [key, value]) => {
            if (typeof value === "object" && value !== null) {
                if (Array.isArray(value)) {
                    previous.childrens[key] = mergeTreeDescriptors(
                        value.map((el) => getTreeDescriptor(el as CreateInput))
                    );
                } else {
                    previous.childrens[key] = getTreeDescriptor(value as CreateInput);
                }
            } else {
                previous.properties.add(key);
            }
            return previous;
        },
        { properties: new Set(), childrens: {} } as TreeDescriptor
    );
}

interface CreateVisitor {
    visitKey(key: string);
    getChildrensVisitor(): CreateVisitor;
    visitProperties(properties: Set<string>): void;
    done(): CypherBuilder.Clause;
}

function createVisitor(node: Node, context: Context, variables: Record<string, CypherBuilder.Variable>): CreateVisitor {
    let doneClause: CypherBuilder.Clause;
    let createClause: CypherBuilder.Clause;
    let childrensVisitor: CreateVisitor;
    return {
        visitKey: (key) => {},
        visitProperties: (properties) => {
            const labels = node.getLabels(context);
            const currentNode = new CypherBuilder.Node({
                labels,
            });

            // Not all the properties are equal TemporalFields, pointField etc..
            const setProperties = [...properties].map((property: string) => [
                currentNode.property(property),
                variables.unwindVar.property(property),
            ]) as CypherBuilder.SetParam[];
            variables.createdNode = currentNode;
            createClause = new CypherBuilder.Create(currentNode).set(...setProperties);
        },
        getChildrensVisitor: () => {
            childrensVisitor = relationshipVisitor(node, context, variables);
            return childrensVisitor;
        },
        done: () => {
            if (doneClause) return doneClause;
            if (childrensVisitor) {
                doneClause = CypherBuilder.concat(createClause, childrensVisitor.done());
            } else {
                doneClause = createClause;
            }

            return doneClause;
        },
    };
}

function relationshipVisitor(
    node: Node,
    context: Context,
    variables: Record<string, CypherBuilder.Variable>
): CreateVisitor {
    let childrensVisitor;
    let relationship: [RelationField | undefined, Node[]];
    let relationshipPropertyPath: string;
    let doneClause;
    return {
        visitProperties(properties) {},
        visitKey(key) {
            relationshipPropertyPath = key;
            relationship = getRelationshipFields(node, relationshipPropertyPath, {}, context);
        },
        getChildrensVisitor() {
            childrensVisitor = relationshipDescriptorVisitor(
                node,
                context,
                variables,
                relationship,
                relationshipPropertyPath
            );
            return childrensVisitor;
        },
        done() {
            if (doneClause) return doneClause;
            if (childrensVisitor) {
                doneClause = childrensVisitor.done();
            }
            return doneClause;
        },
    };
}

function relationshipDescriptorVisitor(
    node: Node,
    context: Context,
    variables: Record<string, CypherBuilder.Variable>,
    relationship: [RelationField | undefined, Node[]],
    relationshipPropertyPath: string
): CreateVisitor {
    let childrensVisitor;
    let doneClause;

    return {
        visitProperties(properties) {},
        visitKey(key) {
            if (key === "create") {
                childrensVisitor = relationshipCreateVisitor(
                    node,
                    context,
                    variables,
                    relationship,
                    relationshipPropertyPath
                );
            }
        },
        getChildrensVisitor() {
            return childrensVisitor;
        },
        done() {
            if (doneClause) return doneClause;
            if (childrensVisitor) {
                doneClause = childrensVisitor.done();
            }
            return doneClause;
        },
    };
}

function relationshipCreateVisitor(
    node: Node,
    context: Context,
    variables: Record<string, CypherBuilder.Variable>,
    relationship: [RelationField | undefined, Node[]],
    relationshipPropertyPath: string
): CreateVisitor {
    let nodeProperties: string[];
    let edgeProperties: string[];
    let childrensVisitor: CreateVisitor;
    let doneClause: CypherBuilder.Clause;
    let lastVisitedKey: string;
    return {
        visitProperties(properties) {
            if (lastVisitedKey === "node") {
                nodeProperties = [...properties];
            } else if (lastVisitedKey === "edge") {
                edgeProperties = [...properties];
            }
        },
        visitKey(key) {
            lastVisitedKey = key;
        },
        getChildrensVisitor() {
            if (lastVisitedKey === "node") {
                childrensVisitor = relationshipVisitor(node, context, variables);
                return childrensVisitor;
            }
            return this;
        },
        done() {
            if (doneClause) return doneClause;
            const blockWith = new CypherBuilder.With(variables.createdNode, variables.unwindVar);
            const createUnwindVar = new CypherBuilder.Variable();
            const createUnwindClause = new CypherBuilder.Unwind([
                variables.unwindVar.property(relationshipPropertyPath),
                createUnwindVar,
            ]);
            const labels = node.getLabels(context);
            const currentNode = new CypherBuilder.Node({
                labels,
            });
            const nodeVar = new CypherBuilder.Variable();
            const edgeVar = new CypherBuilder.Variable();
            const withCreate = new CypherBuilder.With(
                [createUnwindVar.property("node"), nodeVar],
                [createUnwindVar.property("edge"), edgeVar],
                variables.createdNode
            );
            const createClause = new CypherBuilder.Create(currentNode);
            // TODO: check the correct direction
            const relationshipClause = new CypherBuilder.Relationship({
                source: currentNode,
                target: variables.createdNode as CypherBuilder.Node,
                type: (relationship[0] as RelationField).type,
            });
            const mergeClause = new CypherBuilder.Merge(relationshipClause);

            const setPropertiesNode = nodeProperties.map((property) => {
                return [currentNode.property(property), nodeVar.property(property)];
            }) as CypherBuilder.SetParam[];
            // eslint-disable-next-line no-new
            createClause.set(...setPropertiesNode);
            if (edgeProperties) {
                /*      const setPropertiesEdge = edgeProperties.map((property) => {
                    return [relationshipClause.property(property), edgeVar.property(property)];
                }) as CypherBuilder.SetParam[]; */
            }

            const subQueryStatements = [blockWith, createUnwindClause, withCreate, createClause, mergeClause] as CypherBuilder.Clause[];
            if (childrensVisitor) {
                subQueryStatements.push(childrensVisitor.done());
            }
            const subQuery = CypherBuilder.concat(
                ...subQueryStatements
            );
            const callClause = new CypherBuilder.Call(subQuery);
            const outsideWith = new CypherBuilder.With(variables.createdNode, variables.unwindVar);
            doneClause = CypherBuilder.concat(outsideWith, callClause);
            return doneClause;
        },
    };
}
/* 
            WITH this0,x
            CALL {
                WITH this0, x
                UNWIND x.actors as x_actor_connection
                WITH x_actor_connection.node as x_actor, x_actor_connection.edge as x_actor_edge, this0
                CREATE(this1:Person)
                SET this1.name=x_actor.name
                MERGE (this1)-[edge0:ACTED_IN]->(this0)
                SET edge0.year=x_actor_edge.year */


function getRelationshipFields(
    node: Node,
    key: string,
    value: any,
    context: Context
): [RelationField | undefined, Node[]] {
    const relationField = node.relationFields.find((x) => key === x.fieldName);
    const refNodes: Node[] = [];

    if (relationField) {
        if (relationField.union) {
            Object.keys(value as Record<string, any>).forEach((unionTypeName) => {
                refNodes.push(context.nodes.find((x) => x.name === unionTypeName) as Node);
            });
        } else if (relationField.interface) {
            relationField.interface?.implementations?.forEach((implementationName) => {
                refNodes.push(context.nodes.find((x) => x.name === implementationName) as Node);
            });
        } else {
            refNodes.push(context.nodes.find((x) => x.name === relationField.typeMeta.name) as Node);
        }
    }
    return [relationField, refNodes];
}

// root
// root.visitProperties(createProperties)
// relationship = root.getChildrens()
// relationship.visitKey(actor)
// relationship.visitProperties(empty)
// relationshipDescriptor = relationship.getChildrens()
// relationshipDescriptor.visitKey(create)
// relationshipDescriptor.visitProperties()
// createRelationship = relationshipDescriptor.getChildrens()
// createRelationship.visitKey(node)  || createRelationship.visitKey(edge)
// createRelationship.visitProperties(node.properties)  || createRelationship.visitProperties(edge.properties)
//
//

function dispatch(treeDescriptor: TreeDescriptor, visitor: CreateVisitor): CypherBuilder.Clause {
    visitor.visitProperties(treeDescriptor.properties);
    const subVisitor = visitor.getChildrensVisitor();
    Object.entries(treeDescriptor.childrens).forEach(([key, value]) => {
        subVisitor.visitKey(key);
        dispatch(value, subVisitor);
    });
    return visitor.done();
}

export default async function translateCreate({
    context,
    node,
}: {
    context: Context;
    node: Node;
}): Promise<{ cypher: string; params: Record<string, any> }> {
    const { resolveTree } = context;
    const connectionStrs: string[] = [];
    const interfaceStrs: string[] = [];

    const projectionWith: string[] = [];
    const callbackBucket: CallbackBucket = new CallbackBucket(context);

    let connectionParams: any;
    let interfaceParams: any;

    const mutationResponse = resolveTree.fieldsByTypeName[node.mutationResponseTypeNames.create];

    const nodeProjection = Object.values(mutationResponse).find((field) => field.name === node.plural);
    const metaNames: string[] = [];

    // new unwind strategy block
    const unwind = inputTreeToCypherMap(resolveTree.args.input as CreateInput | CreateInput[]);
    const treeDescriptor = getTreeDescriptor({ root: resolveTree.args.input as CreateInput });
    const unwindVar = new CypherBuilder.Variable();
    const unwindQuery = new CypherBuilder.Unwind([unwind, unwindVar]);
    const asd = createVisitor(node, context, { unwindVar });
    const cq = dispatch(treeDescriptor.childrens.root, asd);
    // const cq = buildCreate(treeDescriptor.childrens.root, node, context, "root", { unwindVar });
    const query = CypherBuilder.concat(unwindQuery, cq);
    const { cypher: cy, params: pa } = query.build();
    console.log(cy);
    console.log(pa);

    let clauses: CypherBuilder.Clause[];

    const { createStrs, params } = (resolveTree.args.input as any[]).reduce(
        (res, input, index) => {
            const varName = `this${index}`;
            const create = [`CALL {`];

            const withVars = [varName];
            projectionWith.push(varName);
            if (context.subscriptionsEnabled) {
                create.push(`WITH [] AS ${META_CYPHER_VARIABLE}`);
                withVars.push(META_CYPHER_VARIABLE);
            }

            const createAndParams = createCreateAndParams({
                input,
                node,
                context,
                varName,
                withVars,
                includeRelationshipValidation: true,
                topLevelNodeVariable: varName,
                callbackBucket,
            });

            create.push(`${createAndParams[0]}`);
            if (context.subscriptionsEnabled) {
                const metaVariable = `${varName}_${META_CYPHER_VARIABLE}`;
                create.push(`RETURN ${varName}, ${META_CYPHER_VARIABLE} AS ${metaVariable}`);
                metaNames.push(metaVariable);
            } else {
                create.push(`RETURN ${varName}`);
            }

            create.push(`}`);

            res.createStrs.push(create.join("\n"));
            res.params = { ...res.params, ...createAndParams[1] };

            return res;
        },
        { createStrs: [], params: {}, withVars: [] }
    ) as {
        createStrs: string[];
        params: any;
    };

    let replacedProjectionParams: Record<string, unknown> = {};
    let projectionStr: string | undefined;
    let authCalls: string | undefined;

    if (metaNames.length > 0) {
        projectionWith.push(`${metaNames.join(" + ")} AS meta`);
    }

    let projectionSubquery: CypherBuilder.Clause | undefined;
    if (nodeProjection) {
        let projAuth = "";
        const projection = createProjectionAndParams({
            node,
            context,
            resolveTree: nodeProjection,
            varName: "REPLACE_ME",
        });
        projectionSubquery = CypherBuilder.concat(...projection.subqueries);
        if (projection.meta?.authValidateStrs?.length) {
            projAuth = `CALL apoc.util.validate(NOT (${projection.meta.authValidateStrs.join(
                " AND "
            )}), "${AUTH_FORBIDDEN_ERROR}", [0])`;
        }

        replacedProjectionParams = Object.entries(projection.params).reduce((res, [key, value]) => {
            return { ...res, [key.replace("REPLACE_ME", "projection")]: value };
        }, {});

        projectionStr = createStrs
            .map(
                (_, i) =>
                    `\nthis${i} ${projection.projection
                        // First look to see if projection param is being reassigned
                        // e.g. in an apoc.cypher.runFirstColumn function call used in createProjection->connectionField
                        .replace(/REPLACE_ME(?=\w+: \$REPLACE_ME)/g, "projection")
                        .replace(/\$REPLACE_ME/g, "$projection")
                        .replace(/REPLACE_ME/g, `this${i}`)}`
            )
            .join(", ");

        authCalls = createStrs
            .map((_, i) => projAuth.replace(/\$REPLACE_ME/g, "$projection").replace(/REPLACE_ME/g, `this${i}`))
            .join("\n");

        const withVars = context.subscriptionsEnabled ? [META_CYPHER_VARIABLE] : [];
        if (projection.meta?.connectionFields?.length) {
            projection.meta.connectionFields.forEach((connectionResolveTree) => {
                const connectionField = node.connectionFields.find(
                    (x) => x.fieldName === connectionResolveTree.name
                ) as ConnectionField;
                const connection = createConnectionAndParams({
                    resolveTree: connectionResolveTree,
                    field: connectionField,
                    context,
                    nodeVariable: "REPLACE_ME",
                    withVars,
                });
                connectionStrs.push(connection[0]);
                if (!connectionParams) connectionParams = {};
                connectionParams = { ...connectionParams, ...connection[1] };
            });
        }
    }

    const replacedConnectionStrs = connectionStrs.length
        ? createStrs.map((_, i) => {
              return connectionStrs
                  .map((connectionStr) => {
                      return connectionStr.replace(/REPLACE_ME/g, `this${i}`);
                  })
                  .join("\n");
          })
        : [];

    const replacedInterfaceStrs = interfaceStrs.length
        ? createStrs.map((_, i) => {
              return interfaceStrs
                  .map((interfaceStr) => {
                      return interfaceStr.replace(/REPLACE_ME/g, `this${i}`);
                  })
                  .join("\n");
          })
        : [];

    const replacedConnectionParams = connectionParams
        ? createStrs.reduce((res1, _, i) => {
              return {
                  ...res1,
                  ...Object.entries(connectionParams).reduce((res2, [key, value]) => {
                      return { ...res2, [key.replace("REPLACE_ME", `this${i}`)]: value };
                  }, {}),
              };
          }, {})
        : {};

    const replacedInterfaceParams = interfaceParams
        ? createStrs.reduce((res1, _, i) => {
              return {
                  ...res1,
                  ...Object.entries(interfaceParams).reduce((res2, [key, value]) => {
                      return { ...res2, [key.replace("REPLACE_ME", `this${i}`)]: value };
                  }, {}),
              };
          }, {})
        : {};

    const returnStatement = generateCreateReturnStatement(projectionStr, context.subscriptionsEnabled);
    const projectionWithStr = context.subscriptionsEnabled ? `WITH ${projectionWith.join(", ")}` : "";

    const createQuery = new CypherBuilder.RawCypher((env) => {
        const projectionSubqueryStr = compileCypherIfExists(projectionSubquery, env);
        // TODO: avoid REPLACE_ME
        const replacedProjectionSubqueryStrs = createStrs.length
            ? createStrs.map((_, i) => {
                  return projectionSubqueryStr
                      .replace(/REPLACE_ME(?=\w+: \$REPLACE_ME)/g, "projection")
                      .replace(/\$REPLACE_ME/g, "$projection")
                      .replace(/REPLACE_ME/g, `this${i}`);
              })
            : [];

        const cypher = filterTruthy([
            `${createStrs.join("\n")}`,
            projectionWithStr,
            authCalls,
            ...replacedConnectionStrs,
            ...replacedInterfaceStrs,
            ...replacedProjectionSubqueryStrs,
            returnStatement,
        ])
            .filter(Boolean)
            .join("\n");

        return [
            cypher,
            {
                ...params,
                ...replacedProjectionParams,
                ...replacedConnectionParams,
                ...replacedInterfaceParams,
            },
        ];
    });

    const createQueryCypher = createQuery.build("create_");

    const { cypher, params: resolvedCallbacks } = await callbackBucket.resolveCallbacksAndFilterCypher({
        cypher: createQueryCypher.cypher,
    });

    return {
        cypher,
        params: {
            ...createQueryCypher.params,
            resolvedCallbacks,
        },
    };
}

export async function translateCreateOld({
    context,
    node,
}: {
    context: Context;
    node: Node;
}): Promise<{ cypher: string; params: Record<string, any> }> {
    const { resolveTree } = context;
    const connectionStrs: string[] = [];
    const interfaceStrs: string[] = [];

    const projectionWith: string[] = [];
    const callbackBucket: CallbackBucket = new CallbackBucket(context);

    let connectionParams: any;
    let interfaceParams: any;

    const mutationResponse = resolveTree.fieldsByTypeName[node.mutationResponseTypeNames.create];

    const nodeProjection = Object.values(mutationResponse).find((field) => field.name === node.plural);
    const metaNames: string[] = [];

    const { createStrs, params } = (resolveTree.args.input as any[]).reduce(
        (res, input, index) => {
            const varName = `this${index}`;
            const create = [`CALL {`];

            const withVars = [varName];
            projectionWith.push(varName);
            if (context.subscriptionsEnabled) {
                create.push(`WITH [] AS ${META_CYPHER_VARIABLE}`);
                withVars.push(META_CYPHER_VARIABLE);
            }

            const createAndParams = createCreateAndParams({
                input,
                node,
                context,
                varName,
                withVars,
                includeRelationshipValidation: true,
                topLevelNodeVariable: varName,
                callbackBucket,
            });

            create.push(`${createAndParams[0]}`);
            if (context.subscriptionsEnabled) {
                const metaVariable = `${varName}_${META_CYPHER_VARIABLE}`;
                create.push(`RETURN ${varName}, ${META_CYPHER_VARIABLE} AS ${metaVariable}`);
                metaNames.push(metaVariable);
            } else {
                create.push(`RETURN ${varName}`);
            }

            create.push(`}`);

            res.createStrs.push(create.join("\n"));
            res.params = { ...res.params, ...createAndParams[1] };

            return res;
        },
        { createStrs: [], params: {}, withVars: [] }
    ) as {
        createStrs: string[];
        params: any;
    };

    let replacedProjectionParams: Record<string, unknown> = {};
    let projectionStr: string | undefined;
    let authCalls: string | undefined;

    if (metaNames.length > 0) {
        projectionWith.push(`${metaNames.join(" + ")} AS meta`);
    }

    let projectionSubquery: CypherBuilder.Clause | undefined;
    if (nodeProjection) {
        let projAuth = "";
        const projection = createProjectionAndParams({
            node,
            context,
            resolveTree: nodeProjection,
            varName: "REPLACE_ME",
        });
        projectionSubquery = CypherBuilder.concat(...projection.subqueries);
        if (projection.meta?.authValidateStrs?.length) {
            projAuth = `CALL apoc.util.validate(NOT (${projection.meta.authValidateStrs.join(
                " AND "
            )}), "${AUTH_FORBIDDEN_ERROR}", [0])`;
        }

        replacedProjectionParams = Object.entries(projection.params).reduce((res, [key, value]) => {
            return { ...res, [key.replace("REPLACE_ME", "projection")]: value };
        }, {});

        projectionStr = createStrs
            .map(
                (_, i) =>
                    `\nthis${i} ${projection.projection
                        // First look to see if projection param is being reassigned
                        // e.g. in an apoc.cypher.runFirstColumn function call used in createProjection->connectionField
                        .replace(/REPLACE_ME(?=\w+: \$REPLACE_ME)/g, "projection")
                        .replace(/\$REPLACE_ME/g, "$projection")
                        .replace(/REPLACE_ME/g, `this${i}`)}`
            )
            .join(", ");

        authCalls = createStrs
            .map((_, i) => projAuth.replace(/\$REPLACE_ME/g, "$projection").replace(/REPLACE_ME/g, `this${i}`))
            .join("\n");

        const withVars = context.subscriptionsEnabled ? [META_CYPHER_VARIABLE] : [];
        if (projection.meta?.connectionFields?.length) {
            projection.meta.connectionFields.forEach((connectionResolveTree) => {
                const connectionField = node.connectionFields.find(
                    (x) => x.fieldName === connectionResolveTree.name
                ) as ConnectionField;
                const connection = createConnectionAndParams({
                    resolveTree: connectionResolveTree,
                    field: connectionField,
                    context,
                    nodeVariable: "REPLACE_ME",
                    withVars,
                });
                connectionStrs.push(connection[0]);
                if (!connectionParams) connectionParams = {};
                connectionParams = { ...connectionParams, ...connection[1] };
            });
        }
    }

    const replacedConnectionStrs = connectionStrs.length
        ? createStrs.map((_, i) => {
              return connectionStrs
                  .map((connectionStr) => {
                      return connectionStr.replace(/REPLACE_ME/g, `this${i}`);
                  })
                  .join("\n");
          })
        : [];

    const replacedInterfaceStrs = interfaceStrs.length
        ? createStrs.map((_, i) => {
              return interfaceStrs
                  .map((interfaceStr) => {
                      return interfaceStr.replace(/REPLACE_ME/g, `this${i}`);
                  })
                  .join("\n");
          })
        : [];

    const replacedConnectionParams = connectionParams
        ? createStrs.reduce((res1, _, i) => {
              return {
                  ...res1,
                  ...Object.entries(connectionParams).reduce((res2, [key, value]) => {
                      return { ...res2, [key.replace("REPLACE_ME", `this${i}`)]: value };
                  }, {}),
              };
          }, {})
        : {};

    const replacedInterfaceParams = interfaceParams
        ? createStrs.reduce((res1, _, i) => {
              return {
                  ...res1,
                  ...Object.entries(interfaceParams).reduce((res2, [key, value]) => {
                      return { ...res2, [key.replace("REPLACE_ME", `this${i}`)]: value };
                  }, {}),
              };
          }, {})
        : {};

    const returnStatement = generateCreateReturnStatement(projectionStr, context.subscriptionsEnabled);
    const projectionWithStr = context.subscriptionsEnabled ? `WITH ${projectionWith.join(", ")}` : "";

    const createQuery = new CypherBuilder.RawCypher((env) => {
        const projectionSubqueryStr = compileCypherIfExists(projectionSubquery, env);
        // TODO: avoid REPLACE_ME
        const replacedProjectionSubqueryStrs = createStrs.length
            ? createStrs.map((_, i) => {
                  return projectionSubqueryStr
                      .replace(/REPLACE_ME(?=\w+: \$REPLACE_ME)/g, "projection")
                      .replace(/\$REPLACE_ME/g, "$projection")
                      .replace(/REPLACE_ME/g, `this${i}`);
              })
            : [];

        const cypher = filterTruthy([
            `${createStrs.join("\n")}`,
            projectionWithStr,
            authCalls,
            ...replacedConnectionStrs,
            ...replacedInterfaceStrs,
            ...replacedProjectionSubqueryStrs,
            returnStatement,
        ])
            .filter(Boolean)
            .join("\n");

        return [
            cypher,
            {
                ...params,
                ...replacedProjectionParams,
                ...replacedConnectionParams,
                ...replacedInterfaceParams,
            },
        ];
    });

    const createQueryCypher = createQuery.build("create_");

    const { cypher, params: resolvedCallbacks } = await callbackBucket.resolveCallbacksAndFilterCypher({
        cypher: createQueryCypher.cypher,
    });

    return {
        cypher,
        params: {
            ...createQueryCypher.params,
            resolvedCallbacks,
        },
    };
}

function generateCreateReturnStatement(projectionStr: string | undefined, subscriptionsEnabled: boolean): string {
    const statements: string[] = [];

    if (projectionStr) {
        statements.push(`[${projectionStr}] AS data`);
    }

    if (subscriptionsEnabled) {
        statements.push(META_CYPHER_VARIABLE);
    }

    if (statements.length === 0) {
        statements.push("'Query cannot conclude with CALL'");
    }

    return `RETURN ${statements.join(", ")}`;
}

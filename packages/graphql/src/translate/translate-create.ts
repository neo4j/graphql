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
import type { Context, ConnectionField, RelationField } from "../types";
import { AUTH_FORBIDDEN_ERROR, META_CYPHER_VARIABLE } from "../constants";
import createConnectionAndParams from "./connection/create-connection-and-params";
import { filterTruthy } from "../utils/utils";
import { CallbackBucket } from "../classes/CallbackBucket";
import * as CypherBuilder from "./cypher-builder/CypherBuilder";
import { compileCypherIfExists } from "./cypher-builder/utils/utils";
import createRelationshipValidationString from "./create-relationship-validation-string";

type CreateInput = Record<string, any>;

// TODO: refactor this tree traversal
function inputTreeToCypherMap(
    input: CreateInput[] | CreateInput,
    node: Node,
    context: Context
): CypherBuilder.List | CypherBuilder.Map {
    if (Array.isArray(input)) {
        return new CypherBuilder.List(
            input.map((createInput: CreateInput) => inputTreeToCypherMap(createInput, node, context))
        );
    }

    const properties = (Object.entries(input) as CreateInput).reduce(
        (obj: Record<string, CypherBuilder.Expr>, [key, value]: [string, Record<string, any>]) => {
            const [relationField, relatedNodes] = getRelationshipFields(node, key, {}, context);
            const RESERVED_NAMES = ["node", "edge", "create", "connect", "connectOrCreate"];
            // TODO: supports union/interfaces
            if (typeof value === "object" && value !== null && (relationField || RESERVED_NAMES.includes(key))) {
                if (Array.isArray(value)) {
                    obj[key] = new CypherBuilder.List(
                        value.map((createInput: CreateInput) =>
                            inputTreeToCypherMap(createInput, relationField ? relatedNodes[0] : node, context)
                        )
                    );
                    return obj;
                }
                obj[key] = inputTreeToCypherMap(
                    value as CreateInput[] | CreateInput,
                    relationField ? relatedNodes[0] : node,
                    context
                ) as CypherBuilder.Map;
                return obj;
            }
            obj[key] = new CypherBuilder.Param(value);
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

function getTreeDescriptor(input: CreateInput, node: Node, context: Context): TreeDescriptor {
    return Object.entries(input).reduce(
        (previous, [key, value]) => {
            const [relationField, relatedNodes] = getRelationshipFields(node, key as string, {}, context);
            const primitiveField = node.primitiveFields.find((x) => key === x.fieldName);
            const temporalFields = node.temporalFields.find((x) => key === x.fieldName);
            const pointField = node.pointFields.find((x) => key === x.fieldName);
            // TODO: supports union/interfaces
            if (typeof value === "object" && value !== null && !primitiveField && !temporalFields && !pointField) {
                const innerNode = relationField ? relatedNodes[0] : node;
                if (Array.isArray(value)) {
                    previous.childrens[key] = mergeTreeDescriptors(
                        value.map((el) => getTreeDescriptor(el as CreateInput, innerNode, context))
                    );
                    return previous;
                }
                previous.childrens[key] = getTreeDescriptor(value as CreateInput, innerNode, context);
                return previous;
            }
            previous.properties.add(key);
            return previous;
        },
        { properties: new Set(), childrens: {} } as TreeDescriptor
    );
}
// TODO: support aliasing
function getAutoGeneratedFields(node: Node, cypherNodeRef: CypherBuilder.Node): CypherBuilder.SetParam[] {
    const setParams: CypherBuilder.SetParam[] = [];
    const timestampedFields = node.temporalFields.filter(
        (x) => ["DateTime", "Time"].includes(x.typeMeta.name) && x.timestamps?.includes("CREATE")
    );
    timestampedFields.forEach((field) => {
        // DateTime -> datetime(); Time -> time()
        // eslint-disable-next-line import/namespace
        const relatedCypherExpression = CypherBuilder[field.typeMeta.name.toLowerCase()]() as CypherBuilder.Expr;
        setParams.push([
            cypherNodeRef.property(field.dbPropertyName as string),
            relatedCypherExpression,
        ] as CypherBuilder.SetParam);
    });

    node.primitiveFields.forEach((field) => {
        // addCallbackAndSetParamCypher(field, cypherNodeRef, input, callbackBucket, initial, "CREATE")
        // TODO: implement callback
    });

    const autogeneratedIdFields = node.primitiveFields.filter((x) => x.autogenerate);
    autogeneratedIdFields.forEach((field) => {
        setParams.push([cypherNodeRef.property(field.dbPropertyName as string), CypherBuilder.randomUUID()]);
    });
    return setParams;
}
// TODO: supports aliasing
function fieldToSetParam(node: Node, cypherNodeRef: CypherBuilder.Node, key: string, value: CypherBuilder.Expr) {
    const pointField = node.pointFields.find((x) => key === x.fieldName);
    if (pointField) {
        if (pointField.typeMeta.array) {
            const comprehensionVar = new CypherBuilder.Variable();
            const mapPoint = CypherBuilder.point(comprehensionVar);
            const expression = new CypherBuilder.ListComprehension(comprehensionVar, value).map(mapPoint);
            return [cypherNodeRef.property(key), expression];
        }
        return [cypherNodeRef.property(key), CypherBuilder.point(value)];
    }
    return [cypherNodeRef.property(key), value];
}

interface CreateVisitor {
    visitKey(key: string);
    getChildrensVisitor(): CreateVisitor;
    visitProperties(properties: Set<string>): void;
    done(): CypherBuilder.Clause;
}

interface RootVisitor {
    getNodeVariable(): CypherBuilder.Variable;
}

function createVisitor(node: Node, context: Context, unwindVar: CypherBuilder.Variable): CreateVisitor & RootVisitor {
    let doneClause: CypherBuilder.Clause;
    let createClause: CypherBuilder.Clause;
    let childrensVisitor: CreateVisitor;
    let nodeVariable: CypherBuilder.Variable;

    return {
        getNodeVariable: () => nodeVariable,
        visitKey: (key) => {},
        visitProperties: (properties) => {
            const labels = node.getLabels(context);
            const currentNode = new CypherBuilder.Node({
                labels,
            });

            const setProperties = [...properties].map((property: string) =>
                fieldToSetParam(node, currentNode, property, unwindVar.property(property))
            ) as CypherBuilder.SetParam[];
            const autogeneratedProperties = getAutoGeneratedFields(node, currentNode);
            nodeVariable = currentNode;
            createClause = new CypherBuilder.Create(currentNode).set(...setProperties, ...autogeneratedProperties);
        },
        getChildrensVisitor: () => {
            childrensVisitor = relationshipVisitor(node, context, nodeVariable, unwindVar);
            return childrensVisitor;
        },
        done: () => {
            if (doneClause) return doneClause;
            const relationshipValidationClause = new CypherBuilder.RawCypher((env: CypherBuilder.Environment) => {
                const str = createRelationshipValidationString({
                    node,
                    context,
                    varName: env.getVariableId(nodeVariable),
                });
                const cypher = [] as string[];
                if (str) {
                    cypher.push(`WITH ${env.getVariableId(nodeVariable)}`);
                    cypher.push(str);
                }
                return cypher.join("\n");
            });
            if (childrensVisitor) {
                doneClause = CypherBuilder.concat(createClause, childrensVisitor.done(), relationshipValidationClause);
            } else {
                doneClause = CypherBuilder.concat(createClause, relationshipValidationClause);
            }

            return doneClause;
        },
    };
}

function relationshipVisitor(
    node: Node,
    context: Context,
    parentVar: CypherBuilder.Variable,
    unwindVar: CypherBuilder.Variable
): CreateVisitor {
    const childrensVisitors: CreateVisitor[] = [];
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
            const childrensVisitor = relationshipDescriptorVisitor(
                // TODO: I guess that interfaces and union will have more nodes
                relationship[1][0],
                node,
                context,
                relationship,
                relationshipPropertyPath,
                parentVar,
                unwindVar
            );
            childrensVisitors.push(childrensVisitor);
            return childrensVisitor;
        },
        done() {
            if (doneClause) return doneClause;
            const cypherClauses = childrensVisitors.map((childrenVisitor) => childrenVisitor.done());
            doneClause = CypherBuilder.concat(...cypherClauses);
            return doneClause;
        },
    };
}

function relationshipDescriptorVisitor(
    node: Node,
    parentNode: Node,
    context: Context,
    relationship: [RelationField | undefined, Node[]],
    relationshipPropertyPath: string,
    parentVar: CypherBuilder.Variable,
    unwindVar: CypherBuilder.Variable
): CreateVisitor {
    let childrensVisitor;
    let doneClause;

    return {
        visitProperties(properties) {},
        visitKey(key) {
            if (key === "create") {
                childrensVisitor = relationshipCreateVisitor(
                    node,
                    parentNode,
                    context,
                    relationship,
                    relationshipPropertyPath,
                    parentVar,
                    unwindVar
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
    parentNode: Node,
    context: Context,
    relationship: [RelationField | undefined, Node[]],
    relationshipPropertyPath: string,
    parentVar: CypherBuilder.Variable,
    unwindVar: CypherBuilder.Variable
): CreateVisitor {
    let nodeProperties: string[];
    let edgeProperties: string[];
    let childrensVisitor: CreateVisitor;
    let doneClause: CypherBuilder.Clause;
    let lastVisitedKey: string;

    const blockWith = new CypherBuilder.With(parentVar, unwindVar);
    const createUnwindVar = new CypherBuilder.Variable();
    const createUnwindClause = new CypherBuilder.Unwind([
        unwindVar.property(relationshipPropertyPath),
        createUnwindVar,
    ]);
    const labels = node.getLabels(context);
    const currentNode = new CypherBuilder.Node({
        labels,
    });
    const nodeVar = new CypherBuilder.Variable();
    const edgeVar = new CypherBuilder.Variable();
    const withCreate = new CypherBuilder.With(
        [createUnwindVar.property("create").property("node"), nodeVar],
        [createUnwindVar.property("create").property("edge"), edgeVar],
        parentVar
    );
    const createClause = new CypherBuilder.Create(currentNode);
    // TODO: check the correct direction
    const relationshipClause = new CypherBuilder.Relationship({
        source: currentNode,
        target: parentVar as CypherBuilder.Node,
        type: (relationship[0] as RelationField).type,
    });
    const mergeClause = new CypherBuilder.Merge(relationshipClause);

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
                childrensVisitor = relationshipVisitor(node, context, currentNode, createUnwindVar);
                return childrensVisitor;
            }
            return this;
        },
        done() {
            if (doneClause) return doneClause;

            const setPropertiesNode = nodeProperties.map((property: string) =>
                fieldToSetParam(node, currentNode, property, nodeVar.property(property))
            ) as CypherBuilder.SetParam[];
            const autogeneratedProperties = getAutoGeneratedFields(node, currentNode);
            // eslint-disable-next-line no-new
            createClause.set(...setPropertiesNode, ...autogeneratedProperties);
            if (edgeProperties) {
                // TODO: modify CypherBuilder.Merge to support WithSet
                /*      const setPropertiesEdge = edgeProperties.map((property) => {
                    return [relationshipClause.property(property), edgeVar.property(property)];
                }) as CypherBuilder.SetParam[]; */
            }

            const subQueryStatements = [
                blockWith,
                createUnwindClause,
                withCreate,
                createClause,
                mergeClause,
            ] as CypherBuilder.Clause[];
            const relationshipValidationClause = new CypherBuilder.RawCypher((env: CypherBuilder.Environment) => {
                const str = createRelationshipValidationString({
                    node,
                    context,
                    varName: env.getVariableId(currentNode),
                });
                const cypher = [] as string[];
                if (str) {
                    cypher.push(`WITH ${env.getVariableId(currentNode)}`);
                    cypher.push(str);
                }
                return cypher.join("\n");
            });
            if (childrensVisitor) {
                subQueryStatements.push(childrensVisitor.done());
            }
            subQueryStatements.push(relationshipValidationClause);
            subQueryStatements.push(new CypherBuilder.Return(CypherBuilder.collect(new CypherBuilder.Literal(null))));
            const subQuery = CypherBuilder.concat(...subQueryStatements);
            const callClause = new CypherBuilder.Call(subQuery);
            const outsideWith = new CypherBuilder.With(parentVar, unwindVar);
            doneClause = CypherBuilder.concat(outsideWith, callClause);
            return doneClause;
        },
    };
}

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

function dispatch(treeDescriptor: TreeDescriptor, visitor: CreateVisitor) {
    visitor.visitProperties(treeDescriptor.properties);
    const subVisitor = visitor.getChildrensVisitor();
    Object.entries(treeDescriptor.childrens).forEach(([key, value]) => {
        subVisitor.visitKey(key);
        dispatch(value, subVisitor);
    });
    subVisitor.done();
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

    let connectionParams: any = {};

    const mutationResponse = resolveTree.fieldsByTypeName[node.mutationResponseTypeNames.create];

    const nodeProjection = Object.values(mutationResponse).find((field) => field.name === node.plural);
    const metaNames: string[] = [];

    const input = resolveTree.args.input as CreateInput | CreateInput[];
    const unwind = inputTreeToCypherMap(input, node, context);
    const treeDescriptor = Array.isArray(input)
        ? mergeTreeDescriptors(input.map((el: CreateInput) => getTreeDescriptor(el, node, context)))
        : getTreeDescriptor(input, node, context);
    const unwindVar = new CypherBuilder.Variable();
    const unwindQuery = new CypherBuilder.Unwind([unwind, unwindVar]);
    const createPhase = createVisitor(node, context, unwindVar);
    dispatch(treeDescriptor, createPhase);
    const createPhaseCypher = createPhase.done();
    const createUnwind = CypherBuilder.concat(unwindQuery, createPhaseCypher);
    const rootNodeVariable = createPhase.getNodeVariable();

    /* 
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
    }; */
    //const createStrs: string[] = [];
    let replacedProjectionParams: Record<string, unknown> = {};
    let projectionCypher: CypherBuilder.Expr | undefined;
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

        projectionCypher = new CypherBuilder.RawCypher((env: CypherBuilder.Environment) => {
            return `${rootNodeVariable.getCypher(env)} ${projection.projection
                // First look to see if projection param is being reassigned
                // e.g. in an apoc.cypher.runFirstColumn function call used in createProjection->connectionField
                .replace(/REPLACE_ME(?=\w+: \$REPLACE_ME)/g, "projection")
                .replace(/\$REPLACE_ME/g, "$projection")
                .replace(/REPLACE_ME/g, `${rootNodeVariable.getCypher(env)}`)}`;
        });

        /*      TODO: AUTH
        authCalls = createStrs
            .map((_, i) => projAuth.replace(/\$REPLACE_ME/g, "$projection").replace(/REPLACE_ME/g, `this${i}`))
            .join("\n"); */

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
        ? new CypherBuilder.RawCypher((env: CypherBuilder.Environment) => {
              return connectionStrs
                  .map((connectionStr) => connectionStr.replace(/REPLACE_ME/g, `${rootNodeVariable.getCypher(env)}`))
                  .join("\n");
          })
        : undefined;

    const replacedInterfaceStrs = interfaceStrs.length
        ? new CypherBuilder.RawCypher((env: CypherBuilder.Environment) => {
              return interfaceStrs
                  .map((interfaceStr) => interfaceStr.replace(/REPLACE_ME/g, `${rootNodeVariable.getCypher(env)}`))
                  .join("\n");
          })
        : undefined;

    // TODO: support it
    /*     const replacedConnectionParams = connectionParams
        ? createStrs.reduce((res1, _, i) => {
              return {
                  ...res1,
                  ...Object.entries(connectionParams).reduce((res2, [key, value]) => {
                      return { ...res2, [key.replace("REPLACE_ME", `this${i}`)]: value };
                  }, {}),
              };
          }, {})

        : {}; */

    /*     const replacedInterfaceParams = interfaceParams
        ? createStrs.reduce((res1, _, i) => {
              return {
                  ...res1,
                  ...Object.entries(interfaceParams).reduce((res2, [key, value]) => {
                      return { ...res2, [key.replace("REPLACE_ME", `this${i}`)]: value };
                  }, {}),
              };
          }, {})
        : {}; */

    const returnStatement = generateCreateReturnStatementCypher(projectionCypher, context.subscriptionsEnabled);
    const projectionWithStr = context.subscriptionsEnabled ? `WITH ${projectionWith.join(", ")}` : "";

    const createQuery = new CypherBuilder.RawCypher((env) => {
        const projectionSubqueryStr = compileCypherIfExists(projectionSubquery, env);
        const projectionConnectionStrs = compileCypherIfExists(replacedConnectionStrs, env);
        const projectionInterfaceStrs = compileCypherIfExists(replacedInterfaceStrs, env);
        // TODO: avoid REPLACE_ME

        const replacedProjectionSubqueryStrs = projectionSubqueryStr
            .replace(/REPLACE_ME(?=\w+: \$REPLACE_ME)/g, "projection")
            .replace(/\$REPLACE_ME/g, "$projection")
            .replace(/REPLACE_ME/g, `${rootNodeVariable.getCypher(env)}`);

        const cypher = filterTruthy([
            createUnwind.getCypher(env),
            projectionWithStr,
            authCalls,
            projectionConnectionStrs,
            projectionInterfaceStrs,
            replacedProjectionSubqueryStrs,
            returnStatement.getCypher(env),
        ])
            .filter(Boolean)
            .join("\n");

        return [
            cypher,
            {
                ...replacedProjectionParams,
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
function generateCreateReturnStatementCypher(
    projection: CypherBuilder.Expr | undefined,
    subscriptionsEnabled: boolean
): CypherBuilder.Expr {
    return new CypherBuilder.RawCypher((env: CypherBuilder.Environment) => {
        const statements: string[] = [];

        if (projection) {
            statements.push(`collect(${projection.getCypher(env)}) AS data`);
        }

        if (subscriptionsEnabled) {
            statements.push(META_CYPHER_VARIABLE);
        }

        if (statements.length === 0) {
            statements.push("'Query cannot conclude with CALL'");
        }

        return `RETURN ${statements.join(", ")}`;
    });
}

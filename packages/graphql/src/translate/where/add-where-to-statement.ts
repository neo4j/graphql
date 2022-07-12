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

import type { GraphQLWhereArg, Context, RelationField, ConnectionField, PointField, PrimitiveField } from "../../types";
import type { Node, Relationship } from "../../classes";
import mapToDbProperty from "../../utils/map-to-db-property";
import * as CypherBuilder from "../cypher-builder/CypherBuilder";
import { getListPredicate, whereRegEx, WhereRegexGroups } from "./utils";
import createAggregateWhereAndParams from "../create-aggregate-where-and-params";
import createConnectionWhereAndParams from "./create-connection-where-and-params";
import { listPredicateToSizeFunction } from "./list-predicate-to-size-function";
import { filterTruthy } from "../../utils/utils";

type WhereMatchStatement = CypherBuilder.Match<any> | CypherBuilder.db.FullTextQueryNodes;
// type WhereMatchStatement = CypherBuilder.Match<any> | CypherBuilder.db.FullTextQueryNodes;

export function addWhereToStatement<Q extends WhereMatchStatement>({
    targetElement,
    matchStatement,
    whereInput,
    context,
    node,
}: {
    matchStatement: Q;
    targetElement: CypherBuilder.Node;
    whereInput: GraphQLWhereArg;
    context: Context;
    node: Node;
}): Q {
    const mappedProperties = mapPropertiesToOperators({
        whereInput,
        targetElement,
        node,
        context,
    });

    const defaultAndOperation = CypherBuilder.and(...mappedProperties);
    if (defaultAndOperation) {
        matchStatement.where(defaultAndOperation);
    }

    return matchStatement;
}

function mapPropertiesToOperators({
    whereInput,
    node,
    targetElement,
    context,
}: {
    whereInput: GraphQLWhereArg;
    node: Node;
    targetElement: CypherBuilder.Node | CypherBuilder.Variable;
    context: Context;
}): Array<CypherBuilder.ComparisonOp | CypherBuilder.BooleanOp | CypherBuilder.RawCypher | CypherBuilder.Exists> {
    const whereFields = Object.entries(whereInput);

    return filterTruthy(
        whereFields.map(
            ([key, value]):
                | CypherBuilder.ComparisonOp
                | CypherBuilder.BooleanOp
                | CypherBuilder.RawCypher
                | CypherBuilder.Exists
                | undefined => {
                if (key === "OR") {
                    const nested = value
                        .map((v) => {
                            return mapPropertiesToOperators({ whereInput: v, node, targetElement, context });
                        })
                        .flat();

                    return CypherBuilder.or(...nested);
                }
                if (key === "AND") {
                    const nested = value
                        .map((v) => {
                            return mapPropertiesToOperators({ whereInput: v, node, targetElement, context });
                        })
                        .flat();

                    return CypherBuilder.and(...nested);
                }
                const fieldOperation = createComparisonOnProperty({ key, value, node, targetElement, context });

                return fieldOperation;
            }
        )
    );
}

function createComparisonOnProperty({
    key,
    value,
    node,
    targetElement,
    context,
}: {
    key: string;
    value: any;
    node: Node;
    targetElement: CypherBuilder.Variable;
    context: Context;
}): CypherBuilder.ComparisonOp | CypherBuilder.BooleanOp | CypherBuilder.RawCypher | CypherBuilder.Exists | undefined {
    const match = whereRegEx.exec(key);

    const { prefix, fieldName, isAggregate, operator } = match?.groups as WhereRegexGroups;
    const isNot = operator?.startsWith("NOT") ?? false;
    const coalesceValue = [...node.primitiveFields, ...node.temporalFields, ...node.enumFields].find(
        (f) => fieldName === f.fieldName
    )?.coalesceValue as string | undefined;

    let dbFieldName = mapToDbProperty(node, fieldName);
    if (prefix) {
        dbFieldName = `${prefix}${dbFieldName}`;
    }
    // TODO: fix global id
    if (node.isGlobalNode && key === "id") {
        const { field, id } = node.fromGlobalId(value as string);
        // get the dbField from the returned property fieldName
        const idDbFieldName = mapToDbProperty(node, field);
        let idProperty = targetElement.property(idDbFieldName) as CypherBuilder.PropertyRef | CypherBuilder.Function;
        if (coalesceValue) {
            // TODO: improve
            console.log(coalesceValue);
            idProperty = CypherBuilder.coalesce(
                idProperty as CypherBuilder.PropertyRef,
                new CypherBuilder.Literal(coalesceValue)
            );
        }
        return CypherBuilder.eq(idProperty, new CypherBuilder.Param(id));
    }

    let propertyRef: CypherBuilder.PropertyRef | CypherBuilder.Function = targetElement.property(dbFieldName);
    if (coalesceValue) {
        propertyRef = CypherBuilder.coalesce(
            propertyRef as CypherBuilder.PropertyRef,
            new CypherBuilder.Literal(coalesceValue)
        );
    }

    const relationField = node.relationFields.find((x) => x.fieldName === fieldName);

    if (isAggregate) {
        if (!relationField) throw new Error("Aggregate filters must be on relationship fields");

        const nestedAggregate = createAggregateProperty({
            relationField,
            context,
            value,
            parentNode: targetElement as CypherBuilder.Node,
        });

        return nestedAggregate;
    }

    if (relationField) {
        // Relation
        return createRelationProperty({
            relationField,
            context,
            parentNode: targetElement as CypherBuilder.Node,
            operator,
            value,
            isNot,
        });
    }

    const connectionField = node.connectionFields.find((x) => x.fieldName === fieldName);
    if (connectionField) {
        return createConnectionProperty({
            value,
            connectionField,
            context,
            parentNode: targetElement as CypherBuilder.Node,
            operator,
        });
    }

    if (value === null) {
        if (isNot) {
            return CypherBuilder.isNotNull(propertyRef);
        }
        return CypherBuilder.isNull(propertyRef);
    }
    const pointField = node.pointFields.find((x) => x.fieldName === fieldName);
    if (pointField) {
        return createPointComparison({
            propertyRefOrCoalesce: propertyRef,
            param: new CypherBuilder.Param(value),
            operator,
            pointField,
        });
    }
    const durationField = node.primitiveFields.find((x) => x.fieldName === fieldName && x.typeMeta.name === "Duration");

    return createPrimitiveComparison({
        propertyRefOrCoalesce: propertyRef,
        param: new CypherBuilder.Param(value),
        operator,
        durationField,
    });
}

function createPointComparison({
    operator,
    propertyRefOrCoalesce,
    param,
    pointField,
}: {
    operator: string | undefined;
    propertyRefOrCoalesce: CypherBuilder.PropertyRef | CypherBuilder.Function;
    param: CypherBuilder.Param;
    pointField: PointField;
}): CypherBuilder.ComparisonOp | CypherBuilder.BooleanOp {
    const comprehensionVar = new CypherBuilder.Variable();
    const mapPoint = CypherBuilder.point(comprehensionVar);
    const pointList = new CypherBuilder.ListComprehension(comprehensionVar, param, undefined, mapPoint);

    const nestedPointRef = param.property("point");
    const pointDistance: CypherBuilder.Function = CypherBuilder.distance(
        propertyRefOrCoalesce,
        CypherBuilder.point(nestedPointRef)
    );
    const distanceRef = param.property("distance");
    const paramPoint = CypherBuilder.point(param);

    if (operator) {
        switch (operator) {
            case "LT":
                return CypherBuilder.lt(pointDistance, distanceRef);
            case "LTE":
                return CypherBuilder.lte(pointDistance, distanceRef);
            case "GT":
                return CypherBuilder.gt(pointDistance, distanceRef);
            case "GTE":
                return CypherBuilder.gte(pointDistance, distanceRef);
            case "DISTANCE":
                return CypherBuilder.eq(pointDistance, distanceRef);
            case "NOT": // TODO: handle not after this
                if (pointField?.typeMeta.array) {
                    return CypherBuilder.not(CypherBuilder.eq(propertyRefOrCoalesce, pointList));
                }

                return CypherBuilder.not(CypherBuilder.eq(propertyRefOrCoalesce, paramPoint));
            case "IN":
                return CypherBuilder.in(propertyRefOrCoalesce, pointList);
            case "NOT_IN":
                return CypherBuilder.not(CypherBuilder.in(propertyRefOrCoalesce, pointList));
            case "INCLUDES":
                return CypherBuilder.in(paramPoint, propertyRefOrCoalesce);
            case "NOT_INCLUDES":
                return CypherBuilder.not(CypherBuilder.in(paramPoint, propertyRefOrCoalesce));
            default:
                throw new Error(`Invalid operator ${operator}`);
        }
    }

    if (pointField?.typeMeta.array) {
        return CypherBuilder.eq(propertyRefOrCoalesce, pointList);
    }

    return CypherBuilder.eq(propertyRefOrCoalesce, paramPoint);
}

function createPrimitiveComparison({
    operator,
    propertyRefOrCoalesce,
    param,
    durationField,
}: {
    operator: string | undefined;
    propertyRefOrCoalesce: CypherBuilder.PropertyRef | CypherBuilder.Function;
    param: CypherBuilder.Param;
    durationField: PrimitiveField | undefined;
}): CypherBuilder.ComparisonOp | CypherBuilder.BooleanOp {
    let variable: CypherBuilder.Variable | CypherBuilder.Operation = param;
    let propertyRef: CypherBuilder.PropertyRef | CypherBuilder.Function | CypherBuilder.Operation =
        propertyRefOrCoalesce;
    // Comparison operations requires adding dates to durations
    // See https://neo4j.com/developer/cypher/dates-datetimes-durations/#comparing-filtering-values
    if (durationField && operator) {
        variable = CypherBuilder.plus(CypherBuilder.datetime(), variable);
        propertyRef = CypherBuilder.plus(CypherBuilder.datetime(), propertyRefOrCoalesce);
    }

    if (operator) {
        switch (operator) {
            case "LT":
                return CypherBuilder.lt(propertyRef, variable);
            case "LTE":
                return CypherBuilder.lte(propertyRef, variable);
            case "GT":
                return CypherBuilder.gt(propertyRef, variable);
            case "GTE":
                return CypherBuilder.gte(propertyRef, variable);
            case "NOT":
                return CypherBuilder.not(CypherBuilder.eq(propertyRef, variable));
            case "ENDS_WITH":
                return CypherBuilder.endsWith(propertyRef, variable);
            case "NOT_ENDS_WITH":
                return CypherBuilder.not(CypherBuilder.endsWith(propertyRef, variable));
            case "STARTS_WITH":
                return CypherBuilder.startsWith(propertyRef, variable);
            case "NOT_STARTS_WITH":
                return CypherBuilder.not(CypherBuilder.startsWith(propertyRef, variable));
            case "MATCHES":
                return CypherBuilder.matches(propertyRef, variable);
            case "CONTAINS":
                return CypherBuilder.contains(propertyRef, variable);
            case "NOT_CONTAINS":
                return CypherBuilder.not(CypherBuilder.contains(propertyRef, variable));
            case "IN":
                return CypherBuilder.in(propertyRef, variable);
            case "NOT_IN":
                return CypherBuilder.not(CypherBuilder.in(propertyRef, variable));
            case "INCLUDES":
                return CypherBuilder.in(variable, propertyRef);
            case "NOT_INCLUDES":
                return CypherBuilder.not(CypherBuilder.in(variable, propertyRef));
            default:
                throw new Error(`Invalid operator ${operator}`);
        }
    }

    return CypherBuilder.eq(propertyRef, variable);
}

function createRelationProperty({
    relationField,
    context,
    parentNode,
    operator,
    value,
    isNot,
}: {
    relationField: RelationField;
    context: Context;
    parentNode: CypherBuilder.Node;
    operator: string | undefined;
    value: GraphQLWhereArg;
    isNot: boolean;
}): CypherBuilder.BooleanOp | CypherBuilder.Exists | CypherBuilder.RawCypher | undefined {
    const refNode = context.nodes.find((n) => n.name === relationField.typeMeta.name);
    if (!refNode) throw new Error("Relationship filters must reference nodes");

    const childNode = new CypherBuilder.Node({ labels: refNode.getLabels(context) });

    const relationship = new CypherBuilder.Relationship({
        source: relationField.direction === "IN" ? childNode : parentNode,
        target: relationField.direction === "IN" ? parentNode : childNode,
        type: relationField.type,
    });

    const matchPattern = new CypherBuilder.Pattern(relationship, {
        source: relationField.direction === "IN" ? { variable: true } : { labels: false },
        target: relationField.direction === "IN" ? { labels: false } : { variable: true },
        relationship: { variable: false },
    });

    const existsSubquery = new CypherBuilder.Match(matchPattern, {});
    const exists = new CypherBuilder.Exists(existsSubquery);

    if (value === null) {
        if (!isNot) {
            // Bit confusing, but basically checking for not null is the same as checking for relationship exists
            return CypherBuilder.not(exists);
        }
        return exists;
    }

    // const subquery = new CypherBuilder.Query();

    const nestedOperators = mapPropertiesToOperators({
        whereInput: value,
        targetElement: childNode,
        node: refNode,
        context,
    });

    const relationOperator = CypherBuilder.and(...nestedOperators);

    if (!relationOperator) {
        return undefined;
    }

    switch (operator) {
        case "ALL": {
            const notProperties = CypherBuilder.not(relationOperator);

            existsSubquery.where(notProperties);
            return CypherBuilder.not(exists); // Not sure why the double not
        }
        case "NOT":
        case "NONE":
            existsSubquery.where(relationOperator);
            return CypherBuilder.not(exists);

        case "SINGLE": {
            existsSubquery.where(relationOperator);
            const sizeStatement = new CypherBuilder.RawCypher((env: CypherBuilder.Environment) => {
                const subqueryStr = existsSubquery.getCypher(env).replace("MATCH", ""); // THis should be part of list comprehension, match clause
                const str = `size([${subqueryStr} | 1]) = 1`; // TODO: change this into a patternComprehension
                return [str, {}];
            });
            return sizeStatement;
        }
        case "SOME":
            existsSubquery.where(relationOperator);
            return exists;
        default:
            break;
    }
    existsSubquery.where(relationOperator); // SAME AS SOME?
    return exists;
}

function createConnectionProperty({
    connectionField,
    value,
    context,
    parentNode,
    operator,
}: {
    connectionField: ConnectionField;
    value: any;
    context: Context;
    parentNode: CypherBuilder.Node;
    operator: string | undefined;
}): CypherBuilder.BooleanOp | CypherBuilder.RawCypher | undefined {
    let nodeEntries: Record<string, any>;

    if (!connectionField?.relationship.union) {
        nodeEntries = { [connectionField.relationship.typeMeta.name]: value };
    } else {
        nodeEntries = value;
    }

    const operations = Object.entries(nodeEntries).map((entry) => {
        const refNode = context.nodes.find((x) => x.name === entry[0]) as Node;

        const relationField = connectionField.relationship;

        const childNode = new CypherBuilder.Node({ labels: refNode.getLabels(context) });
        const relationship = new CypherBuilder.Relationship({
            source: relationField.direction === "IN" ? childNode : parentNode,
            target: relationField.direction === "IN" ? parentNode : childNode,
            type: relationField.type,
        });

        const matchPattern = new CypherBuilder.Pattern(relationship, {
            source: relationField.direction === "IN" ? { variable: true } : { labels: false },
            target: relationField.direction === "IN" ? { labels: false } : { variable: true },
            relationship: { variable: true },
        });

        const listPredicateStr = getListPredicate(operator as any);
        const rawWhereQuery = new CypherBuilder.RawCypher((env: CypherBuilder.Environment) => {
            const contextRelationship = context.relationships.find(
                (x) => x.name === connectionField.relationshipTypeName
            ) as Relationship;
            // const collectedMapId = cypherContext.getVariableId(projectionVariable);

            const prefix = `nestedParam${env.getParamsSize()}`; // Generates unique name for nested reference
            const result = createConnectionWhereAndParams({
                whereInput: entry[1] as any,
                context,
                node: refNode,
                nodeVariable: env.getVariableId(childNode),
                relationship: contextRelationship,
                relationshipVariable: env.getVariableId(relationship),
                parameterPrefix: prefix,
                listPredicates: [listPredicateStr],
            });
            return [result[0], { [prefix]: result[1] }];
        });

        const subquery = new CypherBuilder.RawCypher((env: CypherBuilder.Environment) => {
            const patternStr = matchPattern.getCypher(env);
            const whereStr = rawWhereQuery.getCypher(env);
            const clause = listPredicateToSizeFunction(listPredicateStr, patternStr, whereStr);
            return [clause, {}];
        });

        return subquery;
    });

    return CypherBuilder.and(...operations) as CypherBuilder.BooleanOp | undefined;
}

function createAggregateProperty({
    relationField,
    context,
    value,
    parentNode,
}: {
    relationField: RelationField;
    context: Context;
    value: any;
    parentNode: CypherBuilder.Node;
}): CypherBuilder.RawCypher {
    const refNode = context.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;
    const relationship = context.relationships.find((x) => x.properties === relationField.properties) as Relationship;

    const aggregateStatement = new CypherBuilder.RawCypher((env: CypherBuilder.Environment) => {
        const varName = env.getVariableId(parentNode);

        const aggregateWhereAndParams = createAggregateWhereAndParams({
            node: refNode,
            chainStr: "aggr",
            context,
            field: relationField,
            varName,
            aggregation: value,
            relationship,
        });

        return aggregateWhereAndParams;
    });

    return aggregateStatement;
}

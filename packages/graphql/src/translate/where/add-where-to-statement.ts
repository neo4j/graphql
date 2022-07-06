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

import { GraphQLWhereArg, Context, RelationField, ConnectionField } from "../../types";
import { Node, Relationship } from "../../classes";
import mapToDbProperty from "../../utils/map-to-db-property";
import * as CypherBuilder from "../cypher-builder/CypherBuilder";
import { MatchableElement } from "../cypher-builder/MatchPattern";
import { WhereOperator } from "../cypher-builder/statements/where-operators";
import { getListPredicate, whereRegEx, WhereRegexGroups } from "./utils";
import { PredicateFunction } from "../cypher-builder/statements/predicate-functions";
import createAggregateWhereAndParams from "../create-aggregate-where-and-params";
import { WhereInput } from "../cypher-builder/statements/Where";
import { ScalarFunction } from "../cypher-builder/statements/scalar-functions";
import createWhereClause from "./create-where-clause";
import createConnectionWhereAndParams from "./create-connection-where-and-params";
import { filterTruthy } from "../../utils/utils";
import { listPredicateToSizeFunction } from "./list-predicate-to-size-function";

type WhereMatchStatement = CypherBuilder.Match<any> | CypherBuilder.db.FullTextQueryNodes;

export function addWhereToStatement<T extends MatchableElement, Q extends WhereMatchStatement>({
    targetElement,
    matchStatement,
    whereInput,
    context,
    node,
}: {
    matchStatement: Q;
    targetElement: T;
    whereInput: GraphQLWhereArg;
    context: Context;
    node: Node;
}): Q {
    const mappedProperties = mapAllProperties({
        whereInput,
        targetElement,
        node,
        context,
    });

    matchStatement.where(...mappedProperties);

    return matchStatement;
}

function mapAllProperties({
    whereInput,
    node,
    targetElement,
    context,
}: {
    whereInput: Record<string, any>;
    node: Node;
    targetElement: MatchableElement | CypherBuilder.Variable;
    context: Context;
}): WhereInput {
    const resultArray: WhereInput = [];
    const whereFields = Object.entries(whereInput);

    const leafProperties = whereFields.filter(([key, value]) => key !== "OR" && key !== "AND");
    if (leafProperties.length > 0) {
        const mappedProperties = mapLeafProperties({ properties: leafProperties, node, targetElement, context });

        resultArray.push(...mappedProperties);
    }

    for (const [key, value] of whereFields) {
        if (key === "OR" || key === "AND") {
            // value is an array
            const nestedResult: any[] = [];
            for (const nestedValue of value) {
                const mapNested = mapAllProperties({ whereInput: nestedValue, node, targetElement, context });
                nestedResult.push(...mapNested);
            }

            if (key === "OR") {
                const orOperation = CypherBuilder.or(...nestedResult);
                resultArray.push(orOperation);
            }
            if (key === "AND") {
                const andOperation = CypherBuilder.and(...nestedResult);
                resultArray.push(andOperation);
            }
        }
    }

    return resultArray;
}
function mapLeafProperties({
    properties,
    node,
    targetElement,
    context,
}: {
    properties: Array<[string, any]>;
    node: Node;
    targetElement: MatchableElement | CypherBuilder.Variable;
    context: Context;
}): WhereInput {
    const propertiesMappedToWhere = properties.map(([key, value]): WhereInput[0] | undefined => {
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

        let targetElementOrCoalesce: MatchableElement | CypherBuilder.Variable | ScalarFunction = targetElement;
        if (coalesceValue) {
            targetElementOrCoalesce = CypherBuilder.coalesce(targetElement, dbFieldName, coalesceValue);
        }

        if (node.isGlobalNode && key === "id") {
            const { field, id } = node.fromGlobalId(value as string);

            // get the dbField from the returned property fieldName
            const idDbFieldName = mapToDbProperty(node, field);
            return [targetElementOrCoalesce, { [idDbFieldName]: new CypherBuilder.Param(id) }];
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

        const pointField = node.pointFields.find((x) => x.fieldName === fieldName);
        const durationField = node.primitiveFields.find(
            (x) => x.fieldName === fieldName && x.typeMeta.name === "Duration"
        );

        return new CypherBuilder.RawCypherWithCallback((cypherContext: CypherBuilder.CypherContext) => {
            let property: string;
            if (targetElementOrCoalesce instanceof ScalarFunction) {
                property = targetElementOrCoalesce.getCypher(cypherContext);
            } else {
                const varId = cypherContext.getVariableId(targetElementOrCoalesce);
                property = `${varId}.${dbFieldName}`;
            }
            if (value === null) {
                const isNullStr = `${property} ${isNot ? "IS NOT" : "IS"} NULL`;
                return [isNullStr, {}];
            }

            const param = new CypherBuilder.Param(value);

            const paramId = cypherContext.getParamId(param);

            const whereStr = createWhereClause({
                property,
                param: paramId,
                operator,
                isNot,
                durationField,
                pointField,
            });

            return [whereStr, {}];
        });
    });

    return filterTruthy(propertiesMappedToWhere);
}

/** TODO: substitute rawCypherBuilder with this */
function createPrimitiveProperty({
    targetElement,
    operator,
    dbFieldName,
    value,
    coalesceValue,
}: {
    targetElement: MatchableElement | CypherBuilder.Variable;
    operator: string | undefined;
    dbFieldName: string;
    value: any;
    coalesceValue: string | undefined;
}): WhereInput[0] {
    const param = new CypherBuilder.Param(value);

    let targetElementOrCoalesce: MatchableElement | CypherBuilder.Variable | ScalarFunction = targetElement;
    if (coalesceValue) {
        targetElementOrCoalesce = CypherBuilder.coalesce(targetElement, dbFieldName, coalesceValue);
    }

    if (operator) {
        let whereClause: CypherBuilder.WhereClause;
        switch (operator) {
            case "LT":
                whereClause = CypherBuilder.lt(param);
                break;
            case "LTE":
                whereClause = CypherBuilder.lte(param);
                break;
            case "GT":
                whereClause = CypherBuilder.gt(param);
                break;
            case "GTE":
                whereClause = CypherBuilder.gte(param);
                break;
            case "NOT":
                return CypherBuilder.not([targetElementOrCoalesce, { [dbFieldName]: param }]);
            case "ENDS_WITH":
                whereClause = CypherBuilder.endsWith(param);
                break;
            case "NOT_ENDS_WITH":
                return CypherBuilder.not([targetElementOrCoalesce, { [dbFieldName]: CypherBuilder.endsWith(param) }]);
            case "STARTS_WITH":
                whereClause = CypherBuilder.startsWith(param);
                break;
            case "NOT_STARTS_WITH":
                return CypherBuilder.not([targetElementOrCoalesce, { [dbFieldName]: CypherBuilder.startsWith(param) }]);
            case "MATCHES":
                whereClause = CypherBuilder.match(param);
                break;
            case "CONTAINS":
                whereClause = CypherBuilder.contains(param);
                break;
            case "NOT_CONTAINS":
                return CypherBuilder.not([targetElementOrCoalesce, { [dbFieldName]: CypherBuilder.contains(param) }]);
            case "IN":
                whereClause = CypherBuilder.in(param);
                break;
            case "NOT_IN":
                return CypherBuilder.not([targetElementOrCoalesce, { [dbFieldName]: CypherBuilder.in(param) }]);
            case "INCLUDES":
            case "NOT_INCLUDES":
                throw new Error("INCLUDES Not implemented");
            default:
                throw new Error(`Invalid operator ${operator}`);
        }

        // TODO: should handle not
        return [targetElementOrCoalesce, { [dbFieldName]: whereClause }];
    }
    return [targetElementOrCoalesce, { [dbFieldName]: param }];
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
}): WhereOperator | PredicateFunction | undefined {
    const refNode = context.nodes.find((n) => n.name === relationField.typeMeta.name);
    if (!refNode) throw new Error("Relationship filters must reference nodes");

    const childNode = new CypherBuilder.Node({ labels: refNode.getLabels(context) });

    const relationship = new CypherBuilder.Relationship({
        source: relationField.direction === "IN" ? childNode : parentNode,
        target: relationField.direction === "IN" ? parentNode : childNode,
        type: relationField.type,
    });

    const matchPattern = new CypherBuilder.MatchPattern(relationship, {
        source: relationField.direction === "IN" ? { variable: true } : { labels: false },
        target: relationField.direction === "IN" ? { labels: false } : { variable: true },
        relationship: { variable: false },
    });
    const exists = new CypherBuilder.Exists(matchPattern);

    if (value === null) {
        if (!isNot) {
            // Bit confusing, but basically checking for not null is the same as checking for relationship exists
            return CypherBuilder.not(exists);
        }
        return exists;
    }

    const subquery = new CypherBuilder.Query();

    const mappedProperties = mapAllProperties({
        whereInput: value,
        targetElement: childNode,
        node: refNode,
        context,
    });

    if (mappedProperties.length === 0) {
        return undefined;
    }

    switch (operator) {
        case "ALL": {
            const notProperties = CypherBuilder.not(CypherBuilder.and(...mappedProperties));

            subquery.where(notProperties);
            exists.concat(subquery);
            return CypherBuilder.not(exists);
        }
        case "NOT":
        case "NONE":
            subquery.where(...mappedProperties);
            exists.concat(subquery);

            return CypherBuilder.not(exists);

        case "SINGLE": {
            subquery.where(...mappedProperties);
            const sizeStatement = new CypherBuilder.RawCypherWithCallback(
                (cypherContext: CypherBuilder.CypherContext, childrenCypher: string) => {
                    const matchPatternStr = matchPattern.getCypher(cypherContext);
                    const str = `size([${matchPatternStr} ${childrenCypher} | 1]) = 1`;
                    return [str, {}];
                }
            );
            sizeStatement.concat(subquery);

            return sizeStatement;
        }
        case "SOME":
            subquery.where(...mappedProperties);
            exists.concat(subquery);
            return exists;
        default:
            break;
    }
    subquery.where(...mappedProperties);
    exists.concat(subquery);
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
}): WhereOperator {
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

        const matchPattern = new CypherBuilder.MatchPattern(relationship, {
            source: relationField.direction === "IN" ? { variable: true } : { labels: false },
            target: relationField.direction === "IN" ? { labels: false } : { variable: true },
            relationship: { variable: true },
        });

        const listPredicateStr = getListPredicate(operator as any);
        const rawWhereQuery = new CypherBuilder.RawCypherWithCallback((cypherContext: CypherBuilder.CypherContext) => {
            const contextRelationship = context.relationships.find(
                (x) => x.name === connectionField.relationshipTypeName
            ) as Relationship;
            // const collectedMapId = cypherContext.getVariableId(projectionVariable);

            const prefix = `nestedParam${cypherContext.getParamsSize()}`; // Generates unique name for nested reference
            const result = createConnectionWhereAndParams({
                whereInput: entry[1] as any,
                context,
                node: refNode,
                nodeVariable: cypherContext.getVariableId(childNode),
                relationship: contextRelationship,
                relationshipVariable: cypherContext.getVariableId(relationship),
                parameterPrefix: prefix,
                listPredicates: [listPredicateStr],
            });
            return [result[0], { [prefix]: result[1] }];
        });

        const subquery = new CypherBuilder.RawCypherWithCallback(
            (cypherContext: CypherBuilder.CypherContext, children: string) => {
                const patternStr = matchPattern.getCypher(cypherContext);
                const clause = listPredicateToSizeFunction(listPredicateStr, patternStr, children);
                return [clause, {}];
            }
        );
        subquery.concat(rawWhereQuery);

        return subquery;
    });

    return CypherBuilder.and(...operations);
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
}): CypherBuilder.RawCypherWithCallback {
    const refNode = context.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;
    const relationship = context.relationships.find((x) => x.properties === relationField.properties) as Relationship;

    const aggregateStatement = new CypherBuilder.RawCypherWithCallback((cypherContext: CypherBuilder.CypherContext) => {
        const varName = cypherContext.getVariableId(parentNode);

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

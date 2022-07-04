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
import { getListPredicate, whereRegEx, whereRegExWithoutNot, WhereRegexGroups } from "./utils";
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
        const mappedProperties = mapProperties({ properties: leafProperties, node, targetElement, context });

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
function mapProperties({
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

        let expression1: ScalarFunction | CypherBuilder.Expression;
        if (targetElementOrCoalesce instanceof ScalarFunction) {
            expression1 = targetElementOrCoalesce;
        } else {
            expression1 = new CypherBuilder.PropertyExpression(targetElementOrCoalesce, dbFieldName);
        }
        let expression2: ScalarFunction | CypherBuilder.Expression;
        if (value === null) {
            // this is needed to avoid to pass a parameter with NULL as value
            expression2 = new CypherBuilder.LiteralExpression(value);
        } else {
            const param = new CypherBuilder.Param(value);
            expression2 = new CypherBuilder.ParamExpression(param);
        }
        const pointField = node.pointFields.find((x) => x.fieldName === fieldName);
        const durationField = node.primitiveFields.find(
            (x) => x.fieldName === fieldName && x.typeMeta.name === "Duration"
        );
        const stringField = node.primitiveFields.find(
            (x) => x.fieldName === fieldName && (x.typeMeta.name === "String" || x.typeMeta.name === "ID")
        );
        const numberField = node.primitiveFields.find(
            (x) => x.fieldName === fieldName && (x.typeMeta.name === "Int" || x.typeMeta.name === "Float" || x.typeMeta.name === "BigInt")
        );
        const enumFields = node.enumFields.find(
            (x) => x.fieldName === fieldName
        )

        if (pointField) {
            // Method reference?
            let pointComparatorMethod: keyof CypherBuilder.NumericalComparator | CypherBuilder.ListComparator;
            switch (operator) {
                case "LT":
                case "LTE":
                case "GT":
                case "GTE":
                    pointComparatorMethod = operator.toLocaleLowerCase() as keyof CypherBuilder.NumericalComparator | CypherBuilder.ListComparator ;
                    break;
                case "IN":
                case "INCLUDES":
                    pointComparatorMethod = operator.toLocaleLowerCase() as keyof CypherBuilder.NumericalComparator | CypherBuilder.ListComparator;
                    break;
                case "NOT_INCLUDES":
                    pointComparatorMethod = "includes" as keyof CypherBuilder.NumericalComparator | CypherBuilder.ListComparator;
                    break;
                case "NOT_IN": 
                    pointComparatorMethod = "in" as keyof CypherBuilder.NumericalComparator | CypherBuilder.ListComparator;
                    break;
                default:
                    pointComparatorMethod = "eq" as keyof CypherBuilder.NumericalComparator | CypherBuilder.ListComparator;
            }
            if (isNot) {
                return  CypherBuilder.not(new CypherBuilder.PointComparatorAST(expression1, expression2, pointComparatorMethod, Boolean(pointField.typeMeta.array)))
            }
            return new CypherBuilder.PointComparatorAST(expression1, expression2, pointComparatorMethod, Boolean(pointField.typeMeta.array));
        }
        if (durationField) {
            let durationComparatorOperation: keyof CypherBuilder.NumericalComparator;
            switch (operator) {
                case "LT":
                case "LTE":
                case "GT":
                case "GTE":
                    durationComparatorOperation = operator.toLocaleLowerCase() as keyof CypherBuilder.NumericalComparator;
                    break;
                default:
                    durationComparatorOperation = "eq" as keyof CypherBuilder.NumericalComparator;
            }
            return new CypherBuilder.DurationComparatorAST(expression1, expression2, durationComparatorOperation)
        }
        if (stringField || enumFields) {
            let stringComparatorOperation: keyof CypherBuilder.StrComparator | CypherBuilder.ListComparator;
            switch (operator) {
                case "NOT_ENDS_WITH":
                case "ENDS_WITH":
                    stringComparatorOperation = "endsWith"as keyof CypherBuilder.StrComparator | CypherBuilder.ListComparator;
                    break;
                case "NOT_STARTS_WITH":
                case "STARTS_WITH":
                    stringComparatorOperation = "startsWith" as keyof CypherBuilder.StrComparator | CypherBuilder.ListComparator;
                    break;
                case "NOT_CONTAINS":
                case "CONTAINS":
                    stringComparatorOperation = "contains" as keyof CypherBuilder.StrComparator | CypherBuilder.ListComparator;
                    break;
                case "NOT_IN":
                case "IN":
                    stringComparatorOperation = "in" as keyof CypherBuilder.StrComparator | CypherBuilder.ListComparator;
                    break;
                case "MATCHES":
                    stringComparatorOperation = "matches" as keyof CypherBuilder.StrComparator | CypherBuilder.ListComparator;
                    break;
                default:
                    stringComparatorOperation = "eq" as keyof CypherBuilder.StrComparator | CypherBuilder.ListComparator;
            }
            if (isNot) {
                return CypherBuilder.not(new CypherBuilder.StringComparatorAST(expression1, expression2, stringComparatorOperation));
            }
            return new CypherBuilder.StringComparatorAST(expression1, expression2, stringComparatorOperation);
        }
        if (numberField) {
            let numericalComparatorOperation: keyof CypherBuilder.NumericalComparator | CypherBuilder.ListComparator;
            switch (operator) {
                case "LT":
                case "LTE":
                case "GT":
                case "GTE":
                case "IN":
                    numericalComparatorOperation = operator.toLocaleLowerCase() as keyof CypherBuilder.NumericalComparator | CypherBuilder.ListComparator;
                    break;
                case "NOT_IN":
                    numericalComparatorOperation = "in" as keyof CypherBuilder.NumericalComparator | CypherBuilder.ListComparator;
                    break;
                default:
                    numericalComparatorOperation = "eq" as keyof CypherBuilder.NumericalComparator;
            }
            if (isNot) {
                return CypherBuilder.not(new CypherBuilder.NumbericalComparatorAST(expression1, expression2, numericalComparatorOperation));
            }
            return new CypherBuilder.NumbericalComparatorAST(expression1, expression2, numericalComparatorOperation);
        }
        const temporalField = node.temporalFields.find(
            (x) => x.fieldName === fieldName && (x.typeMeta.name === "DateTime" || x.typeMeta.name === "Date" || x.typeMeta.name === "LocalDateTime" || x.typeMeta.name === "Time" || x.typeMeta.name === "LocalTime")
        )
        if (temporalField) {
            let temporalComparatorOperation: keyof CypherBuilder.NumericalComparator | CypherBuilder.ListComparator;
            switch (operator) {
                case "LT":
                case "LTE":
                case "GT":
                case "GTE":
                case "IN":
                    temporalComparatorOperation = operator.toLocaleLowerCase() as keyof CypherBuilder.NumericalComparator | CypherBuilder.ListComparator;
                    break;
                default:
                    temporalComparatorOperation = "eq" as keyof CypherBuilder.NumericalComparator;
            }
            if (isNot) {
                return CypherBuilder.not(new CypherBuilder.TemporalComparatorAST(expression1, expression2, temporalComparatorOperation));
            }
            return new CypherBuilder.TemporalComparatorAST(expression1, expression2, temporalComparatorOperation);
        }
        const booleanField = node.primitiveFields.find(
            (x) => x.fieldName === fieldName && x.typeMeta.name === "Boolean"
        )
        if (booleanField) {
            let booleanComparatorOperation: keyof CypherBuilder.EqualityComparator | CypherBuilder.ListComparator;
            switch (operator) {
                case "IN":
                case "INCLUDES":
                    booleanComparatorOperation = operator.toLocaleLowerCase() as keyof CypherBuilder.EqualityComparator | CypherBuilder.ListComparator;
                    break;
                default:
                    booleanComparatorOperation = "eq" as keyof CypherBuilder.EqualityComparator;
            }
            if (isNot) {
                return CypherBuilder.not(new CypherBuilder.BooleanComparatorAST(expression1, expression2, booleanComparatorOperation));
            }
            return new CypherBuilder.BooleanComparatorAST(expression1, expression2, booleanComparatorOperation);
        }
        throw new Error(`Not implemented ${node.primitiveFields.map(field => field.typeMeta.name).join(', ')}; operation: ${operator}`);
        
    });

    return filterTruthy(propertiesMappedToWhere);
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

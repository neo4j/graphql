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
import { whereRegEx, WhereRegexGroups } from "./utils";
import { PredicateFunction } from "../cypher-builder/statements/predicate-functions";
import createAggregateWhereAndParams from "../create-aggregate-where-and-params";
import { WhereInput } from "../cypher-builder/statements/Where";
import { ScalarFunction } from "../cypher-builder/statements/scalar-functions";

// type CypherPropertyValue =
//     | [MatchableElement | CypherBuilder.Variable, Record<string, CypherBuilder.Param | CypherBuilder.WhereClause>]
//     | WhereOperator
//     | PredicateFunction;

export function addWhereToStatement<T extends MatchableElement>({
    targetElement,
    matchStatement,
    whereInput,
    context,
    node,
}: {
    matchStatement: CypherBuilder.Match<T>;
    targetElement: T;
    whereInput: GraphQLWhereArg;
    context: Context;
    node: Node;
}): CypherBuilder.Match<T> {
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

        // resultArray.push([targetElement, mappedProperties]);
        resultArray.push(...mappedProperties);
    }

    // matchStatement.where([targetElement, mappedProperties]);

    // const operatorFields = whereFields.filter(([key, value]) => key === "OR");
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

    /* TO IMPLEMENT
        * coalesce
        * relay Connection Fields
        * Aggregate
        * Relationship fields

    */

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
    return properties.map(([key, value]) => {
        const match = whereRegEx.exec(key);

        const { fieldName, isAggregate, operator } = match?.groups as WhereRegexGroups;

        const isNot = operator?.startsWith("NOT") ?? false;
        const coalesceValue = [...node.primitiveFields, ...node.temporalFields, ...node.enumFields].find(
            (f) => fieldName === f.fieldName
        )?.coalesceValue as string | undefined;

        // TODO: deal with coalesce
        const dbFieldName = mapToDbProperty(node, fieldName);

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

        return createPrimitiveProperty({
            targetElement,
            operator,
            dbFieldName,
            value,
            coalesceValue,
        });
    });
}

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
            default:
                throw new Error(`Invalid operator ${operator}`);
        }
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
}): WhereOperator | PredicateFunction {
    const refNode = context.nodes.find((n) => n.name === relationField.typeMeta.name);
    if (!refNode) throw new Error("Relationship filters must reference nodes");

    const childNode = new CypherBuilder.Node({ labels: refNode.getLabels(context) });

    const relationship = new CypherBuilder.Relationship({
        source: relationField.direction === "IN" ? childNode : parentNode,
        target: relationField.direction === "IN" ? parentNode : childNode,
        type: relationField.type,
    });

    const matchPattern1 = new CypherBuilder.MatchPattern(relationship, {
        source: relationField.direction === "IN" ? { variable: false } : { labels: false },
        target: relationField.direction === "IN" ? { labels: false } : { variable: false },
        relationship: { variable: false },
    });
    const exists = CypherBuilder.exists(matchPattern1);

    const matchPattern2 = new CypherBuilder.MatchPattern(relationship, {
        source: relationField.direction === "IN" ? { variable: true } : { labels: false },
        target: relationField.direction === "IN" ? { labels: false } : { variable: true },
        relationship: { variable: false },
    });

    if (value === null) {
        if (!isNot) {
            // Bit confusing, but basically checking for not null is the same as checking for relationship exists
            return CypherBuilder.not(exists);
        }
        return exists;
    }

    const subquery = new CypherBuilder.Query();

    let listPredicate: PredicateFunction;
    switch (operator) {
        case "ALL":
            listPredicate = CypherBuilder.all(matchPattern2, childNode, subquery);
            break;
        case "NOT":
        case "NONE":
            listPredicate = CypherBuilder.none(matchPattern2, childNode, subquery);
            break;
        case "SINGLE":
            listPredicate = CypherBuilder.single(matchPattern2, childNode, subquery);
            break;
        case "SOME":
        default:
            listPredicate = CypherBuilder.any(matchPattern2, childNode, subquery);
            break;
    }

    const mappedProperties = mapAllProperties({
        whereInput: value,
        targetElement: childNode,
        node: refNode,
        context,
    });

    // TODO: improve this, shouldn't use a root query
    subquery.where(...mappedProperties);

    return CypherBuilder.and(exists, listPredicate); // NESTED WHERE HERE

    // ANY(this_genres IN [(this)-[:IN_GENRE]->(this_genres:Genre) | this_genres] WHERE this_genres.name = $this_genres_name)

    // if (value === null) {
    //     res.clauses.push(`${isNot ? "" : "NOT "}EXISTS((${varName})${inStr}${relTypeStr}${outStr}(${labels}))`);
    //     return res;
    // }

    // exists

    // let resultStr = [
    //     `EXISTS((${varName})${inStr}${relTypeStr}${outStr}(${labels}))`,
    //     `AND ${listPredicate}(${param} IN [(${varName})${inStr}${relTypeStr}${outStr}(${param}${labels}) | ${param}] INNER_WHERE `,
    // ].join(" ");

    // console.log(relationField);

    // TODO: predicates (NONE, ALL...)
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
        const relationshipContext = context.relationships.find(
            (x) => x.name === connectionField.relationshipTypeName
        ) as Relationship;

        const relationField = connectionField.relationship;
        //         if (value === null) {
        //             res.clauses.push(
        //                 `${isNot ? "" : "NOT "}EXISTS((${varName})${inStr}[:${
        //                     connectionField.relationship.type
        //                 }]${outStr}(${labels}))`
        //             );
        //             return;
        //         }

        const childNode = new CypherBuilder.Node({ labels: refNode.getLabels(context) });
        const relationship = new CypherBuilder.Relationship({
            source: relationField.direction === "IN" ? childNode : parentNode,
            target: relationField.direction === "IN" ? parentNode : childNode,
            type: relationField.type,
        });

        const matchPattern1 = new CypherBuilder.MatchPattern(relationship, {
            source: relationField.direction === "IN" ? { variable: false } : { labels: false },
            target: relationField.direction === "IN" ? { labels: false } : { variable: false },
            relationship: { variable: false },
        });
        const exists = CypherBuilder.exists(matchPattern1);

        const matchPattern2 = new CypherBuilder.MatchPattern(relationship, {
            source: relationField.direction === "IN" ? { variable: true } : { labels: false },
            target: relationField.direction === "IN" ? { labels: false } : { variable: true },
            relationship: { variable: true },
        });

        const subquery = new CypherBuilder.Query();

        // TODO: remove duplicate
        let listPredicate: PredicateFunction;
        const projectionVariable = new CypherBuilder.Variable({
            node: childNode,
            relationship,
        });

        switch (operator) {
            case "ALL":
                listPredicate = CypherBuilder.all(matchPattern2, projectionVariable, subquery);
                break;
            case "NOT":
            case "NONE":
                listPredicate = CypherBuilder.none(matchPattern2, projectionVariable, subquery);
                break;
            case "SINGLE":
                listPredicate = CypherBuilder.single(matchPattern2, projectionVariable, subquery);
                break;
            case "SOME":
            default:
                listPredicate = CypherBuilder.any(matchPattern2, projectionVariable, subquery);
                break;
        }

        const mappedProperties = mapConnectionProperties({
            whereInput: value,
            targetVariable: projectionVariable,
            node: refNode,
            context,
        });

        // TODO: improve this, shouldn't use a root query
        subquery.where(...mappedProperties);

        return CypherBuilder.and(exists, listPredicate);
        //         let resultStr = [
        //             `EXISTS((${varName})${inStr}[:${connectionField.relationship.type}]${outStr}(${labels}))`,
        //             `AND ${listPredicate}(${collectedMap} IN [(${varName})${inStr}[${relationshipVariable}:${connectionField.relationship.type}]${outStr}(${thisParam}${labels})`,
        //             ` | { node: ${thisParam}, relationship: ${relationshipVariable} } ] INNER_WHERE `,
        //         ].join(" ");
    });

    return operations.reduce((prev, current) => {
        return CypherBuilder.and(prev, current);
    });

    //     Object.entries(nodeEntries).forEach((entry) => {
    //         const refNode = context.nodes.find((x) => x.name === entry[0]) as Node;
    //         const relationship = context.relationships.find(
    //             (x) => x.name === connectionField.relationshipTypeName
    //         ) as Relationship;
    //         const thisParam = `${param}_${refNode.name}`;
    //         const relationshipVariable = `${thisParam}_${connectionField.relationshipTypeName}`;
    //         const inStr = connectionField.relationship.direction === "IN" ? "<-" : "-";
    //         const outStr = connectionField.relationship.direction === "OUT" ? "->" : "-";
    //         const labels = refNode.getLabelString(context);
    //         const collectedMap = `${thisParam}_map`;
    //         if (value === null) {
    //             res.clauses.push(
    //                 `${isNot ? "" : "NOT "}EXISTS((${varName})${inStr}[:${
    //                     connectionField.relationship.type
    //                 }]${outStr}(${labels}))`
    //             );
    //             return;
    //         }
    //         let resultStr = [
    //             `EXISTS((${varName})${inStr}[:${connectionField.relationship.type}]${outStr}(${labels}))`,
    //             `AND ${listPredicate}(${collectedMap} IN [(${varName})${inStr}[${relationshipVariable}:${connectionField.relationship.type}]${outStr}(${thisParam}${labels})`,
    //             ` | { node: ${thisParam}, relationship: ${relationshipVariable} } ] INNER_WHERE `,
    //         ].join(" ");
    //         const parameterPrefix = recursing
    //             ? `${chainStr || varName}_${context.resolveTree.name}.where.${key}`
    //             : `${varName}_${context.resolveTree.name}.where.${key}`;
    //         const connectionWhere = createConnectionWhereAndParams({
    //             whereInput: entry[1] as any,
    //             context,
    //             node: refNode,
    //             nodeVariable: `${collectedMap}.node`,
    //             relationship,
    //             relationshipVariable: `${collectedMap}.relationship`,
    //             parameterPrefix,
    //             listPredicates: [listPredicate],
    //         });
    //         resultStr += connectionWhere[0];
    //         resultStr += ")"; // close ALL
    //         res.clauses.push(resultStr);
    //         const whereKeySuffix = operator ? `_${operator}` : "";
    //         const resolveTreeParams = recursing
    //             ? {
    //                   [`${chainStr || varName}_${context.resolveTree.name}`]: {
    //                       where: { [`${connectionField.fieldName}${whereKeySuffix}`]: connectionWhere[1] },
    //                   },
    //               }
    //             : { [`${varName}_${context.resolveTree.name}`]: context.resolveTree.args };
    //         res.params = {
    //             ...res.params,
    //             ...resolveTreeParams,
    //         };
    //     });
    //     return res;
}

function mapConnectionProperties({
    whereInput,
    node,
    targetVariable,
    context,
}: {
    whereInput: Record<string, any>;
    node: Node;
    targetVariable: CypherBuilder.Variable;
    context: Context;
}): WhereInput {
    const nodeProperties = (whereInput.node || {}) as Record<string, any>;

    const parsedProperties = Object.entries(nodeProperties).reduce((acc, [key, value]) => {
        acc[`node.${key}`] = value;
        return acc;
    }, {});

    // SAME with relationship (edge)
    const mappedPropertiesNode = mapAllProperties({
        whereInput: parsedProperties,
        node,
        targetElement: targetVariable,
        context,
    });

    const edgeProperties = (whereInput.edge || {}) as Record<string, any>;

    const parsedEdgeProperties = Object.entries(edgeProperties).reduce((acc, [key, value]) => {
        acc[`relationship.${key}`] = value;
        return acc;
    }, {});

    const mappedPropertiesEdge = mapAllProperties({
        whereInput: parsedEdgeProperties,
        node,
        targetElement: targetVariable,
        context,
    });

    return [...mappedPropertiesNode, ...mappedPropertiesEdge];
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
    // MISSING VARNAME
    const refNode = context.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;
    const relationship = context.relationships.find((x) => x.properties === relationField.properties) as Relationship;

    const aggregateStatement = new CypherBuilder.RawCypherWithCallback((cypherContext: CypherBuilder.CypherContext) => {
        const varName = cypherContext.getVariableId(parentNode);

        const aggregateWhereAndParams = createAggregateWhereAndParams({
            node: refNode,
            chainStr: "", //param,
            context,
            field: relationField,
            varName,
            aggregation: value,
            relationship,
        });

        return aggregateWhereAndParams;
    });

    // if (aggregateWhereAndParams[0]) {
    //     console.log(aggregateWhereAndParams);
    //     // res.clauses.push(aggregateWhereAndParams[0]);
    //     // res.params = { ...res.params, ...aggregateWhereAndParams[1] };
    // }

    //     return res;

    return aggregateStatement;
}

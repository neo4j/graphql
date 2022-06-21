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

import { mergeDeep } from "@graphql-tools/utils";
import { GraphQLWhereArg, Context } from "../../types";
import { Node, Relationship } from "../../classes";
import createConnectionWhereAndParams from "./create-connection-where-and-params";
import mapToDbProperty from "../../utils/map-to-db-property";
import createAggregateWhereAndParams from "../create-aggregate-where-and-params";
import createWhereClause from "./create-where-clause";
import { getListPredicate, whereRegEx, WhereRegexGroups } from "./utils";
import * as CypherBuilder from "../cypher-builder/CypherBuilder";
import { MatchableElement } from "../cypher-builder/MatchPattern";
import { WHERE_AGGREGATION_OPERATORS } from "src/constants";
import { stringAggregationQuery } from "../field-aggregations/aggregation-sub-queries";
import { WhereOperator } from "../cypher-builder/statements/where-operators";

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
    // if (!Object.keys(whereInput).length) {
    //     return ["", {}];
    // }

    // const mappedFields = mapProperties(node, whereInput);
    // matchStatement.where(mappedFields);

    const mappedProperties = mapAllProperties({
        whereInput,
        targetElement,
        node,
    });

    matchStatement.where(...mappedProperties);
    // if (whereField[0] === "AND") {
    //     console.log(whereField);
    //     const properties: Array<Record<string, any>> = whereField[1];
    //     const allProperties = properties
    //         .map((p) => mapProperties(node, p))
    //         .map((p) => [targetElement, p] as [MatchableElement, Record<string, CypherBuilder.Param>]);

    //     const andOperator = CypherBuilder.and(...allProperties);
    //     matchStatement.where(andOperator);
    // } else {
    //     addWhereField({
    //         node,
    //         whereField,
    //         matchStatement,
    //         targetElement,
    //     });
    // }
    // }

    // const { clauses, params } = Object.entries(whereInput).reduce(reducer, { clauses: [], params: {} });

    // let where = `${!recursing ? "WHERE " : ""}`;
    // where += clauses.join(" AND ").replace(/INNER_WHERE/gi, "WHERE");

    // return [where, params];
    //
    // return {
    //     cypher: "",
    //     params: {},
    // };

    return matchStatement;
}

function mapAllProperties<T extends MatchableElement>({
    whereInput,
    node,
    targetElement,
}: {
    whereInput: Record<string, any>;
    node: Node;
    targetElement: T;
}): Array<[T, Record<string, CypherBuilder.Param>] | WhereOperator> {
    const resultArray: Array<[T, Record<string, CypherBuilder.Param>] | WhereOperator> = [];
    const whereFields = Object.entries(whereInput);

    const leafProperties = whereFields.filter(([key, value]) => key !== "OR" && key !== "AND");
    if (leafProperties.length > 0) {
        const mappedProperties = mapProperties(leafProperties, node);

        resultArray.push([targetElement, mappedProperties]);
    }

    // matchStatement.where([targetElement, mappedProperties]);

    // const operatorFields = whereFields.filter(([key, value]) => key === "OR");
    for (const [key, value] of whereFields) {
        if (key === "OR" || key === "AND") {
            // value is an array
            const nestedResult: any[] = [];
            for (const nestedValue of value) {
                const mapNested = mapAllProperties({ whereInput: nestedValue, node, targetElement });
                nestedResult.push(...mapNested);
            }
            // const nestedProperties = value.map((v) => mapAllProperties({ whereInput: v, node, targetElement }));

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

// function mapWhereParameters(
//     node: Node,
//     properties: Record<string, any>,
//     targetElement: MatchableElement
// ): Array<[MatchableElement, Record<string, CypherBuilder.Param>] | WhereOperator> {
//     return Object.entries(properties).map((prev, [key, value]) => {
//         if (key === "OR") {
//             // mapProperties(value, node)
//             // const nested = value.map((nestedProperties: Record<string, any>) => {
//             //     return mapProperties(node, nestedProperties);
//             // });

//             // return CypherBuilder.or(...nested);
//         }
//         else {

//         }
//         prev[mapToDbProperty(node, key)] = new CypherBuilder.Param(value);
//     }});
// }

function mapProperties(properties: Array<[string, any]>, node: Node): Record<string, CypherBuilder.Param> {
    return properties.reduce((acc, [key, value]) => {
        acc[mapToDbProperty(node, key)] = new CypherBuilder.Param(value);

        return acc;
    }, {});
}

function addWhereField<T extends MatchableElement>({
    matchStatement,
    whereField,
    node,
    targetElement,
}: {
    matchStatement: CypherBuilder.Match<T>;
    whereField: [string, any];
    node: Node;
    targetElement: T;
}) {
    const [key, value] = whereField;
    const match = whereRegEx.exec(key);

    const { fieldName, isAggregate, operator } = match?.groups as WhereRegexGroups;
    const isNot = operator?.startsWith("NOT") ?? false; //

    const dbFieldName = mapToDbProperty(node, fieldName);

    const coalesceValue = [...node.primitiveFields, ...node.temporalFields, ...node.enumFields].find(
        (f) => fieldName === f.fieldName
    )?.coalesceValue;

    // Recurse if using AND/OR

    // if (["AND", "OR"].includes(key)) {
    //     const innerClauses: string[] = [];
    //
    //     value.forEach((v: any, i) => {
    //         const recurse = createWhereAndParams({
    //             whereInput: v,
    //             varName,
    //             chainStr: `${param}${i > 0 ? i : ""}`,
    //             node,
    //             context,
    //             recursing: true,
    //         });
    //         if (recurse[0]) {
    //             innerClauses.push(`${recurse[0]}`);
    //             res.params = mergeDeep([res.params, recurse[1]]);
    //         }
    //     });
    //
    //     if (innerClauses.length) {
    //         res.clauses.push(`(${innerClauses.join(` ${key} `)})`);
    //     }
    //
    //     return res;
    // }

    // const property =
    //     coalesceValue !== undefined
    //         ? `coalesce(${varName}.${dbFieldName}, ${coalesceValue})`
    //         : `${varName}.${dbFieldName}`;
    // res.clauses.push(createWhereClause({ param, property, operator, isNot, pointField, durationField }));
    matchStatement.where([
        targetElement,
        {
            [dbFieldName]: new CypherBuilder.Param(value),
        },
    ]);
    // matchStatement.where(targetElement, {
    //     [dbFieldName]: new CypherBuilder.Param(value),
    // });
}

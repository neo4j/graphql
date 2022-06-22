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

import { GraphQLWhereArg, Context } from "../../types";
import { Node } from "../../classes";
import mapToDbProperty from "../../utils/map-to-db-property";
import * as CypherBuilder from "../cypher-builder/CypherBuilder";
import { MatchableElement } from "../cypher-builder/MatchPattern";
import { WhereOperator } from "../cypher-builder/statements/where-operators";
import { whereRegEx, WhereRegexGroups } from "./utils";

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
    });

    matchStatement.where(...mappedProperties);

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
}): Array<[T, Record<string, CypherBuilder.Param | CypherBuilder.WhereClause>] | WhereOperator> {
    const resultArray: Array<[T, Record<string, CypherBuilder.Param | CypherBuilder.WhereClause>] | WhereOperator> = [];
    const whereFields = Object.entries(whereInput);

    const leafProperties = whereFields.filter(([key, value]) => key !== "OR" && key !== "AND");
    if (leafProperties.length > 0) {
        const mappedProperties = mapProperties(leafProperties, node, targetElement);

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
                const mapNested = mapAllProperties({ whereInput: nestedValue, node, targetElement });
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
        * Relationship fields
        * Connection Fields
        * where clauses (NOT, LG)...

    */

    return resultArray;
}

function mapProperties<T extends MatchableElement>(
    properties: Array<[string, any]>,
    node: Node,
    targetElement: T
): Array<[T, Record<string, CypherBuilder.Param | CypherBuilder.WhereClause>] | WhereOperator> {
    return properties.map(([key, value]) => {
        const match = whereRegEx.exec(key);

        const { fieldName, isAggregate, operator } = match?.groups as WhereRegexGroups;
        const coalesceValue = [...node.primitiveFields, ...node.temporalFields, ...node.enumFields].find(
            (f) => fieldName === f.fieldName
        )?.coalesceValue;

        const param = new CypherBuilder.Param(value);
        const dbFieldName = mapToDbProperty(node, fieldName);
        if (value === null) {
            // create CYPHER IS NULL operator
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
                    return CypherBuilder.not([targetElement, { [dbFieldName]: param }]);
                case "ENDS_WITH":
                    whereClause = CypherBuilder.endsWith(param);
                    break;
                case "NOT_ENDS_WITH":
                    return CypherBuilder.not([targetElement, { [dbFieldName]: CypherBuilder.endsWith(param) }]);
                case "STARTS_WITH":
                    whereClause = CypherBuilder.startsWith(param);
                    break;
                case "NOT_STARTS_WITH":
                    return CypherBuilder.not([targetElement, { [dbFieldName]: CypherBuilder.startsWith(param) }]);
                case "MATCHES":
                    whereClause = CypherBuilder.match(param);
                    break;
                case "CONTAINS":
                    whereClause = CypherBuilder.contains(param);
                    break;
                case "NOT_CONTAINS":
                    return CypherBuilder.not([targetElement, { [dbFieldName]: CypherBuilder.contains(param) }]);
                case "IN":
                    whereClause = CypherBuilder.in(param);
                    break;
                case "NOT_IN":
                    return CypherBuilder.not([targetElement, { [dbFieldName]: CypherBuilder.in(param) }]);
                default:
                    throw new Error(`Invalid operator ${operator}`);
            }
            return [targetElement, { [dbFieldName]: whereClause }];
        }
        return [targetElement, { [dbFieldName]: param }];

        // return acc;

        // const property =
        //     coalesceValue !== undefined
        //         ? `coalesce(${varName}.${dbFieldName}, ${coalesceValue})`
        //         : `${varName}.${dbFieldName}`;
    });
}

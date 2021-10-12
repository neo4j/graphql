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

import Relationship from "../../classes/Relationship";
import { GraphQLWhereArg, Context, PrimitiveField } from "../../types";
import createFilter from "./create-filter";

interface Res {
    clauses: string[];
    params: any;
}

function createRelationshipWhereAndParams({
    whereInput,
    context,
    relationship,
    relationshipVariable,
    parameterPrefix,
}: {
    whereInput: GraphQLWhereArg;
    context: Context;
    relationship: Relationship;
    relationshipVariable: string;
    parameterPrefix: string;
}): [string, any] {
    if (!Object.keys(whereInput).length) {
        return ["", {}];
    }

    function reducer(res: Res, [key, value]: [string, GraphQLWhereArg]): Res {
        const param = `${parameterPrefix}.${key}`;

        const re = /(?<field>[_A-Za-z][_0-9A-Za-z]*?)(?:_(?<not>NOT))?(?:_(?<operator>INCLUDES|IN|MATCHES|CONTAINS|STARTS_WITH|ENDS_WITH|LT|GT|GTE|LTE|DISTANCE))?$/gm;

        const match = re.exec(key);

        const fieldName = match?.groups?.field;
        const not = !!match?.groups?.not;
        const operator = match?.groups?.operator;

        const pointField = relationship.pointFields.find((f) => f.fieldName === fieldName);
        // Comparison operations requires adding dates to durations
        // See https://neo4j.com/developer/cypher/dates-datetimes-durations/#comparing-filtering-values
        const durationField = relationship.primitiveFields.find(
            (f) => f.fieldName === fieldName && f.typeMeta.name === "Duration"
        );

        const coalesceValue = ([
            ...relationship.temporalFields,
            ...relationship.enumFields,
            ...relationship.scalarFields,
            ...relationship.primitiveFields,
        ].find((f) => f.fieldName === fieldName && "coalesce" in f) as PrimitiveField)?.coalesceValue;

        const property =
            coalesceValue !== undefined
                ? `coalesce(${relationshipVariable}.${fieldName}, ${coalesceValue})`
                : `${relationshipVariable}.${fieldName}`;

        if (fieldName && ["AND", "OR"].includes(fieldName)) {
            const innerClauses: string[] = [];
            const nestedParams: any[] = [];

            value.forEach((v: any, i) => {
                const recurse = createRelationshipWhereAndParams({
                    whereInput: v,
                    relationship,
                    relationshipVariable,
                    context,
                    parameterPrefix: `${parameterPrefix}.${fieldName}[${i}]`,
                });

                innerClauses.push(`(${recurse[0]})`);
                nestedParams.push(recurse[1]);
            });

            res.clauses.push(`(${innerClauses.join(` ${fieldName} `)})`);
            res.params = { ...res.params, [fieldName]: nestedParams };

            return res;
        }

        // Equality/inequality
        if (!operator) {
            if (value === null) {
                res.clauses.push(not ? `${property} IS NOT NULL` : `${property} IS NULL`);
                return res;
            }

            if (pointField) {
                if (pointField.typeMeta.array) {
                    let clause = `${property} = [p in $${param} | point(p)]`;
                    if (not) clause = `(NOT ${clause})`;
                    res.clauses.push(clause);
                } else {
                    let clause = `${property} = point($${param})`;
                    if (not) clause = `(NOT ${clause})`;
                    res.clauses.push(clause);
                }
            } else {
                let clause = `${property} = $${param}`;
                if (not) clause = `(NOT ${clause})`;
                res.clauses.push(clause);
            }

            res.params[key] = value;
            return res;
        }

        if (operator === "IN") {
            const clause = createFilter({
                left: property,
                operator,
                right: pointField ? `[p in $${param} | point(p)]` : `$${param}`,
                not,
            });
            res.clauses.push(clause);
            res.params[key] = value;

            return res;
        }

        if (operator === "INCLUDES") {
            const clause = createFilter({
                left: pointField ? `point($${param})` : `$${param}`,
                operator,
                right: property,
                not,
            });
            res.clauses.push(clause);
            res.params[key] = value;

            return res;
        }

        if (operator && ["MATCHES", "CONTAINS", "STARTS_WITH", "ENDS_WITH"].includes(operator)) {
            const clause = createFilter({
                left: property,
                operator,
                right: `$${param}`,
                not,
            });
            res.clauses.push(clause);
            res.params[key] = value;
            return res;
        }

        if (operator && ["DISTANCE", "LT", "LTE", "GTE", "GT"].includes(operator)) {
            let left = property;
            let right = `$${param}`;
            if (pointField) {
                left = `distance(${property}, point($${param}.point))`;
                right = `$${param}.distance`;
            }
            if (durationField) {
                left = `datetime() + ${property}`;
                right = `datetime() + $${param}`;
            }
            const clause = createFilter({
                left,
                operator,
                right,
            });
            res.clauses.push(clause);
            res.params[key] = value;
            return res;
        }

        // Necessary for TypeScript, but should never reach here
        return res;
    }

    const { clauses, params } = Object.entries(whereInput).reduce(reducer, { clauses: [], params: {} });
    const where = clauses.join(" AND ").replace(/INNER_WHERE/gi, "WHERE");

    return [where, params];
}

export default createRelationshipWhereAndParams;

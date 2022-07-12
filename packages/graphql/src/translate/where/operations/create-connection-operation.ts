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

import type { ConnectionField, Context } from "../../../types";
import * as CypherBuilder from "../../cypher-builder/CypherBuilder";
import type { Node, Relationship } from "../../../classes";
import createConnectionWhereAndParams from "../create-connection-where-and-params";
import { getListPredicate } from "../utils";
import { listPredicateToSizeFunction } from "../list-predicate-to-size-function";

export function createConnectionOperation({
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

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

import createAggregateWhereAndParams from "../../create-aggregate-where-and-params";
import type { Context, RelationField } from "../../../types";
import { Cypher } from "../../cypher-builder/CypherBuilder";
import type { Node, Relationship } from "../../../classes";

/** Translates an atomic aggregation operation */
export function createAggregateOperation({
    relationField,
    context,
    value,
    parentNode,
}: {
    relationField: RelationField;
    context: Context;
    value: any;
    parentNode: Cypher.Node;
}): Cypher.RawCypher {
    const refNode = context.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;
    const relationship = context.relationships.find((x) => x.properties === relationField.properties) as Relationship;

    const aggregateStatement = new Cypher.RawCypher((env: Cypher.Environment) => {
        const varName = env.getReferenceId(parentNode);

        // TODO: use cypher builder instead of rawCypher
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

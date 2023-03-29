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
import Cypher from "@neo4j/cypher-builder";
import type { Node } from "../../../classes";
import mapToDbProperty from "../../../utils/map-to-db-property";

export function createGlobalNodeOperation({
    node,
    value,
    targetElement,
    coalesceValue,
}: {
    node: Node;
    value: string;
    targetElement: Cypher.Variable;
    coalesceValue: string | undefined;
}): Cypher.ComparisonOp {
    const { field, id } = node.fromGlobalId(value);
    const idDbFieldName = mapToDbProperty(node, field);
    let idProperty = targetElement.property(idDbFieldName) as Cypher.Property | Cypher.Function;
    if (coalesceValue) {
        idProperty = Cypher.coalesce(
            idProperty as Cypher.Property,
            new Cypher.RawCypher(`${coalesceValue}`) // TODO: move into Cypher.literal
        );
    }
    return Cypher.eq(idProperty, new Cypher.Param(id));
}

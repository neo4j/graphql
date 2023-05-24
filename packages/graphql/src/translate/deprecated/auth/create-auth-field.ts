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

export function createAuthField({
    node,
    key,
    elementRef,
    param,
}: {
    node: Node;
    key: string;
    elementRef: Cypher.Node | Cypher.Relationship;
    param: Cypher.Param;
}): Cypher.Predicate {
    const dbFieldName = mapToDbProperty(node, key);
    const fieldPropertyRef = elementRef.property(dbFieldName);
    if (param.value === undefined) {
        return new Cypher.Literal(false);
    }

    if (param.value === null) {
        return Cypher.isNull(fieldPropertyRef);
    }

    const isNotNull = Cypher.isNotNull(fieldPropertyRef);
    const equalsToParam = Cypher.eq(fieldPropertyRef, param);
    return Cypher.and(isNotNull, equalsToParam);
}

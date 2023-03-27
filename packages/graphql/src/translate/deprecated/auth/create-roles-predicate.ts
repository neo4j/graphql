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

export function createRolesPredicate(
    roles: string[],
    rolesParam: Cypher.Param | Cypher.Property
): Cypher.PredicateFunction {
    const roleVar = new Cypher.Variable();
    const rolesList = new Cypher.Literal(roles);

    const roleInParamPredicate = isValueInListCypher(roleVar, rolesParam);

    const rolesInListComprehension = Cypher.any(roleVar, rolesList, roleInParamPredicate);

    return rolesInListComprehension;
}

function isValueInListCypher(value: Cypher.Variable, list: Cypher.Expr): Cypher.PredicateFunction {
    const listItemVar = new Cypher.Variable();
    return Cypher.any(listItemVar, list, Cypher.eq(listItemVar, value));
}

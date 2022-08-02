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

import mapToDbProperty from "../utils/map-to-db-property";
import type { Node } from "../classes";
import { AUTH_UNAUTHENTICATED_ERROR } from "../constants";
import * as CypherBuilder from "./cypher-builder/CypherBuilder";

export class AuthBuilder {
    public static createRolesPredicate(
        roles: string[],
        rolesParam: CypherBuilder.Param | CypherBuilder.PropertyRef
    ): CypherBuilder.PredicateFunction {
        const roleVar = new CypherBuilder.Variable();
        const rolesList = new CypherBuilder.Literal(roles);

        const roleInParamPredicate = this.isValueInListCypher(roleVar, rolesParam);

        const rolesInListComprehension = CypherBuilder.any(roleVar, rolesList, roleInParamPredicate);

        return rolesInListComprehension;
    }

    public static createAuthenticatedPredicate(
        authenticated: boolean,
        authenticatedParam: CypherBuilder.Variable | CypherBuilder.PropertyRef
    ): CypherBuilder.Predicate {
        const authenticatedPredicate = CypherBuilder.not(
            CypherBuilder.eq(authenticatedParam, new CypherBuilder.Literal(authenticated))
        );

        return new CypherBuilder.apoc.ValidatePredicate(authenticatedPredicate, AUTH_UNAUTHENTICATED_ERROR);
    }

    public static createAuthField({
        node,
        key,
        nodeRef,
        param,
    }: {
        node: Node;
        key: string;
        nodeRef: CypherBuilder.Node;
        param: CypherBuilder.Param;
    }): CypherBuilder.Predicate {
        const dbFieldName = mapToDbProperty(node, key);
        const fieldPropertyRef = nodeRef.property(dbFieldName);
        if (param.value === undefined) {
            return new CypherBuilder.Literal(false);
        }

        if (param.value === null) {
            return CypherBuilder.isNull(fieldPropertyRef);
        }

        const isNotNull = CypherBuilder.isNotNull(fieldPropertyRef);
        const equalsToParam = CypherBuilder.eq(fieldPropertyRef, param);
        return CypherBuilder.and(isNotNull, equalsToParam);
    }

    private static isValueInListCypher(
        value: CypherBuilder.Variable,
        list: CypherBuilder.Expr
    ): CypherBuilder.PredicateFunction {
        const listItemVar = new CypherBuilder.Variable();
        return CypherBuilder.any(listItemVar, list, CypherBuilder.eq(listItemVar, value));
    }
}

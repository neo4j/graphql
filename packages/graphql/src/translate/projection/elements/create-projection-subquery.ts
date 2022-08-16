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

import type { Node } from "../../../classes";
import type { Context, GraphQLOptionsArg, GraphQLSortArg, GraphQLWhereArg, RelationField } from "../../../types";
import * as CypherBuilder from "../../cypher-builder/CypherBuilder";
import { createCypherWherePredicate } from "../../where/create-cypher-where-predicate";
import type { RelationshipDirection } from "../../../utils/get-relationship-direction";
import { createAuthPredicates } from "../../create-auth-and-params";
import { AUTH_FORBIDDEN_ERROR } from "../../../constants";
import { toNumber } from "../../../utils/utils";

export function createProjectionSubquery({
    parentNode,
    whereInput,
    node,
    context,
    alias,
    nestedProjection,
    nestedSubqueries,
    relationField,
    relationshipDirection,
    optionsInput,
    authValidateStrs,
}: {
    parentNode: CypherBuilder.Node;
    whereInput?: GraphQLWhereArg;
    node: Node;
    context: Context;
    alias: string; // TODO: this should be output variable instead
    nestedProjection: string;
    nestedSubqueries: CypherBuilder.Clause[];
    relationField: RelationField;
    relationshipDirection: RelationshipDirection;
    optionsInput: GraphQLOptionsArg;
    authValidateStrs: string[] | undefined;
}): {
    subquery: CypherBuilder.Clause;
    projectionColumn: CypherBuilder.ProjectionColumn[];
} {
    const isArray = relationField.typeMeta.array;
    const targetNode = new CypherBuilder.NamedNode(alias, {
        labels: node.getLabels(context),
    });

    const relationship = new CypherBuilder.Relationship({
        source: parentNode,
        target: targetNode,
        type: relationField.type,
    });
    if (relationshipDirection === "IN") {
        relationship.reverse();
    }

    const isUndirected = relationshipDirection === "undirected";
    const pattern = new CypherBuilder.Pattern(relationship, { directed: !isUndirected });

    const subqueryMatch = new CypherBuilder.Match(pattern);

    const projection = new CypherBuilder.RawCypher((env) => {
        // TODO: use MapProjection
        return `${targetNode.getCypher(env)} ${nestedProjection}`;
    });

    if (whereInput) {
        const wherePredicate = createCypherWherePredicate({
            element: node,
            context,
            whereInput,
            targetElement: targetNode,
        });
        if (wherePredicate) subqueryMatch.where(wherePredicate); // TODO: should return var a projectionColumn
    }

    const whereAuth = createAuthPredicates({
        entity: node,
        operations: "READ",
        context,
        where: {
            varName: alias,
            node,
        },
    });

    if (whereAuth) {
        subqueryMatch.and(whereAuth);
    }

    const preAuth = createAuthPredicates({
        entity: node,
        operations: "READ",
        context,
        allow: {
            parentNode: node,
            varName: alias,
        },
    });

    if (preAuth) {
        const allowAuth = new CypherBuilder.apoc.ValidatePredicate(CypherBuilder.not(preAuth), AUTH_FORBIDDEN_ERROR);
        subqueryMatch.and(allowAuth);
    }

    if (authValidateStrs?.length) {
        const authValidateStatements = authValidateStrs.map((str) => new CypherBuilder.RawCypher(str));
        const authValidatePredicate = CypherBuilder.and(...authValidateStatements) as CypherBuilder.Predicate;

        const authStatement = new CypherBuilder.apoc.ValidatePredicate(
            CypherBuilder.not(authValidatePredicate),
            AUTH_FORBIDDEN_ERROR
        );

        subqueryMatch.and(authStatement);
    }

    const returnVariable = new CypherBuilder.NamedVariable(alias);
    const withStatement: CypherBuilder.With = new CypherBuilder.With([projection, returnVariable]); // This only works if nestedProjection is a map

    // TODO: limit and skip options
    if (optionsInput.sort) {
        const orderByParams = createOrderByParams({
            optionsInput,
            target: returnVariable, // Note: this works because targetNode uses alias
        });
        if (orderByParams.length > 0) {
            withStatement.orderBy(...orderByParams);
        }
    }
    if (optionsInput.limit) {
        const limit = toNumber(optionsInput.limit);
        withStatement.limit(limit);
    }
    if (optionsInput.offset) {
        const offset = toNumber(optionsInput.offset);
        withStatement.skip(offset);
    }

    let returnProjection = CypherBuilder.collect(targetNode);
    if (!isArray) {
        returnProjection = CypherBuilder.head(returnProjection);
    }

    const returnStatement = new CypherBuilder.Return([returnProjection, returnVariable]);

    const subquery = CypherBuilder.concat(subqueryMatch, ...nestedSubqueries, withStatement, returnStatement);

    return {
        subquery: new CypherBuilder.Call(subquery).with(parentNode),
        projectionColumn: [],
    };
}

function createOrderByParams({
    optionsInput,
    target,
}: {
    optionsInput: GraphQLOptionsArg;
    target: CypherBuilder.Variable;
}): Array<[CypherBuilder.Expr, CypherBuilder.Order]> {
    const orderList = (optionsInput.sort || []).flatMap((arg: GraphQLSortArg): Array<[string, "ASC" | "DESC"]> => {
        return Object.entries(arg);
    });

    return orderList.map(([field, order]) => {
        return [target.property(field), order];
    });
}

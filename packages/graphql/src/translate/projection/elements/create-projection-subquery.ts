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

import createWhereAndParams from "../../where/create-where-and-params";
import type { Node } from "../../../classes";
import type { Context, GraphQLOptionsArg, GraphQLSortArg, GraphQLWhereArg, RelationField } from "../../../types";

import * as CypherBuilder from "../../cypher-builder/CypherBuilder";
import { createCypherWherePredicate } from "../../where/create-cypher-where-predicate";
import type { RelationshipDirection } from "src/utils/get-relationship-direction";

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
}): {
    subquery: CypherBuilder.Clause;
    projectionColumn: CypherBuilder.ProjectionColumn[];
} {
    const targetNode = new CypherBuilder.NamedNode(alias, {
        labels: node.getLabels(context),
    });
    // const targetNode = new CypherBuilder.NamedNode(alias, {
    //     labels: node.getLabels(context),
    // });
    const relationship = new CypherBuilder.Relationship({
        source: parentNode,
        target: targetNode,
        type: relationField.type,
    });
    if (relationshipDirection === "IN") {
        relationship.reverse();
    }

    const pattern = new CypherBuilder.Pattern(relationship, { directed: relationshipDirection === "undirected" });

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

    const returnVariable = new CypherBuilder.NamedVariable(alias);
    let withStatement: CypherBuilder.With = new CypherBuilder.With([projection, returnVariable]); // This only works if nestedProjection is a map

    if (optionsInput.sort) {
        const orderByParams = createOrderByParams({
            optionsInput,
            target: returnVariable, // Note: this works because targetNode uses alias
        });
        if (orderByParams.length > 0) {
            withStatement.orderBy(...orderByParams);
            // sortStatement = new CypherBuilder.With(targetNode, relationship).orderBy(...orderByParams);
        }
    }
    const returnStatement = new CypherBuilder.Return([CypherBuilder.collect(targetNode), returnVariable]);

    const subquery = CypherBuilder.concat(subqueryMatch, ...nestedSubqueries, withStatement, returnStatement);
    // recurse.projection

    // TODO: options input
    // TODO: nested projection

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

// TODO: move to cypherbuilder
// function createNodeWhereAndParams({
//     whereInput,
//     varName,
//     context,
//     node,
//     authValidateStrs,
//     chainStr,
// }: {
//     whereInput?: any;
//     context: Context;
//     node: Node;
//     varName: string;
//     authValidateStrs?: string[];
//     chainStr?: string;
// }): [string, any] {
//     const whereStrs: string[] = [];
//     let params = {};

//     if (whereInput) {
//         const whereAndParams = createWhereAndParams({
//             context,
//             node,
//             varName,
//             whereInput,
//             chainStr,
//             recursing: true,
//         });
//         if (whereAndParams[0]) {
//             whereStrs.push(whereAndParams[0]);
//             params = { ...params, ...whereAndParams[1] };
//         }
//     }

//     const whereAuth = createAuthAndParams({
//         entity: node,
//         operations: "READ",
//         context,
//         where: {
//             varName,
//             chainStr,
//             node,
//         },
//     });
//     if (whereAuth[0]) {
//         whereStrs.push(whereAuth[0]);
//         params = { ...params, ...whereAuth[1] };
//     }

//     const preAuth = createAuthAndParams({
//         entity: node,
//         operations: "READ",
//         context,
//         allow: {
//             parentNode: node,
//             varName,
//             chainStr,
//         },
//     });
//     if (preAuth[0]) {
//         whereStrs.push(`apoc.util.validatePredicate(NOT (${preAuth[0]}), "${AUTH_FORBIDDEN_ERROR}", [0])`);
//         params = { ...params, ...preAuth[1] };
//     }

//     if (authValidateStrs?.length) {
//         whereStrs.push(
//             `apoc.util.validatePredicate(NOT (${authValidateStrs.join(" AND ")}), "${AUTH_FORBIDDEN_ERROR}", [0])`
//         );
//     }

//     return [whereStrs.join(" AND "), params];
// }

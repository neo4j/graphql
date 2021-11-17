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

import { RelationField, Context } from "../../types";
import { buildMergeStatement } from "../cypher-builder/build-merge-statement";
import { CypherStatement } from "../types";
import { Node } from "../../classes";
import { joinStatements } from "../utils/join-statements";
import createAuthAndParams from "../create-auth-and-params";
import { AUTH_FORBIDDEN_ERROR } from "../../constants";

type CreateOrConnectInput = {
    where?: {
        node: Record<string, any>;
    };
    onCreate?: {
        node?: Record<string, any>;
        edge?: Record<string, any>;
    };
};

export function createConnectOrCreateAndParams({
    input,
    varName,
    parentVar,
    relationField,
    refNode,
    context,
}: {
    input: CreateOrConnectInput[];
    varName: string;
    parentVar: string;
    relationField: RelationField;
    refNode: Node;
    context: Context;
}): CypherStatement {
    const statements = input.map(
        (inputItem, index): CypherStatement => {
            const subqueryBaseName = `${varName}${index}`;
            return createConnectOrCreateSubquery({
                input: inputItem,
                baseName: subqueryBaseName,
                parentVar,
                relationField,
                refNode,
                context,
            });
        }
    );

    return joinStatements(statements);
}

function createConnectOrCreateSubquery({
    input,
    baseName,
    parentVar,
    relationField,
    refNode,
    context,
}: {
    input: CreateOrConnectInput;
    baseName: string;
    parentVar: string;
    relationField: RelationField;
    refNode: Node;
    context: Context;
}): CypherStatement {
    const mergeRelatedNodeStatement = mergeRelatedNode({
        input,
        baseName,
        refNode,
        context,
    });

    const mergeRelationStatement = mergeRelation({
        input,
        baseName,
        context,
        parentVar,
        relationField,
    });

    const authStatement = createAuthStatement({
        node: refNode,
        context,
        nodeName: baseName,
    });

    return joinStatements([authStatement, mergeRelatedNodeStatement, mergeRelationStatement]);
}

function mergeRelatedNode({
    input,
    baseName,
    refNode,
    context,
}: {
    input: CreateOrConnectInput;
    baseName: string;
    refNode: Node;
    context: Context;
}): CypherStatement {
    const whereNodeParameters = input.where?.node;
    const onCreateNode = input.onCreate?.node;
    return buildMergeStatement({
        leftNode: {
            node: refNode,
            varName: baseName,
            parameters: whereNodeParameters,
            onCreate: onCreateNode,
        },
        context,
    });
}

function mergeRelation({
    input,
    baseName,
    parentVar,
    context,
    relationField,
}: {
    input: CreateOrConnectInput;
    baseName: string;
    context: Context;
    relationField: RelationField;
    parentVar: string;
}): CypherStatement {
    const onCreateEdge = input.onCreate?.edge;
    return buildMergeStatement({
        leftNode: {
            varName: parentVar,
        },
        rightNode: {
            varName: baseName,
        },
        relation: {
            relationField,
            onCreate: onCreateEdge,
        },
        context,
    });
}

function createAuthStatement({
    node,
    context,
    nodeName,
    i,
}: {
    node: Node;
    context: Context;
    nodeName: string;
    i?: number;
}): CypherStatement | undefined {
    if (!node.auth) return undefined;

    const indexStr = i === undefined ? "" : String(i);
    const auth = createAuthAndParams({
        entity: node,
        operation: ["CONNECT", "CREATE"],
        context,
        allow: { parentNode: node, varName: nodeName, chainStr: `${nodeName}${node.name}${indexStr}_allow` },
    });

    if (!auth[0]) return undefined;

    return joinStatements(["CALL apoc.util.validate(NOT(", auth, `), "${AUTH_FORBIDDEN_ERROR}", [0])`], "");
}

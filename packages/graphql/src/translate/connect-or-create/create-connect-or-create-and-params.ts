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
import { joinStatements } from "../utils";

type CreateOrConnectInput = Array<{
    where: {
        node: Record<string, any>;
    };
    onCreate: {
        node: Record<string, any>;
        edge: Record<string, any>;
    };
}>;

export function createConnectOrCreateAndParams({
    input,
    varName,
    parentVar,
    relationField,
    refNode,
    context,
}: {
    input: CreateOrConnectInput;
    varName: string;
    parentVar: string;
    relationField: RelationField;
    refNode: Node;
    context: Context;
}): CypherStatement {
    const statements = input.map(
        (inputItem, index): CypherStatement => {
            const subqueryBaseName = `${varName}${index}`;

            return createConnectOrCreateSubQuery({
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

function createConnectOrCreateSubQuery({
    input,
    baseName,
    parentVar,
    relationField,
    refNode,
    context,
}: {
    input: CreateOrConnectInput[0];
    baseName: string;
    parentVar: string;
    relationField: RelationField;
    refNode: Node;
    context: Context;
}): CypherStatement {
    const whereNodeParameters = input?.where?.node;
    const onCreateNode = input?.onCreate?.node;
    const mergeNodeStatement = buildMergeStatement({
        node: {
            node: refNode,
            varName: baseName,
            parameters: whereNodeParameters,
            onCreate: onCreateNode,
        },
        context,
    });

    const onCreateEdge = input?.onCreate?.edge;
    const mergeRelationStatement = buildMergeStatement({
        node: {
            varName: parentVar,
        },
        relation: {
            relationField,
            varName: baseName,
            onCreate: onCreateEdge,
        },
        context,
    });

    return joinStatements([mergeNodeStatement, mergeRelationStatement]);
}

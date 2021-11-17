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

import { Context, RelationField } from "../../types";
import { Node, Neo4jGraphQLCypherBuilderError } from "../../classes";
import { CypherStatement } from "../types";
import { joinStrings } from "../../utils/utils";
import { buildNodeStatement } from "./build-node-statement";
import { joinStatements } from "../utils/join-statements";
import { buildRelationStatement } from "./build-relation-statement";
import { generateParameterKey } from "./utils";

type TargetNode = {
    varName: string;
    node?: Node;
    parameters?: Record<string, any>;
    onCreate?: Record<string, any>;
};

type TargetRelation = {
    varName?: string;
    relationField: RelationField;
    onCreate?: Record<string, any>;
};

type MergeNodeArguments = {
    leftNode: TargetNode & { node: Node };
    context: Context;
};

type MergeRelationArguments = {
    leftNode: TargetNode;
    rightNode: TargetNode;
    relation: TargetRelation;
    context: Context;
};

export function buildMergeStatement(args: MergeNodeArguments): CypherStatement;
export function buildMergeStatement(args: MergeRelationArguments): CypherStatement;
export function buildMergeStatement({
    leftNode,
    rightNode,
    relation,
    context,
}: {
    leftNode: TargetNode;
    rightNode?: TargetNode;
    relation?: TargetRelation;
    context: Context;
}): CypherStatement {
    const onCreateStatements: Array<CypherStatement> = [];
    let leftStatement: CypherStatement | undefined;
    let relationOnCreateStatement: CypherStatement | undefined;

    if (leftNode.onCreate) {
        onCreateStatements.push(buildOnCreate(leftNode.onCreate, leftNode.varName));
    }
    if (rightNode?.onCreate) {
        onCreateStatements.push(buildOnCreate(rightNode.onCreate, rightNode.varName));
    }

    if (relation || rightNode) {
        if (!relation) {
            throw new Neo4jGraphQLCypherBuilderError("Missing relation in Cypher merge relation statement");
        }
        if (!rightNode) {
            throw new Neo4jGraphQLCypherBuilderError("Missing rightnode in Cypher merge relation statement");
        }

        const relationshipName = relation.varName || `${leftNode.varName}_relationship_${rightNode.varName}`;
        leftStatement = buildRelationStatement({
            context,
            leftNode,
            rightNode,
            relation: {
                relationField: relation.relationField,
                varName: relationshipName,
            },
        });

        if (relation.onCreate) {
            relationOnCreateStatement = buildOnCreate(relation.onCreate, relationshipName);
            onCreateStatements.push(relationOnCreateStatement);
        }
    } else {
        leftStatement = buildNodeStatement({
            ...leftNode,
            context,
        });
    }

    const mergeNodeStatement = joinStatements(["MERGE ", leftStatement], "");

    const onCreateSetQuery = onCreateStatements.length > 0 ? "ON CREATE SET" : "";
    return joinStatements([mergeNodeStatement, onCreateSetQuery, ...onCreateStatements]);
}

function buildOnCreate(onCreate: Record<string, any>, varName: string): CypherStatement {
    const queries: string[] = [];
    const parameters = {};

    Object.entries(onCreate).forEach(([key, value]) => {
        queries.push(`${varName}.${key} = $${generateParameterKey(`${varName}_on_create`, key)}`);
        parameters[generateParameterKey(`${varName}_on_create`, key)] = value;
    });
    return [joinStrings(queries, ",\n"), parameters];
}

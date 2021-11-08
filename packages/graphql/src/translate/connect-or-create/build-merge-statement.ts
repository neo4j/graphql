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
import { Node } from "../../classes";
import { CypherStatement } from "../types";
import { joinStrings } from "../../utils/utils";
import { buildNodeStatement } from "./build-node-statement";
import { generateParameterKey, joinStatements } from "../utils";

type TargetNode = {
    varName: string;
    node?: Node;
    parameters?: Record<string, any>;
    onCreate?: Record<string, any>;
};

export function buildMergeStatement({
    node,
    relation,
    context,
}: {
    node: TargetNode;
    relation?: TargetNode & { relationField: RelationField };
    context: Context;
}): CypherStatement {
    const nodeStatement = buildNodeStatement({
        node: node.node,
        parameters: node.parameters,
        context,
        varName: node.varName,
    });

    let nodeOnCreateStatement: CypherStatement | undefined;
    let relationStatement: CypherStatement | undefined;
    let relationOnCreateStatement: CypherStatement | undefined;

    if (relation) {
        const relationshipName = `${node.varName}_relationship_${relation.varName}`;
        relationStatement = buildRelationStatement({ relation, context, relationshipName });

        if (relation.onCreate) {
            relationOnCreateStatement = buildOnCreate(relation.onCreate, relationshipName);
        }
    }

    const mergeNodeStatement = joinStatements(["MERGE ", nodeStatement, relationStatement], "");

    if (node.onCreate) {
        nodeOnCreateStatement = buildOnCreate(node.onCreate, node.varName);
    }

    const onCreateSetQuery = nodeOnCreateStatement || relationOnCreateStatement ? "ON CREATE SET" : "";
    return joinStatements([mergeNodeStatement, onCreateSetQuery, nodeOnCreateStatement, relationOnCreateStatement]);
}

function buildRelationStatement({
    relation,
    context,
    relationshipName,
}: {
    relation: TargetNode & { relationField: RelationField };
    context: Context;
    relationshipName: string;
}): CypherStatement {
    const { relationField } = relation;
    const inStr = relationField.direction === "IN" ? "<-" : "-";
    const outStr = relationField.direction === "OUT" ? "->" : "-";
    const relTypeStr = `[${relationField.properties ? relationshipName : ""}:${relationField.type}]`;

    const nodeStatement = buildNodeStatement({
        node: relation.node,
        varName: relation.varName,
        context,
        parameters: relation.parameters,
    });

    const relationQuery = `${inStr}${relTypeStr}${outStr}`;
    return joinStatements([`${relationQuery}`, nodeStatement], "");
}

function buildOnCreate(onCreate: Record<string, any>, nodeVar: string): CypherStatement {
    const queries: string[] = [];
    const parameters = {};

    Object.entries(onCreate).forEach(([key, value]) => {
        queries.push(`${nodeVar}.${key} = $${generateParameterKey(nodeVar, key)}`);
        parameters[generateParameterKey(nodeVar, key)] = value;
    });
    return [joinStrings(queries, ",\n"), parameters];
}

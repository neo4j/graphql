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

import type { ConstDirectiveNode, FieldDefinitionNode } from "graphql";

type CypherMeta = {
    statement: string;
    experimental: boolean;
};

export default function getCypherMeta(
    field: FieldDefinitionNode,
    interfaceField?: FieldDefinitionNode
): CypherMeta | undefined {
    const directive =
        field.directives?.find((x) => x.name.value === "cypher") ||
        interfaceField?.directives?.find((x) => x.name.value === "cypher");
    if (!directive) {
        return undefined;
    }

    return {
        statement: parseStatementFlag(directive),
        experimental: parseExperimentalFlag(directive),
    };
}

function parseStatementFlag(directive: ConstDirectiveNode): string {
    const stmtArg = directive.arguments?.find((x) => x.name.value === "statement");
    if (!stmtArg) {
        throw new Error("@cypher statement required");
    }
    if (stmtArg.value.kind !== "StringValue") {
        throw new Error("@cypher statement not a string");
    }

    return stmtArg.value.value;
}

function parseExperimentalFlag(directive: ConstDirectiveNode): boolean {
    const experimentalArg = directive.arguments?.find((x) => x.name.value === "experimental");
    if (!experimentalArg) return false;
    if (experimentalArg?.value.kind !== "BooleanValue") {
        throw new Error("@cypher experimental flag isnot a boolean");
    }

    return experimentalArg.value.value;
}

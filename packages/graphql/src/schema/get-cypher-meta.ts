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

import { FieldDefinitionNode } from "graphql";

type CypherMeta = {
    statement: string;
};

function getCypherMeta(field: FieldDefinitionNode, interfaceField?: FieldDefinitionNode): CypherMeta | undefined {
    const directive =
        field.directives?.find((x) => x.name.value === "cypher") ||
        interfaceField?.directives?.find((x) => x.name.value === "cypher");
    if (!directive) {
        return undefined;
    }

    const stmtArg = directive.arguments?.find((x) => x.name.value === "statement");
    if (!stmtArg) {
        throw new Error("@cypher statement required");
    }
    if (stmtArg.value.kind !== "StringValue") {
        throw new Error("@cypher statement not a string");
    }

    const statement = stmtArg.value.value;

    return {
        statement,
    };
}

export default getCypherMeta;

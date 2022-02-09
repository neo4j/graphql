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

import { Node } from "../classes";
import { RELATIONSHIP_REQUIREMENT_PREFIX } from "../constants";
import { Context } from "../types";

function createRelationshipValidationString({
    node,
    context,
    varName,
}: {
    node: Node;
    context: Context;
    varName: string;
}): string {
    const nonNullRelationFields = node.relationFields.filter((field) => {
        if (field.typeMeta.array) {
            return false;
        }

        const isRequired = field.typeMeta.required;
        const isUnionOrInterface = Boolean(field.union) || Boolean(field.interface);

        return isRequired && !isUnionOrInterface;
    });

    if (!nonNullRelationFields.length) {
        return "";
    }

    const nonNullPredicates = nonNullRelationFields.map((field) => {
        const toNode = context.neoSchema.nodes.find((n) => n.name === field.typeMeta.name) as Node;
        const inStr = field.direction === "IN" ? "<-" : "-";
        const outStr = field.direction === "OUT" ? "->" : "-";
        const relVarname = `${varName}_${field.fieldName}_${toNode.name}_unique`;

        const subQuery = [
            `CALL {`,
            `\tWITH ${varName}`,
            `\tMATCH (${varName})${inStr}[${relVarname}:${field.type}]${outStr}(${toNode.getLabelString(context)})`,
            `\tWITH count(${relVarname}) as c`,
            `\tCALL apoc.util.validate(NOT(c = 1), '${RELATIONSHIP_REQUIREMENT_PREFIX}${node.name}.${field.fieldName} required', [0])`,
            `\tRETURN c AS ${relVarname}_ignored`,
            `}`,
        ].join("\n");

        return subQuery;
    });

    return nonNullPredicates.join("\n");
}

export default createRelationshipValidationString;

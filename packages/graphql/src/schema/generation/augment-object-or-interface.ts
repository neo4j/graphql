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
import type { DirectiveNode } from "graphql";
import type { Directive } from "graphql-compose";
import type { Subgraph } from "../../classes/Subgraph";
import { QueryOptions } from "../../graphql/input-objects/QueryOptions";
import { UnionEntityAdapter } from "../../schema-model/entity/model-adapters/UnionEntityAdapter";
import type { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { getDirectedArgument } from "../directed-argument";
import { graphqlDirectivesToCompose } from "../to-compose";

export function augmentObjectOrInterfaceTypeWithRelationshipField(
    relationshipAdapter: RelationshipAdapter,
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>,
    subgraph?: Subgraph | undefined
): Record<string, { type: string; description?: string; directives: Directive[]; args?: any }> {
    const fields = {};
    const relationshipField: { type: string; description?: string; directives: Directive[]; args?: any } = {
        type: relationshipAdapter.getTargetTypePrettyName(),
        description: relationshipAdapter.description,
        directives: graphqlDirectivesToCompose(userDefinedFieldDirectives.get(relationshipAdapter.name) || []),
    };

    let generateRelFieldArgs = true;

    // Subgraph schemas do not support arguments on relationship fields (singular)
    if (subgraph) {
        if (!relationshipAdapter.isList) {
            generateRelFieldArgs = false;
        }
    }

    if (generateRelFieldArgs) {
        // TODO: replace name reference with getType method
        const optionsTypeName =
            relationshipAdapter.target instanceof UnionEntityAdapter
                ? QueryOptions
                : relationshipAdapter.target.operations.optionsInputTypeName;
        const whereTypeName = relationshipAdapter.target.operations.whereInputTypeName;
        const nodeFieldsArgs = {
            where: whereTypeName,
            options: optionsTypeName,
        };
        const directedArg = getDirectedArgument(relationshipAdapter);
        if (directedArg) {
            nodeFieldsArgs["directed"] = directedArg;
        }
        relationshipField.args = nodeFieldsArgs;
    }

    if (relationshipAdapter.isReadable()) {
        fields[relationshipAdapter.name] = relationshipField;
    }
    return fields;
}

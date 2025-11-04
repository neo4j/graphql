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
import { GraphQLInt, GraphQLString, type DirectiveNode, type GraphQLResolveInfo } from "graphql";
import type { Directive, ObjectTypeComposerArgumentConfigMapDefinition, SchemaComposer } from "graphql-compose";
import type { Subgraph } from "../../classes/Subgraph";
import { DEPRECATED } from "../../constants";
import { QueryOptions } from "../../graphql/input-objects/QueryOptions";
import { UnionEntityAdapter } from "../../schema-model/entity/model-adapters/UnionEntityAdapter";
import { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { RelationshipDeclarationAdapter } from "../../schema-model/relationship/model-adapters/RelationshipDeclarationAdapter";
import type { ConnectionQueryArgs, Neo4jFeaturesSettings } from "../../types";
import { addDirectedArgument, getDirectedArgument } from "../directed-argument";
import { connectionFieldResolver } from "../pagination";
import { graphqlDirectivesToCompose } from "../to-compose";
import {
    makeConnectionWhereInputType,
    withConnectionObjectType,
    withConnectionSortInputType,
} from "./connection-where-input";

export function augmentObjectOrInterfaceTypeWithRelationshipField(
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter,
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>,
    subgraph?: Subgraph | undefined
): Record<string, { type: string; description?: string; directives: Directive[]; args?: any }> {
    const fields = {};
    const relationshipField: { type: string; description?: string; directives: Directive[]; args?: any } = {
        type: relationshipAdapter.operations.getTargetTypePrettyName(),
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
        const relationshipTarget =
            relationshipAdapter instanceof RelationshipAdapter && relationshipAdapter.originalTarget
                ? relationshipAdapter.originalTarget
                : relationshipAdapter.target;

        const optionsTypeName =
            relationshipTarget instanceof UnionEntityAdapter
                ? QueryOptions
                : relationshipTarget.operations.optionsInputTypeName;
        const whereTypeName = relationshipTarget.operations.whereInputTypeName;

        const nodeFieldsArgs = {
            where: whereTypeName,
            options: optionsTypeName,
        };
        if (relationshipAdapter instanceof RelationshipAdapter) {
            const directedArg = getDirectedArgument(relationshipAdapter);
            if (directedArg) {
                nodeFieldsArgs["directed"] = directedArg;
            }
        }
        relationshipField.args = nodeFieldsArgs;
    }

    if (relationshipAdapter.isReadable()) {
        fields[relationshipAdapter.name] = relationshipField;
    }
    return fields;
}

export function augmentObjectOrInterfaceTypeWithConnectionField(
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter,
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>,
    schemaComposer: SchemaComposer,
    features: Neo4jFeaturesSettings | undefined
): Record<string, { type: string; description?: string; directives: Directive[]; args?: any }> {
    const fields = {};
    const deprecatedDirectives = graphqlDirectivesToCompose(
        (userDefinedFieldDirectives.get(relationshipAdapter.name) || []).filter(
            (directive) => directive.name.value === DEPRECATED
        )
    );
    const composeNodeArgs = addDirectedArgument<ObjectTypeComposerArgumentConfigMapDefinition>(
        {
            where: makeConnectionWhereInputType({
                relationshipAdapter,
                composer: schemaComposer,
                features,
            }),
            first: {
                type: GraphQLInt,
            },
            after: {
                type: GraphQLString,
            },
        },
        relationshipAdapter
    );
    const connectionSortITC = withConnectionSortInputType({
        relationshipAdapter,
        composer: schemaComposer,
    });
    if (connectionSortITC) {
        composeNodeArgs.sort = connectionSortITC.NonNull.List;
    }

    if (relationshipAdapter.isReadable()) {
        fields[relationshipAdapter.operations.connectionFieldName] = {
            type: withConnectionObjectType({
                relationshipAdapter,
                composer: schemaComposer,
            }).NonNull,
            args: composeNodeArgs,
            directives: deprecatedDirectives,
            resolve: (source: any, args: ConnectionQueryArgs, _ctx: any, info: GraphQLResolveInfo) => {
                return connectionFieldResolver({
                    connectionFieldName: relationshipAdapter.operations.connectionFieldName,
                    args,
                    info,
                    source,
                });
            },
        };
    }
    return fields;
}

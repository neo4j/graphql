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

import type { Maybe } from "@graphql-tools/utils";
import type {
    DocumentNode,
    EnumTypeDefinitionNode,
    GraphQLError,
    GraphQLSchema,
    InterfaceTypeDefinitionNode,
    InterfaceTypeExtensionNode,
    ObjectTypeDefinitionNode,
    ObjectTypeExtensionNode,
    UnionTypeDefinitionNode,
    UnionTypeExtensionNode,
} from "graphql";
import { Kind } from "graphql";
import { SDLValidationContext } from "graphql/validation/ValidationContext";

export type ObjectExtensionsTypeMap = Record<
    string,
    {
        extensions: (ObjectTypeExtensionNode | InterfaceTypeExtensionNode | UnionTypeExtensionNode)[];
        definition:
            | ObjectTypeDefinitionNode
            | InterfaceTypeDefinitionNode
            | UnionTypeDefinitionNode
            | EnumTypeDefinitionNode;
    }
>;
export class Neo4jValidationContext extends SDLValidationContext {
    public readonly extensionsTypeMap?: ObjectExtensionsTypeMap;
    public readonly callbacks?: any;
    constructor(
        ast: DocumentNode,
        schema: Maybe<GraphQLSchema>,
        onError: (error: GraphQLError) => void,
        callbacks?: any
    ) {
        super(ast, schema, onError);
        this.callbacks = callbacks;
        this.extensionsTypeMap = ast.definitions.reduce((acc, def): ObjectExtensionsTypeMap => {
            if (
                def.kind === Kind.OBJECT_TYPE_DEFINITION ||
                def.kind === Kind.INTERFACE_TYPE_DEFINITION ||
                def.kind === Kind.UNION_TYPE_DEFINITION ||
                def.kind === Kind.ENUM_TYPE_DEFINITION ||
                def.kind === Kind.OBJECT_TYPE_EXTENSION ||
                def.kind === Kind.INTERFACE_TYPE_EXTENSION ||
                def.kind === Kind.UNION_TYPE_EXTENSION
            ) {
                const typeName = def.name.value;
                if (!acc[typeName]) {
                    acc[typeName] = { extensions: [], definition: undefined };
                }
                if (
                    def.kind === Kind.OBJECT_TYPE_EXTENSION ||
                    def.kind === Kind.INTERFACE_TYPE_EXTENSION ||
                    def.kind === Kind.UNION_TYPE_EXTENSION
                ) {
                    if (acc[typeName].extensions) {
                        acc[typeName].extensions.push(def);
                    } else {
                        acc[typeName].extensions = [def];
                    }
                } else {
                    acc[typeName].definition = def;
                }
            }
            return acc;
        }, {});
    }
}

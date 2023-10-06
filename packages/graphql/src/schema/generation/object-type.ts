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
import { GraphQLID, GraphQLNonNull } from "graphql";
import type { ObjectTypeComposer, SchemaComposer } from "graphql-compose";
import { InterfaceEntity } from "../../schema-model/entity/InterfaceEntity";
import type { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { attributeAdapterToComposeFields, graphqlDirectivesToCompose } from "../to-compose";

export function withObjectType({
    concreteEntityAdapter,
    userDefinedFieldDirectives,
    userDefinedObjectDirectives,
    composer,
}: {
    concreteEntityAdapter: ConcreteEntityAdapter;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
    userDefinedObjectDirectives: DirectiveNode[];
    composer: SchemaComposer;
}): ObjectTypeComposer {
    const nodeFields = attributeAdapterToComposeFields(concreteEntityAdapter.objectFields, userDefinedFieldDirectives);
    const composeNode = composer.createObjectTC({
        name: concreteEntityAdapter.name,
        fields: nodeFields,
        description: concreteEntityAdapter.description,
        directives: graphqlDirectivesToCompose(userDefinedObjectDirectives),
        interfaces: concreteEntityAdapter.compositeEntities
            .filter((e) => e instanceof InterfaceEntity)
            .map((e) => e.name),
    });

    // TODO: maybe split this global node logic?
    if (concreteEntityAdapter.isGlobalNode()) {
        composeNode.setField("id", {
            type: new GraphQLNonNull(GraphQLID),
            resolve: (src) => {
                const field = concreteEntityAdapter.globalIdField.name;
                const value = src[field] as string | number;
                return concreteEntityAdapter.toGlobalId(value.toString());
            },
        });

        composeNode.addInterface("Node");
    }
    return composeNode;
}

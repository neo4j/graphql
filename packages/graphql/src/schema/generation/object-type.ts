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
import { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { attributeAdapterToComposeFields, graphqlDirectivesToCompose } from "../to-compose";

export function getRelationshipPropertiesTypeDescription({
    relationshipAdapter,
    propertiesObjectType,
}: {
    relationshipAdapter: RelationshipAdapter;
    propertiesObjectType?: ObjectTypeComposer;
}): string {
    if (propertiesObjectType) {
        return [
            propertiesObjectType.getDescription(),
            `* ${relationshipAdapter.source.name}.${relationshipAdapter.name}`,
        ].join("\n");
    }
    return `The edge properties for the following fields:\n* ${relationshipAdapter.source.name}.${relationshipAdapter.name}`;
}

export function withObjectType({
    entityAdapter,
    userDefinedFieldDirectives,
    userDefinedObjectDirectives,
    composer,
}: {
    entityAdapter: ConcreteEntityAdapter | RelationshipAdapter;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
    userDefinedObjectDirectives: DirectiveNode[];
    composer: SchemaComposer;
}): ObjectTypeComposer {
    if (entityAdapter instanceof RelationshipAdapter) {
        // @relationshipProperties
        const objectComposeFields = attributeAdapterToComposeFields(
            Array.from(entityAdapter.attributes.values()),
            userDefinedFieldDirectives
        );
        const composeObject = composer.createObjectTC({
            name: entityAdapter.propertiesTypeName as string, // this is checked one layer above in execution
            fields: objectComposeFields,
            directives: graphqlDirectivesToCompose(userDefinedObjectDirectives),
            description: getRelationshipPropertiesTypeDescription({ relationshipAdapter: entityAdapter }),
        });
        return composeObject;
    }

    const nodeFields = attributeAdapterToComposeFields(entityAdapter.objectFields, userDefinedFieldDirectives);
    const composeNode = composer.createObjectTC({
        name: entityAdapter.name,
        fields: nodeFields,
        description: entityAdapter.description,
        directives: graphqlDirectivesToCompose(userDefinedObjectDirectives),
        interfaces: entityAdapter.compositeEntities.filter((e) => e instanceof InterfaceEntity).map((e) => e.name),
    });

    // TODO: maybe split this global node logic?
    if (entityAdapter.isGlobalNode()) {
        composeNode.setField("id", {
            type: new GraphQLNonNull(GraphQLID),
            resolve: (src) => {
                const field = entityAdapter.globalIdField.name;
                const value = src[field] as string | number;
                return entityAdapter.toGlobalId(value.toString());
            },
        });

        composeNode.addInterface("Node");
    }
    return composeNode;
}

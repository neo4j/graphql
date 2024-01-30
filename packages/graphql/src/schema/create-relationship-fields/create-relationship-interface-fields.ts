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
import type { ObjectTypeComposer, SchemaComposer, InterfaceTypeComposer } from "graphql-compose";
import { DEPRECATED } from "../../constants";
import type { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { RelationshipDeclarationAdapter } from "../../schema-model/relationship/model-adapters/RelationshipDeclarationAdapter";
import {
    augmentObjectOrInterfaceTypeWithConnectionField,
    augmentObjectOrInterfaceTypeWithRelationshipField,
} from "../generation/augment-object-or-interface";
import { augmentConnectInputTypeWithConnectFieldInput } from "../generation/connect-input";
import { augmentCreateInputTypeWithRelationshipsInput, withFieldInputType } from "../generation/create-input";
import { augmentDeleteInputTypeWithDeleteFieldInput } from "../generation/delete-input";
import { augmentDisconnectInputTypeWithDisconnectFieldInput } from "../generation/disconnect-input";
import { withRelationInputType } from "../generation/relation-input";
import { augmentUpdateInputTypeWithUpdateFieldInput } from "../generation/update-input";
import { withSourceWhereInputType } from "../generation/where-input";
import { graphqlDirectivesToCompose } from "../to-compose";

export function createRelationshipInterfaceFields({
    relationship,
    composeNode,
    schemaComposer,
    userDefinedFieldDirectives,
}: {
    relationship: RelationshipAdapter | RelationshipDeclarationAdapter;
    composeNode: ObjectTypeComposer | InterfaceTypeComposer;
    schemaComposer: SchemaComposer;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
}) {
    const userDefinedDirectivesOnField = userDefinedFieldDirectives.get(relationship.name);
    const deprecatedDirectives = graphqlDirectivesToCompose(
        (userDefinedDirectivesOnField || []).filter((directive) => directive.name.value === DEPRECATED)
    );

    withSourceWhereInputType({ relationshipAdapter: relationship, composer: schemaComposer, deprecatedDirectives });
    // ======== all relationships but DEPENDENCY ALERT:
    // this has to happen for InterfaceRelationships (Interfaces that are target of relationships) before it happens for ConcreteEntity targets
    // it has sth to do with fieldInputPrefixForTypename vs prefixForTypename
    // requires investigation
    withFieldInputType({ relationshipAdapter: relationship, composer: schemaComposer, userDefinedFieldDirectives });

    // ======== all relationships:
    composeNode.addFields(augmentObjectOrInterfaceTypeWithRelationshipField(relationship, userDefinedFieldDirectives));

    composeNode.addFields(
        augmentObjectOrInterfaceTypeWithConnectionField(relationship, userDefinedFieldDirectives, schemaComposer)
    );

    withRelationInputType({
        relationshipAdapter: relationship,
        composer: schemaComposer,
        deprecatedDirectives: [],
        userDefinedFieldDirectives,
    });

    augmentCreateInputTypeWithRelationshipsInput({
        relationshipAdapter: relationship,
        composer: schemaComposer,
        deprecatedDirectives: [],
        userDefinedFieldDirectives,
    });

    augmentConnectInputTypeWithConnectFieldInput({
        relationshipAdapter: relationship,
        composer: schemaComposer,
        deprecatedDirectives: [],
    });

    augmentDeleteInputTypeWithDeleteFieldInput({
        relationshipAdapter: relationship,
        composer: schemaComposer,
        deprecatedDirectives: [],
    });

    augmentDisconnectInputTypeWithDisconnectFieldInput({
        relationshipAdapter: relationship,
        composer: schemaComposer,
        deprecatedDirectives: [],
    });

    augmentUpdateInputTypeWithUpdateFieldInput({
        relationshipAdapter: relationship,
        composer: schemaComposer,
        deprecatedDirectives: [],
        userDefinedFieldDirectives,
    });
}

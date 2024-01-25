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
import type { Directive, InterfaceTypeComposer, ObjectTypeComposer, SchemaComposer } from "graphql-compose";
import type { Subgraph } from "../../classes/Subgraph";
import type { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { RelationshipDeclarationAdapter } from "../../schema-model/relationship/model-adapters/RelationshipDeclarationAdapter";
import { augmentObjectOrInterfaceTypeWithRelationshipField } from "../generation/augment-object-or-interface";
import { augmentConnectInputTypeWithConnectFieldInput } from "../generation/connect-input";
import { withConnectOrCreateInputType } from "../generation/connect-or-create-input";
import { augmentCreateInputTypeWithRelationshipsInput } from "../generation/create-input";
import { augmentDeleteInputTypeWithDeleteFieldInput } from "../generation/delete-input";
import { augmentDisconnectInputTypeWithDisconnectFieldInput } from "../generation/disconnect-input";
import { withRelationInputType } from "../generation/relation-input";
import { augmentUpdateInputTypeWithUpdateFieldInput } from "../generation/update-input";
import { withSourceWhereInputType } from "../generation/where-input";

export function createRelationshipConcreteFields({
    relationshipAdapter,
    composeNode,
    schemaComposer,
    userDefinedFieldDirectives,
    deprecatedDirectives,
    subgraph,
}: {
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter;
    composeNode: ObjectTypeComposer | InterfaceTypeComposer;
    schemaComposer: SchemaComposer;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
    deprecatedDirectives: Directive[];
    subgraph?: Subgraph;
}) {
    withSourceWhereInputType({ relationshipAdapter, composer: schemaComposer, deprecatedDirectives });

    withConnectOrCreateInputType({
        relationshipAdapter,
        composer: schemaComposer,
        userDefinedFieldDirectives,
        deprecatedDirectives,
    });

    composeNode.addFields(
        augmentObjectOrInterfaceTypeWithRelationshipField(relationshipAdapter, userDefinedFieldDirectives, subgraph)
    );

    withRelationInputType({
        relationshipAdapter,
        composer: schemaComposer,
        deprecatedDirectives,
        userDefinedFieldDirectives,
    });

    augmentCreateInputTypeWithRelationshipsInput({
        relationshipAdapter,
        composer: schemaComposer,
        deprecatedDirectives,
        userDefinedFieldDirectives,
    });

    augmentConnectInputTypeWithConnectFieldInput({
        relationshipAdapter,
        composer: schemaComposer,
        deprecatedDirectives,
    });

    augmentUpdateInputTypeWithUpdateFieldInput({
        relationshipAdapter,
        composer: schemaComposer,
        deprecatedDirectives,
        userDefinedFieldDirectives,
    });

    augmentDeleteInputTypeWithDeleteFieldInput({
        relationshipAdapter,
        composer: schemaComposer,
        deprecatedDirectives,
    });

    augmentDisconnectInputTypeWithDisconnectFieldInput({
        relationshipAdapter,
        composer: schemaComposer,
        deprecatedDirectives,
    });
}

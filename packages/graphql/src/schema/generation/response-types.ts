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
import { GraphQLNonNull } from "graphql";
import type { SchemaComposer } from "graphql-compose";
import { CreateInfo } from "../../graphql/objects/CreateInfo";
import { UpdateInfo } from "../../graphql/objects/UpdateInfo";
import type { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { graphqlDirectivesToCompose } from "../to-compose";

export function withMutationResponseTypes({
    concreteEntityAdapter,
    propagatedDirectives,
    composer,
}: {
    concreteEntityAdapter: ConcreteEntityAdapter;
    propagatedDirectives: DirectiveNode[];
    composer: SchemaComposer;
}): void {
    composer.createObjectTC({
        name: concreteEntityAdapter.operations.mutationResponseTypeNames.create,
        fields: {
            info: new GraphQLNonNull(CreateInfo),
            [concreteEntityAdapter.plural]: `[${concreteEntityAdapter.name}!]!`,
        },
        directives: graphqlDirectivesToCompose(propagatedDirectives),
    });

    composer.createObjectTC({
        name: concreteEntityAdapter.operations.mutationResponseTypeNames.update,
        fields: {
            info: new GraphQLNonNull(UpdateInfo),
            [concreteEntityAdapter.plural]: `[${concreteEntityAdapter.name}!]!`,
        },
        directives: graphqlDirectivesToCompose(propagatedDirectives),
    });
}

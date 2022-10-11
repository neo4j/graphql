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

import { buildSubgraphSchema } from "@apollo/subgraph";
import type { GraphQLResolverMap, GraphQLSchemaModule } from "@apollo/subgraph/dist/schema-helper";
import { OGM } from "@neo4j/graphql-ogm";
import type { DocumentNode, GraphQLSchema } from "graphql";

export interface FederationPluginInput {
    typeDefs: string;
}

class Neo4jGraphQLAuthJWTPlugin {
    private ogm: OGM;

    constructor(input: FederationPluginInput) {
        this.ogm = new OGM({ typeDefs: input.typeDefs });
    }

    getResolveReference(__typename: string) {
        const __resolveReference = (reference, context): Promise<any> => {
            const model = this.ogm.model(__typename);
            return model.find({ where: reference, context });
        };
        return __resolveReference;
    }

    getSchema(
        modulesOrSDL:
            | (GraphQLSchemaModule | DocumentNode)[]
            | DocumentNode
            | {
                  typeDefs: DocumentNode | DocumentNode[];
                  resolvers?: GraphQLResolverMap<unknown>;
              }
    ): GraphQLSchema {
        return buildSubgraphSchema(modulesOrSDL);
    }
}

export default Neo4jGraphQLAuthJWTPlugin;

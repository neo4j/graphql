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

import type { TypeSource } from "@graphql-tools/utils";
import { GraphQLSchema, print } from "graphql";
import { Neo4jGraphQL } from "../../../../../graphql/src";
import { Neo4jGraphQLApolloFederationPlugin } from "../../../src";

export class Subgraph {
    plugin: Neo4jGraphQLApolloFederationPlugin;
    library: Neo4jGraphQL;

    constructor(typeDefs: TypeSource) {
        this.plugin = new Neo4jGraphQLApolloFederationPlugin(typeDefs);

        this.library = new Neo4jGraphQL({
            typeDefs,
            // @ts-ignore: federation slot not yet released
            plugins: { federation: this.plugin },
            config: { skipValidateTypeDefs: true },
        });
    }

    public async getSchema(): Promise<GraphQLSchema> {
        const { typeDefs, resolvers } = await this.library.getSchemaDefinition();

        const schema = this.plugin.buildSubgraphSchema({ typeDefs, resolvers });

        return schema;
    }
}

/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { DocumentNode, GraphQLSchema } from "graphql";
import type * as neo4j from "neo4j-driver";
import { Neo4jGraphQL } from "../../../../src";

export class TestSubgraph {
    library: Neo4jGraphQL;

    constructor({
        typeDefs,
        resolvers,
        driver,
    }: {
        typeDefs: string | DocumentNode;
        resolvers?: any;
        driver: neo4j.Driver;
    }) {
        this.library = new Neo4jGraphQL({
            typeDefs,
            resolvers,
            driver,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });
    }

    public async getSchema(): Promise<GraphQLSchema> {
        const schema = await this.library.getSubgraphSchema();

        return schema;
    }
}

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

const { ApolloServer } = require("apollo-server");
const { Neo4jGraphQL } = require("@neo4j/graphql");

const defaultTypeDefs = `
    type Movie {
        title: String
        year: Int
        imdbRating: Float
        genres: [Genre!]! @relationship(type: "IN_GENRE", direction: OUT)
    }

    type Genre {
        name: String
        movies: [Movie!]! @relationship(type: "IN_GENRE", direction: IN)
    }
`;

async function start(typeDefs = defaultTypeDefs, driver = {}) {
    const neoSchema = new Neo4jGraphQL({ typeDefs });
    const server = new ApolloServer({
        schema: neoSchema.schema,
        context: ({ req }) => ({ driver, req }),
    });
    const { url } = await server.listen();
    // eslint-disable-next-line no-console
    console.log(`🚀  Server ready at ${url}`);
}

function stop() {
    process.exit(0);
}

module.exports = { start, stop };

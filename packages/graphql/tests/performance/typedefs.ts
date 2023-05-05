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

import { gql } from "graphql-tag";

export const typeDefs = gql`
    union Likable = Person | Movie

    type Person {
        name: String!
        born: Int!
        movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
        directed: [Movie!]! @relationship(type: "DIRECTED", direction: OUT)
        reviewed: [Movie!]! @relationship(type: "REVIEWED", direction: OUT)
        produced: [Movie!]! @relationship(type: "PRODUCED", direction: OUT)
        likes: [Likable!]! @relationship(type: "LIKES", direction: OUT)
    }

    type Movie
        @fulltext(
            indexes: [
                { queryName: "movieTaglineFulltextQuery", name: "MovieTaglineFulltextIndex", fields: ["tagline"] }
            ]
        ) {
        id: ID!
        title: String!
        tagline: String
        released: Int
        actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN)
        directors: [Person!]! @relationship(type: "DIRECTED", direction: IN)
        reviewers: [Person!]! @relationship(type: "REVIEWED", direction: IN)
        producers: [Person!]! @relationship(type: "PRODUCED", direction: IN)
        likedBy: [User!]! @relationship(type: "LIKES", direction: IN)
        oneActorName: String
            @cypher(statement: "MATCH (this)<-[:ACTED_IN]-(a:Person) RETURN a.name AS name", columnName: "name")
        favouriteActor: Person @relationship(type: "FAV", direction: OUT)
    }

    type MovieClone {
        title: String!
        favouriteActor: Person! @relationship(type: "FAV", direction: OUT)
    }
    type PersonClone {
        name: String!
        movies: [MovieClone!]! @relationship(type: "FAV", direction: IN)
    }

    type User {
        name: String!
        likes: [Likable!]! @relationship(type: "LIKES", direction: OUT)
    }

    type Query {
        customCypher: [Person]
            @cypher(
                statement: """
                MATCH(m:Movie)--(p:Person)
                WHERE m.released > 2000
                RETURN p
                """
                columnName: "p"
            )
    }

    type Mutation {
        getCustomUser: [Person]!
            @cypher(
                statement: """
                MATCH (user:Person { name_INCLUDES: "Wa" })
                RETURN user
                """
                columnName: "user"
            )
    }
`;

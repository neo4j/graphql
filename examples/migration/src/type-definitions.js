const { gql } = require("apollo-server");

const typeDefs = gql`
    type Movie {
        title: String!
        reviews: [Review!]! @relation(name: "HAS_REVIEW", direction: OUT)
        averageRating: Float!
            @cypher(
                statement: """
                MATCH (this)-[:HAS_REVIEW]->(r:Review)
                RETURN avg(r.rating)
                """
            )
    }

    type Review {
        id: ID! @id
        rating: Float!
        createdAt: DateTime!
        content: String!
        author: User! @relation(name: "AUTHORED", direction: IN)
        movie: Movie! @relation(name: "HAS_REVIEW", direction: IN)
    }

    type User {
        username: String!
        reviews: [Review!]! @relation(name: "AUTHORED", direction: OUT)
    }
`;

module.exports = typeDefs;

import { gql } from "apollo-server-express";

export const typeDefs = gql`
    type Blog {
        id: ID! @id
        name: String!
        creator: User @relationship(type: "HAS_BLOG", direction: IN)
        authors: [User] @relationship(type: "CAN_POST", direction: IN)
        subscribers: [User] @relationship(type: "SUBSCRIBED_TO", direction: IN)
        posts: [Post] @relationship(type: "HAS_POST", direction: OUT)
        isCreator: Boolean
            @cypher(
                statement: """
                OPTIONAL MATCH (this)<-[:HAS_BLOG]-(creator:User {id: $auth.jwt.sub})
                WITH creator IS NOT NULL AS isCreator
                RETURN isCreator
                """
            )
        isAuthor: Boolean
            @cypher(
                statement: """
                OPTIONAL MATCH (this)<-[:CAN_POST]-(author:User {id: $auth.jwt.sub})
                WITH author IS NOT NULL AS isAuthor
                RETURN isAuthor
                """
            )
        createdAt: DateTime @timestamp(operations: [CREATE])
        updatedAt: DateTime @timestamp(operations: [UPDATE])
    }

    extend type Blog
        @auth(
            rules: [
                { operations: [CREATE], bind: { creator: { id: "$jwt.sub" } } }
                { operations: [UPDATE], allow: { creator: { id: "$jwt.sub" } }, bind: { creator: { id: "$jwt.sub" } } }
                {
                    operations: [CONNECT]
                    allow: { OR: [{ creator: { id: "$jwt.sub" } }, { authors: { id: "$jwt.sub" } }] }
                }
                {
                    operations: [DISCONNECT]
                    allow: {
                        OR: [
                            { creator: { id: "$jwt.sub" } }
                            { authors: { id: "$jwt.sub" } }
                            { posts: { author: { id: "$jwt.sub" } } }
                        ]
                    }
                }
                { operations: [DELETE], allow: { creator: { id: "$jwt.sub" } } }
            ]
        )
`;

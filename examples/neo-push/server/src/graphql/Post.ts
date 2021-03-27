import { gql } from "apollo-server-express";

export const typeDefs = gql`
    type Post {
        id: ID! @id(autogenerate: true)
        title: String!
        content: String!
        blog: Blog @relationship(type: "HAS_POST", direction: IN)
        comments: [Comment] @relationship(type: "HAS_COMMENT", direction: OUT)
        author: User @relationship(type: "WROTE", direction: IN)
        canEdit: Boolean
            @cypher(
                statement: """
                OPTIONAL MATCH (this)<-[:WROTE]-(author:User {id: $auth.jwt.sub})
                OPTIONAL MATCH (this)<-[:HAS_POST]-(blog:Blog)
                OPTIONAL MATCH (blog)<-[:HAS_BLOG]-(blogCreator:User {id: $auth.jwt.sub})
                OPTIONAL MATCH (blog)<-[:CAN_POST]-(blogAuthors:User {id: $auth.jwt.sub})
                WITH (
                    (author IS NOT NULL) OR
                    (blogCreator IS NOT NULL) OR
                    (blogAuthors IS NOT NULL)
                ) AS canEdit
                RETURN canEdit
                """
            )
        canDelete: Boolean
            @cypher(
                statement: """
                OPTIONAL MATCH (this)<-[:WROTE]-(author:User {id: $auth.jwt.sub})
                OPTIONAL MATCH (this)<-[:HAS_POST]-(blog:Blog)
                OPTIONAL MATCH (blog)<-[:HAS_BLOG]-(blogCreator:User {id: $auth.jwt.sub})
                WITH (
                    (author IS NOT NULL) OR
                    (blogCreator IS NOT NULL)
                ) AS canDelete
                RETURN canDelete
                """
            )
        createdAt: DateTime @timestamp(operations: [CREATE])
        updatedAt: DateTime @timestamp(operations: [UPDATE])
    }

    extend type Post
        @auth(
            rules: [
                { operations: ["create"], bind: { author: { id: "$jwt.sub" } } }
                {
                    operations: ["update"]
                    allow: {
                        OR: [
                            { author: { id: "$jwt.sub" } }
                            { blog: { OR: [{ creator: { id: "$jwt.sub" } }, { authors: { id: "$jwt.sub" } }] } }
                        ]
                    }
                }
                { operations: ["connect"], isAuthenticated: true }
                {
                    operations: ["delete", "disconnect"]
                    allow: { OR: [{ author: { id: "$jwt.sub" } }, { blog: { creator: { id: "$jwt.sub" } } }] }
                }
            ]
        )
`;

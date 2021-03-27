import { gql } from "apollo-server-express";

export const typeDefs = gql`
    type Comment {
        id: ID! @id(autogenerate: true)
        author: User @relationship(type: "COMMENTED", direction: IN)
        content: String!
        post: Post @relationship(type: "HAS_COMMENT", direction: IN)
        canDelete: Boolean
            @cypher(
                statement: """
                OPTIONAL MATCH (this)<-[:COMMENTED]-(author:User {id: $auth.jwt.sub})
                OPTIONAL MATCH (this)<-[:HAS_COMMENT]-(post:Post)
                OPTIONAL MATCH (post)<-[:WROTE]-(postAuthor:User {id: $auth.jwt.sub})
                OPTIONAL MATCH (post)<-[:HAS_POST]-(blog:Blog)
                OPTIONAL MATCH (blog)<-[:HAS_BLOG]-(blogCreator:User {id: $auth.jwt.sub})
                WITH (
                    (author IS NOT NULL) OR
                    (postAuthor IS NOT NULL) OR
                    (blogCreator IS NOT NULL)
                ) AS canDelete
                RETURN canDelete
                """
            )
        createdAt: DateTime @timestamp(operations: [CREATE])
        updatedAt: DateTime @timestamp(operations: [UPDATE])
    }

    extend type Comment
        @auth(
            rules: [
                { operations: ["create"], bind: { author: { id: "$jwt.sub" } } }
                {
                    operations: ["update", "connect"]
                    allow: { author: { id: "$jwt.sub" } }
                    bind: { author: { id: "$jwt.sub" } }
                }
                {
                    operations: ["delete", "disconnect"]
                    allow: {
                        OR: [
                            { author: { id: "$jwt.sub" } }
                            {
                                post: {
                                    OR: [{ author: { id: "$jwt.sub" } }, { blog: { creator: { id: "$jwt.sub" } } }]
                                }
                            }
                        ]
                    }
                }
            ]
        )
`;

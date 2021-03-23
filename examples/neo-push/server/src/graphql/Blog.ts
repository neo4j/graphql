import gql from "graphql-tag";

export const typeDefs = gql`
    type Blog {
        id: ID! @autogenerate
        name: String!
        creator: User @relationship(type: "HAS_BLOG", direction: IN)
        authors: [User] @relationship(type: "CAN_POST", direction: IN)
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
        createdAt: DateTime @autogenerate(operations: ["create"])
        updatedAt: DateTime @autogenerate(operations: ["update"])
    }

    extend type Blog
        @auth(
            rules: [
                { operations: ["create"], bind: { creator: { id: "$jwt.sub" } } }
                {
                    operations: ["update"]
                    allow: { creator: { id: "$jwt.sub" } }
                    bind: { creator: { id: "$jwt.sub" } }
                }
                {
                    operations: ["connect"]
                    allow: { OR: [{ creator: { id: "$jwt.sub" } }, { authors: { id: "$jwt.sub" } }] }
                }
                {
                    operations: ["disconnect"]
                    allow: {
                        OR: [
                            { creator: { id: "$jwt.sub" } }
                            { authors: { id: "$jwt.sub" } }
                            { posts: { author: { id: "$jwt.sub" } } }
                        ]
                    }
                }
                { operations: ["delete"], allow: { creator: { id: "$jwt.sub" } } }
            ]
        )
`;

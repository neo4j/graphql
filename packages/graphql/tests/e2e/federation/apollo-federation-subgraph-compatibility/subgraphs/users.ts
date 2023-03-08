import { gql } from "graphql-tag";
import { buildSubgraphSchema } from "@apollo/subgraph";

const users = [
    {
        email: "support@apollographql.com",
        name: "Apollo Studio Support",
        totalProductsCreated: 10,
        yearsOfEmployment: 10,
    },
];

const typeDefs = gql`
    type User @key(fields: "email") {
        email: ID!
        name: String
        totalProductsCreated: Int
        yearsOfEmployment: Int!
    }
`;

const resolvers = {
    User: {
        __resolveReference: (reference) => {
            return users.find((u) => u.email == reference.email);
        },
    },
};

export const schema = buildSubgraphSchema({ typeDefs, resolvers });

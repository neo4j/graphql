import gql from "graphql-tag";
import { Context } from "../types";
import { comparePassword, createJWT, hashPassword } from "../utils";

export const typeDefs = gql`
    type User {
        id: ID! @autogenerate
        email: String!
        createdBlogs: [Blog] @relationship(type: "HAS_BLOG", direction: OUT)
        authorsBlogs: [Blog] @relationship(type: "CAN_POST", direction: OUT)
        password: String! @private
        createdAt: DateTime @autogenerate(operations: ["create"])
        updatedAt: DateTime @autogenerate(operations: ["update"])
    }

    extend type User
        @auth(
            rules: [
                { operations: ["connect"], isAuthenticated: true }
                { operations: ["update"], allow: { id: "$jwt.sub" }, bind: { id: "$jwt.sub" } }
                { operations: ["delete"], allow: { id: "$jwt.sub" } }
                {
                    operations: ["disconnect"]
                    allow: {
                        OR: [
                            { id: "$jwt.sub" }
                            { createdBlogs: { OR: [{ creator: { id: "$jwt.sub" } }, { authors: { id: "$jwt.sub" } }] } }
                            { authorsBlogs: { OR: [{ creator: { id: "$jwt.sub" } }, { authors: { id: "$jwt.sub" } }] } }
                        ]
                    }
                }
            ]
        )

    type Mutation {
        signUp(email: String!, password: String!): String # JWT
        signIn(email: String!, password: String!): String # JWT
    }
`;

export const resolvers = {
    Mutation: {
        signUp,
        signIn,
    },
};

async function signUp(_root, args: { email: string; password: string }, context: Context) {
    const User = context.ogm.model("User");

    const [existing] = await User.find({
        where: { email: args.email },
        context: { ...context, adminOverride: true },
    });
    if (existing) {
        throw new Error("user with that email already exists");
    }

    const hash = await hashPassword(args.password);

    const [user] = (
        await User.create({
            input: [
                {
                    email: args.email,
                    password: hash,
                },
            ],
        })
    ).users;

    const jwt = createJWT({ sub: user.id });

    return jwt;
}

async function signIn(_root, args: { email: string; password: string }, context: Context) {
    const User = context.ogm.model("User");

    const [existing] = await User.find({
        where: { email: args.email },
        context: { ...context, adminOverride: true },
    });
    if (!existing) {
        throw new Error("user not found");
    }

    const equal = await comparePassword(args.password, existing.password);
    if (!equal) {
        throw new Error("Unauthorized");
    }

    const jwt = await createJWT({ sub: existing.id });

    return jwt;
}

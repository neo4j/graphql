import { gql } from "apollo-server-express";
import { Context } from "../types";
import { comparePassword, createJWT, hashPassword } from "../utils";

export const typeDefs = gql`
    type User {
        id: ID! @id
        email: String!
        createdBlogs: [Blog] @relationship(type: "HAS_BLOG", direction: OUT)
        authorsBlogs: [Blog] @relationship(type: "CAN_POST", direction: OUT)
        password: String! @private
        createdAt: DateTime @timestamp(operations: [CREATE])
        updatedAt: DateTime @timestamp(operations: [UPDATE])
    }

    extend type User
        @auth(
            rules: [
                { operations: [CONNECT], isAuthenticated: true }
                { operations: [UPDATE], allow: { id: "$jwt.sub" }, bind: { id: "$jwt.sub" } }
                { operations: [DELETE], allow: { id: "$jwt.sub" } }
                {
                    operations: [DISCONNECT]
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

    const jwt = await createJWT({ sub: user.id });

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

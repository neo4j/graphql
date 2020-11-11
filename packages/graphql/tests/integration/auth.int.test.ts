import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import { IncomingMessage } from "http";
import { Socket } from "net";
import jsonwebtoken from "jsonwebtoken";
import { describe, beforeAll, afterAll, test, expect } from "@jest/globals";
import neo4j from "./neo4j";
import makeAugmentedSchema from "../../src/schema/make-augmented-schema";

describe("auth", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
        process.env.JWT_SECRET = "secret";
    });

    afterAll(async () => {
        await driver.close();
        delete process.env.JWT_SECRET;
    });

    test("should throw Authenticated if no JWT in req", async () => {
        const session = driver.session();

        const typeDefs = `
            type Product @auth(rules: [{
                isAuthenticated: true,
                operations: ["read"]
            }]) {
                id: ID
                name: String
            }
        `;

        const neoSchema = makeAugmentedSchema({ typeDefs });

        const query = `
            {
                Products {
                    id
                }
            }
        `;

        try {
            const socket = new Socket({ readable: true });

            const req = new IncomingMessage(socket);

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, req },
            });

            expect((gqlResult.errors as any[])[0].message).toEqual("Unauthorized");
        } finally {
            await session.close();
        }
    });

    test("should throw Forbidden if JWT is missing a role", async () => {
        await Promise.all(
            ["create", "read", "delete"].map(async (type) => {
                const session = driver.session();

                const typeDefs = `
                    type Product @auth(rules: [{
                        roles: ["admin"],
                        operations: ["${type}"]
                    }]) {
                        id: ID
                        name: String
                    }
                `;

                const token = jsonwebtoken.sign({ roles: ["not admin"] }, process.env.JWT_SECRET);

                const neoSchema = makeAugmentedSchema({ typeDefs });

                let query: string | undefined;

                if (type === "create") {
                    query = `
                        mutation {
                            createProducts(input: [{id: 123, name: "pringles"}]) {
                                id
                            }
                        }
                    `;
                }

                if (type === "delete") {
                    query = `
                        mutation {
                            deleteProducts {
                                nodesDeleted
                            }
                        }
                    `;
                }

                if (type === "read") {
                    query = `
                        {
                            Products {
                                id
                            }
                        }
                    `;
                }

                try {
                    const socket = new Socket({ readable: true });
                    const req = new IncomingMessage(socket);
                    req.headers.authorization = `Bearer ${token}`;

                    const gqlResult = await graphql({
                        schema: neoSchema.schema,
                        source: query as string,
                        contextValue: { driver, req },
                    });

                    expect((gqlResult.errors as any[])[0].message).toEqual("Forbidden");
                } finally {
                    await session.close();
                }
            })
        );
    });

    test("should throw Forbidden invalid equality on JWT property vs node property using allow", async () => {
        await Promise.all(
            ["read", "delete"].map(async (type) => {
                const session = driver.session();

                const typeDefs = `
                    type Product @auth(rules: [{
                        operations: ["${type}"],
                        allow: { id: "sub" }
                    }]) {
                        id: ID
                        name: String
                    }
                `;

                const id1 = generate({
                    charset: "alphabetic",
                });
                const id2 = generate({
                    charset: "alphabetic",
                });

                await session.run(
                    `
                        CREATE (:Product {id: $id1}), (:Product {id: $id2})
                    `,
                    { id1, id2 }
                );

                const token = jsonwebtoken.sign({ sub: "invalid" }, process.env.JWT_SECRET);

                const neoSchema = makeAugmentedSchema({ typeDefs });

                let query: string | undefined;

                if (type === "delete") {
                    query = `
                        mutation {
                            deleteProducts(where: {id: "${id1}"}) {
                                nodesDeleted
                            }
                        }
                    `;
                }

                if (type === "read") {
                    query = `
                        {
                            Products(where: {id: "${id2}"}) {
                                id
                            }
                        }
                    `;
                }

                try {
                    const socket = new Socket({ readable: true });
                    const req = new IncomingMessage(socket);
                    req.headers.authorization = `Bearer ${token}`;

                    const gqlResult = await graphql({
                        schema: neoSchema.schema,
                        source: query as string,
                        contextValue: { driver, req },
                    });

                    expect((gqlResult.errors as any[])[0].message).toEqual("Forbidden");
                } finally {
                    await session.close();
                }
            })
        );
    });

    test("should allow equality on JWT property vs node property using allow", async () => {
        await Promise.all(
            ["read", "delete"].map(async (type) => {
                const session = driver.session();

                const id = generate({
                    charset: "alphabetic",
                });

                await session.run(
                    `
                        CREATE (:Product {id: $id})
                    `,
                    { id }
                );

                const typeDefs = `
                    type Product @auth(rules: [{
                        operations: ["${type}"],
                        allow: { id: "sub" }
                    }]) {
                        id: ID
                        name: String
                    }
                `;

                const token = jsonwebtoken.sign({ sub: id }, process.env.JWT_SECRET);

                const neoSchema = makeAugmentedSchema({ typeDefs });

                let query: string | undefined;

                if (type === "delete") {
                    query = `
                        mutation {
                            deleteProducts(where: {id: "${id}"}) {
                                nodesDeleted
                            }
                        }
                    `;
                }

                if (type === "read") {
                    query = `
                        {
                            Products(where: {id: "${id}"}) {
                                id
                            }
                        }
                    `;
                }

                try {
                    const socket = new Socket({ readable: true });
                    const req = new IncomingMessage(socket);
                    req.headers.authorization = `Bearer ${token}`;

                    const gqlResult = await graphql({
                        schema: neoSchema.schema,
                        source: query as string,
                        contextValue: { driver, req },
                    });

                    expect(gqlResult.errors).toEqual(undefined);

                    if (type === "delete") {
                        expect((gqlResult.data as any).deleteProducts).toEqual({ nodesDeleted: 1 });
                    }

                    if (type === "read") {
                        expect((gqlResult.data as any).Products).toEqual([{ id }]);
                    }
                } finally {
                    await session.close();
                }
            })
        );
    });

    test("should allow * on operations", async () => {
        await Promise.all(
            ["read", "delete", "create"].map(async (type) => {
                const session = driver.session();

                const typeDefs = `
                    type Product @auth(rules: [{
                        operations: ["${type}"],
                        allow: { id: "sub" }
                    },
                    {
                        operations: ["${type}"],
                        roles: ["admin"]
                    }
                    {
                        operations: ["${type}"],
                        allow: "*"
                    }
                   ]) {
                        id: ID
                        name: String
                        colors: [Color] @relationship(type: "OF_COLOR", direction: "OUT")
                    }

                    type Color @auth(rules: [{allow: "*", operations: ["create"]}]) {
                        name: String
                    }
                `;

                const id = generate({
                    charset: "alphabetic",
                });

                const token = jsonwebtoken.sign({ sub: "ALLOW *" }, process.env.JWT_SECRET);

                const neoSchema = makeAugmentedSchema({ typeDefs });

                let query: string | undefined;

                if (type === "create") {
                    query = `
                        mutation {
                            createProducts(input:[{
                                name: "Pringles", 
                                colors: {
                                    create: [{ name: "Red" }]
                                }
                            }]){
                                id
                            }
                        }
                    `;
                }

                if (type === "delete") {
                    await session.run(
                        `
                            CREATE (:Product {id: $id})
                        `,
                        { id }
                    );

                    query = `
                        mutation {
                            deleteProducts(where: {id: "${id}"}) {
                                nodesDeleted
                            }
                        }
                    `;
                }

                if (type === "read") {
                    await session.run(
                        `
                            CREATE (:Product {id: $id})
                        `,
                        { id }
                    );

                    query = `
                        {
                            Products(where: {id: "${id}"}) {
                                id
                            }
                        }
                    `;
                }

                try {
                    const socket = new Socket({ readable: true });
                    const req = new IncomingMessage(socket);
                    req.headers.authorization = `Bearer ${token}`;

                    const gqlResult = await graphql({
                        schema: neoSchema.schema,
                        source: query as string,
                        contextValue: { driver, req },
                    });

                    expect(gqlResult.errors).toEqual(undefined);
                } finally {
                    await session.close();
                }
            })
        );
    });

    test("should throw Forbidden when using roles and nested mutations", async () => {
        const session = driver.session();

        const typeDefs = `
            type Product @auth(rules: [{
                roles: ["admin"],
                operations: ["create"]
            }]) {
                id: ID
                name: String
                colors: [Color] @relationship(type: "OF_COLOR", direction: "OUT")
            }

            type Color @auth(rules: [{
                roles: ["admin"],
                operations: ["read"]
            }]) {
                name: String
            }
        `;

        const token = jsonwebtoken.sign({ roles: ["admin"] }, process.env.JWT_SECRET);

        const neoSchema = makeAugmentedSchema({ typeDefs });

        const query = `
            mutation {
                createProducts(input:[{
                    name: "Pringles", 
                    colors: {
                        create: [{ name: "Red" }]
                    }
                }]){
                    id
                }
            }
        `;

        try {
            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query as string,
                contextValue: { driver, req },
            });

            expect((gqlResult.errors as any[])[0].message).toEqual("Forbidden");
        } finally {
            await session.close();
        }
    });

    test("should allow users to nest mutations because of allow *", async () => {
        const session = driver.session();

        const typeDefs = `
            type Product @auth(rules: [{
                roles: ["admin"],
                operations: ["create"]
            }, 
            {
                allow: "*"
                operations: ["create", "read", "update", "delete"]
            }]) {
                id: ID
                name: String
                colors: [Color] @relationship(type: "OF_COLOR", direction: "OUT")
            }

            type Color @auth(rules: [{
                roles: ["admin"],
                operations: ["create"]
            },
            {
                allow: "*",
                operations: ["create", "read", "update", "delete"]
            }]) {
                name: String
            }
        `;

        const token = jsonwebtoken.sign({ roles: ["admin"] }, process.env.JWT_SECRET);

        const neoSchema = makeAugmentedSchema({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const query = `
            mutation {
                createProducts(input:[{
                    id: "${id}", 
                    colors: {
                        create: [{ name: "Red" }]
                    }
                }]){
                    id
                }
            }
        `;

        try {
            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query as string,
                contextValue: { driver, req },
            });

            expect(gqlResult.errors).toEqual(undefined);

            expect((gqlResult.data as any).createProducts[0].id).toEqual(id);
        } finally {
            await session.close();
        }
    });

    test("should allow users with correct role to nest mutations", async () => {
        const session = driver.session();

        const typeDefs = `
            type Product @auth(rules: [{
                roles: ["admin"],
                operations: ["create"]
            }]) {
                id: ID
                name: String
                colors: [Color] @relationship(type: "OF_COLOR", direction: "OUT")
            }

            type Color @auth(rules: [{
                roles: ["admin"],
                operations: ["create"]
            }]) {
                name: String
            }
        `;

        const token = jsonwebtoken.sign({ roles: ["admin"] }, process.env.JWT_SECRET);

        const neoSchema = makeAugmentedSchema({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const query = `
            mutation {
                createProducts(input:[{
                    id: "${id}", 
                    colors: {
                        create: [{ name: "Red" }]
                    }
                }]){
                    id
                }
            }
        `;

        try {
            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query as string,
                contextValue: { driver, req },
            });

            expect(gqlResult.errors).toEqual(undefined);

            expect((gqlResult.data as any).createProducts[0].id).toEqual(id);
        } finally {
            await session.close();
        }
    });

    test("should use allow relationship filtering to throw Forbidden when user is not a creator of a post", async () => {
        const session = driver.session();

        const typeDefs = `
            type User {
                id: String
                name: String
            }
            
            type Post @auth(
                rules: [
                    {
                        allow: {
                            OR: [
                                { creator: { id: "sub" } },
                                { moderator: { id: "sub" } }
                            ]
                        },
                        operations: ["read"]
                    }
                ]
            ) {
                id: String
                title: String
                creator: User @relationship(type: "CREATOR", direction: "OUT")
                moderator: User @relationship(type: "MODERATOR", direction: "IN")
            }
        `;

        const token = jsonwebtoken.sign({ sub: "INVALID" }, process.env.JWT_SECRET);

        const neoSchema = makeAugmentedSchema({ typeDefs });

        const postId = generate({
            charset: "alphabetic",
        });

        const userId = generate({
            charset: "alphabetic",
        });

        await session.run(
            `
            CREATE (p:Post {id: $postId})
            MERGE (p)-[:CREATOR]->(:User {id: $userId})
            MERGE (p)<-[:MODERATOR]-(:User {id: $userId})
        `,
            { postId, userId }
        );

        const query = `
            {
                Posts(where: {id: "${postId}"}) {
                    id
                    title
                    creator {
                        id
                    }
                }
            }
        `;

        try {
            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query as string,
                contextValue: { driver, req },
            });

            expect((gqlResult.errors as any[])[0].message).toEqual("Forbidden");
        } finally {
            await session.close();
        }
    });

    test("should use allow relationship filtering to allow the read of a post when the user is a creator", async () => {
        const session = driver.session();

        const typeDefs = `
            type User {
                id: String
                name: String
            }
            
            type Post @auth(
                rules: [
                    {
                        allow: {
                            OR: [
                                { creator: { id: "sub" } },
                                { moderator: { id: "sub" } }
                            ]
                        },
                        operations: ["read"]
                    }
                ]
            ) {
                id: String
                title: String
                creator: User @relationship(type: "CREATOR", direction: "OUT")
                moderator: User @relationship(type: "MODERATOR", direction: "IN")
            }
        `;

        const postId = generate({
            charset: "alphabetic",
        });

        const userId = generate({
            charset: "alphabetic",
        });

        const token = jsonwebtoken.sign({ sub: userId }, process.env.JWT_SECRET);

        const neoSchema = makeAugmentedSchema({ typeDefs });

        await session.run(
            `
            CREATE (p:Post {id: $postId})
            MERGE (p)-[:CREATOR]->(:User {id: $userId})
            MERGE (p)<-[:MODERATOR]-(:User {id: $userId})
        `,
            { postId, userId }
        );

        const query = `
            {
                Posts(where: {id: "${postId}"}) {
                    id
                    title
                    creator {
                        id
                    }
                }
            }
        `;

        try {
            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query as string,
                contextValue: { driver, req },
            });

            expect(gqlResult.errors).toEqual(undefined);
        } finally {
            await session.close();
        }
    });

    test("should throw forbidden when user tying to read a post where they are not part of the corresponding group", async () => {
        const session = driver.session();

        const typeDefs = `
            type User {
                id: ID
            }
            
            type Group {
                id: ID
                users: [User] @relationship(type: "OF_GROUP", direction: "IN")
            }
            
            type Post @auth(
                rules: [
                    {
                        allow: {
                            group: {
                                users: {
                                    id: "sub"
                                }
                            }
                        },
                        operations: ["read"]
                    }
                ]
            ) {
                id: String
                group: Group @relationship(type: "OF_GROUP", direction: "OUT")
            }
        `;

        const neoSchema = makeAugmentedSchema({ typeDefs });

        const token = jsonwebtoken.sign({ sub: "INVALID" }, process.env.JWT_SECRET);

        const postId = generate({
            charset: "alphabetic",
        });

        const userId = generate({
            charset: "alphabetic",
        });

        const groupId = generate({
            charset: "alphabetic",
        });

        await session.run(
            `
            CREATE (u:User {id: $userId})
            CREATE (g:Group {id: $groupId})
            CREATE (p:Post {id: $postId})
            MERGE (u)-[:OF_GROUP]->(g)
            MERGE (p)-[:OF_GROUP]->(g)
            `,
            {
                postId,
                userId,
                groupId,
            }
        );

        const query = `
            {
                Posts(where: {id: "${postId}"}) {
                    id
                }
            }
        `;

        try {
            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query as string,
                contextValue: { driver, req },
            });

            expect((gqlResult.errors as any[])[0].message).toEqual("Forbidden");
        } finally {
            await session.close();
        }
    });

    test("should allow user to read a post when they are part of the corresponding group", async () => {
        const session = driver.session();

        const typeDefs = `
            type User {
                id: ID
            }
            
            type Group {
                id: ID
                users: [User] @relationship(type: "OF_GROUP", direction: "IN")
            }
            
            type Post @auth(
                rules: [
                    {
                        allow: {
                            group: {
                                users: {
                                    id: "sub"
                                }
                            }
                        },
                        operations: ["read"]
                    }
                ]
            ) {
                id: String
                group: Group @relationship(type: "OF_GROUP", direction: "OUT")
            }
        `;

        const neoSchema = makeAugmentedSchema({ typeDefs });

        const postId = generate({
            charset: "alphabetic",
        });

        const userId = generate({
            charset: "alphabetic",
        });

        const groupId = generate({
            charset: "alphabetic",
        });

        const token = jsonwebtoken.sign({ sub: userId }, process.env.JWT_SECRET);

        await session.run(
            `
            CREATE (u:User {id: $userId})
            CREATE (g:Group {id: $groupId})
            CREATE (p:Post {id: $postId})
            MERGE (u)-[:OF_GROUP]->(g)
            MERGE (p)-[:OF_GROUP]->(g)
            `,
            {
                postId,
                userId,
                groupId,
            }
        );

        const query = `
            {
                Posts(where: {id: "${postId}"}) {
                    id
                }
            }
        `;

        try {
            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query as string,
                contextValue: { driver, req },
            });

            expect((gqlResult.data as any).Posts[0]).toMatchObject({ id: postId });
        } finally {
            await session.close();
        }
    });
});

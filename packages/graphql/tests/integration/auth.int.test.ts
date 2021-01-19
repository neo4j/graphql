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
                products {
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
            ["create", "read", "delete", "update", "disconnect", "connect"].map(async (type) => {
                const session = driver.session();

                const typeDefs = `
                    type Color {
                        name: String
                    }

                    type Product @auth(rules: [{
                        roles: ["admin"],
                        operations: ["${type}"]
                    }]) {
                        id: ID
                        name: String
                        colors: [Color] @relationship(type: "HAS_COLOR", direction: "OUT")
                    }
                `;

                const token = jsonwebtoken.sign({ roles: ["not admin"] }, process.env.JWT_SECRET as string);

                const neoSchema = makeAugmentedSchema({ typeDefs });

                let query: string | undefined;

                if (type === "create") {
                    query = `
                        mutation {
                            createProducts(input: [{id: 123, name: "pringles"}]) {
                                products {
                                    id
                                }
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
                            products {
                                id
                            }
                        }
                    `;
                }

                if (type === "update") {
                    query = `
                        mutation {
                            updateProducts(update: {name: "test"}){
                                products {
                                    id
                                }
                            }
                        }
                    `;
                }

                if (type === "disconnect") {
                    query = `
                        mutation {
                            updateProducts(disconnect: {colors: {where: {name: "red"}}}){
                                id
                            }
                        }
                    `;
                }

                if (type === "connect") {
                    query = `
                        mutation {
                            updateProducts(connect: {colors: {where: {name: "red"}}}){
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

    describe("Pair", () => {
        test("should throw Forbidden invalid equality on JWT property vs node property using allow", async () => {
            await Promise.all(
                ["read", "delete", "update"].map(async (type) => {
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

                    const id = generate({
                        charset: "alphabetic",
                    });

                    const token = jsonwebtoken.sign({ sub: "invalid" }, process.env.JWT_SECRET as string);

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

                    if (type === "update") {
                        query = `
                            mutation {
                                updateProducts(where: {id: "${id}"}, update: {name: "test"}) {
                                    products {
                                        name
                                    }
                                }
                            }
                        `;
                    }

                    if (type === "read") {
                        query = `
                            {
                                products(where: {id: "${id}"}) {
                                    id
                                }
                            }
                        `;
                    }

                    try {
                        await session.run(
                            `
                                CREATE (:Product {id: $id})
                            `,
                            { id }
                        );

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
                ["read", "delete", "update"].map(async (type) => {
                    const session = driver.session();

                    const id = generate({
                        charset: "alphabetic",
                    });

                    const typeDefs = `
                            type Product @auth(rules: [{
                                operations: ["${type}"],
                                allow: { id: "sub" }
                            }]) {
                                id: ID
                                name: String
                            }
                        `;

                    const token = jsonwebtoken.sign({ sub: id }, process.env.JWT_SECRET as string);

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

                    if (type === "update") {
                        query = `
                                mutation {
                                    updateProducts(where: {id: "${id}"}) {
                                        products {
                                            id
                                        }
                                    }
                                }
                            `;
                    }

                    if (type === "read") {
                        query = `
                                {
                                    products(where: {id: "${id}"}) {
                                        id
                                    }
                                }
                            `;
                    }

                    try {
                        await session.run(
                            `
                                CREATE (:Product {id: $id})
                            `,
                            { id }
                        );

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
                            expect((gqlResult.data as any).products).toEqual([{ id }]);
                        }
                    } finally {
                        await session.close();
                    }
                })
            );
        });
    });

    test("should allow * on operations", async () => {
        await Promise.all(
            ["read", "delete", "create", "update"].map(async (type) => {
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

                    type Color @auth(rules: [
                        { 
                            operations: ["${type}"],
                            allow: "*",
                        },
                        {
                            operations: ["${type}"],
                            allow: { id: "sub" }
                        },
                        {
                            operations: ["${type}"],
                            roles: ["admin"]
                        }
                    ]) {
                        name: String
                    }
                `;

                const id = generate({
                    charset: "alphabetic",
                });

                const token = jsonwebtoken.sign({ sub: "ALLOW *" }, process.env.JWT_SECRET as string);

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
                                products {
                                    id
                                }
                            }
                        }
                    `;
                }

                try {
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
                                products(where: {id: "${id}"}) {
                                    id
                                }
                            }
                        `;
                    }

                    if (type === "update") {
                        await session.run(
                            `
                                CREATE (:Product {id: $id})
                            `,
                            { id }
                        );

                        query = `
                            mutation {
                                updateProducts(where: {id: "${id}"}, update: {colors: {where: {name: "Green"}, update: {name: "red" }}}) {
                                    products {
                                        id
                                    }
                                }
                            }
                        `;
                    }

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

    test("should throw Forbidden using nested mutations because user dose not have required role", async () => {
        await Promise.all(
            ["create", "update"].map(async (type) => {
                const session = driver.session();

                const typeDefs = `
                type Product {
                    id: ID
                    name: String
                    colors: [Color] @relationship(type: "OF_COLOR", direction: "OUT")
                }
    
                type Color @auth(rules: [{
                    roles: ["admin"],
                    operations: ["${type}"]
                }]) {
                    name: String
                }
            `;

                const token = jsonwebtoken.sign({}, process.env.JWT_SECRET as string);

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
                                products {
                                    id
                                }
                            }
                        }
                    `;
                }

                if (type === "update") {
                    query = `
                        mutation {
                            updateProducts(
                                where: { name: "Pringles" }
                                update: {
                                    colors: {
                                        where: { name: "Red" },
                                        update: { name: "Red_Color" }
                                    }
                                }
                            ){
                                products {
                                    name
                                }
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

    test("should allow users to nest mutations because of allow *", async () => {
        await Promise.all(
            ["create", "update"].map(async (type) => {
                const session = driver.session();

                const typeDefs = `
                    type Product @auth(rules: [{
                        roles: ["admin"],
                        operations: ["${type}"]
                    }, 
                    {
                        allow: "*"
                        operations: ["${type}"]
                    }]) {
                        id: ID
                        name: String
                        colors: [Color] @relationship(type: "OF_COLOR", direction: "OUT")
                    }

                    type Color @auth(rules: [{
                        roles: ["admin"],
                        operations: ["${type}"]
                    },
                    {
                        allow: "*",
                        operations: ["${type}"]
                    }]) {
                        name: String
                    }
                `;

                const token = jsonwebtoken.sign({ roles: ["admin"] }, process.env.JWT_SECRET as string);

                const neoSchema = makeAugmentedSchema({ typeDefs });

                const id = generate({
                    charset: "alphabetic",
                });

                let query: string | undefined;

                if (type === "create") {
                    query = `
                        mutation {
                            createProducts(input:[{
                                id: "${id}", 
                                colors: {
                                    create: [{ name: "Red" }]
                                }
                            }]){
                                products {
                                    id
                                }
                            }
                        }
                    `;
                }

                if (type === "update") {
                    query = `
                        mutation {
                            updateProducts(
                                where: { id: "${id}" }
                                update: {
                                    colors: {
                                        where: { name: "Red" },
                                        update: { name: "Red_Color" }
                                    }
                                }
                            ){
                                products {
                                    id
                                }
                            }
                        }
                    `;
                }

                try {
                    if (type === "update") {
                        await session.run(
                            `
                            CREATE (p:Product {id: $id})
                        `,
                            { id }
                        );
                    }

                    const socket = new Socket({ readable: true });
                    const req = new IncomingMessage(socket);
                    req.headers.authorization = `Bearer ${token}`;

                    const gqlResult = await graphql({
                        schema: neoSchema.schema,
                        source: query as string,
                        contextValue: { driver, req },
                    });

                    expect(gqlResult.errors).toEqual(undefined);

                    if (type === "create") {
                        expect((gqlResult.data as any).createProducts.products[0].id).toEqual(id);
                    }

                    if (type === "update") {
                        expect((gqlResult.data as any).updateProducts.products[0].id).toEqual(id);
                    }
                } finally {
                    await session.close();
                }
            })
        );
    });

    test("should allow users with correct role to nest mutations", async () => {
        await Promise.all(
            ["create", "update"].map(async (type) => {
                const session = driver.session();

                const typeDefs = `
                    type Product @auth(rules: [{
                        roles: ["admin"],
                        operations: ["${type}"]
                    }]) {
                        id: ID
                        name: String
                        colors: [Color] @relationship(type: "OF_COLOR", direction: "OUT")
                    }
        
                    type Color @auth(rules: [{
                        roles: ["admin"],
                        operations: ["${type}"]
                    }]) {
                        id: ID
                    }
                `;

                const token = jsonwebtoken.sign({ roles: ["admin"] }, process.env.JWT_SECRET as string);

                const neoSchema = makeAugmentedSchema({ typeDefs });

                const productId = generate({
                    charset: "alphabetic",
                });

                const colorId1 = generate({
                    charset: "alphabetic",
                });
                const colorId2 = generate({
                    charset: "alphabetic",
                });

                let query: string | undefined;

                if (type === "create") {
                    query = `
                        mutation {
                            createProducts(input:[{
                                id: "${productId}", 
                                colors: {
                                    create: [{ id: "${colorId1}"  }]
                                }
                            }]){
                                products {
                                    id
                                    colors {
                                        id
                                    }
                                }   
                            }
                        }
                    `;
                }

                if (type === "update") {
                    query = `
                        mutation {
                            updateProducts(
                                where: { id: "${productId}" }
                                update: {
                                    colors: {
                                        where: { id: "${colorId1}" },
                                        update: { id: "${colorId2}" }
                                    }
                                }
                            ){
                                products {
                                    id
                                    colors {
                                        id
                                    }
                                }
                            }
                        }
                    `;
                }

                try {
                    if (type === "update") {
                        await session.run(
                            `
                            CREATE (p:Product {id: $productId})
                            CREATE (c:Color {id: $colorId1})
                            MERGE (p)-[:OF_COLOR]->(c)
                        `,
                            { productId, colorId1 }
                        );
                    }

                    const socket = new Socket({ readable: true });
                    const req = new IncomingMessage(socket);
                    req.headers.authorization = `Bearer ${token}`;

                    const gqlResult = await graphql({
                        schema: neoSchema.schema,
                        source: query as string,
                        contextValue: { driver, req },
                    });

                    expect(gqlResult.errors).toEqual(undefined);

                    if (type === "create") {
                        expect((gqlResult.data as any).createProducts.products[0]).toMatchObject({
                            id: productId,
                            colors: [{ id: colorId1 }],
                        });
                    }

                    if (type === "update") {
                        expect((gqlResult.data as any).updateProducts.products[0]).toMatchObject({
                            id: productId,
                            colors: [{ id: colorId2 }],
                        });
                    }
                } finally {
                    await session.close();
                }
            })
        );
    });

    describe("Pair", () => {
        test("should throw forbidden using allow and nested update", async () => {
            const session = driver.session();

            const typeDefs = `
                type Post {
                    id: ID
                    title: String
                    user: User @relationship(type: "HAS_POST", direction: "IN")
                }
                
                type User @auth(rules:[
                    { 
                        allow: { id: "sub" }, 
                        operations: ["update"]
                    }
                ]) {
                    id: ID
                    name: String
                }
            `;

            const token = jsonwebtoken.sign({ sub: "NOT VALID" }, process.env.JWT_SECRET as string);

            const neoSchema = makeAugmentedSchema({ typeDefs });

            const postId = generate({
                charset: "alphabetic",
            });

            const userId = generate({
                charset: "alphabetic",
            });

            const query = `
                   mutation {
                       updatePosts(
                            where: { id: "${postId}" },
                            update: {
                                user: {
                                    update: {
                                        name: "new name"        
                                    }
                                }
                            }
                       ) {
                           posts {
                                id
                           }
                       }
                   }
                `;

            try {
                await session.run(
                    `
                       CREATE (u:User {id: $userId})
                       CREATE (p:Post {id: $postId})
                       MERGE (u)-[:HAS_POST]->(p)
                    `,
                    { postId, userId }
                );

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

        test("should allow, using allow, nested update", async () => {
            const session = driver.session();

            const typeDefs = `
                type Post {
                    id: ID
                    title: String
                    user: User @relationship(type: "HAS_POST", direction: "IN")
                }
                
                type User @auth(rules:[
                    { 
                        allow: { id: "sub" }, 
                        operations: ["update"]
                    }
                ]) {
                    id: ID
                    name: String
                }
            `;

            const postId = generate({
                charset: "alphabetic",
            });

            const userId = generate({
                charset: "alphabetic",
            });

            const initialName = generate({
                charset: "alphabetic",
            });

            const newName = generate({
                charset: "alphabetic",
            });

            const token = jsonwebtoken.sign({ sub: userId }, process.env.JWT_SECRET as string);

            const neoSchema = makeAugmentedSchema({ typeDefs });

            const query = `
                   mutation {
                       updatePosts(
                            where: { id: "${postId}" },
                            update: {
                                user: {
                                    update: {
                                        name: "${newName}"        
                                    }
                                }
                            }
                       ) {
                            posts {
                                id
                                user {
                                    id
                                    name
                                }
                            }
                       }
                   }
                `;

            try {
                await session.run(
                    `
                       CREATE (u:User {id: $userId, name: $initialName})
                       CREATE (p:Post {id: $postId})
                       MERGE (u)-[:HAS_POST]->(p)
                    `,
                    { postId, userId, initialName }
                );

                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query as string,
                    contextValue: { driver, req },
                });

                expect(((gqlResult.data as any).updatePosts.posts as any[])[0]).toMatchObject({
                    id: postId,
                    user: {
                        id: userId,
                        name: newName,
                    },
                });
            } finally {
                await session.close();
            }
        });
    });

    describe("Pair", () => {
        test("should throw forbidden when user tying to read a post (through a user) when they don't have the correct role", async () => {
            const session = driver.session();

            const typeDefs = `
                type User {
                    id: String
                    posts: [Post] @relationship(type: "HAS_POST", direction: "OUT")
                }
    
                type Post @auth(
                    rules: [
                        { 
                            roles: ["admin"],
                            operations: ["read"]
                        }
                    ]
                ) {
                    id: String
                }
            `;

            const neoSchema = makeAugmentedSchema({ typeDefs });

            const token = jsonwebtoken.sign({ roles: [] }, process.env.JWT_SECRET as string);

            const postId = generate({
                charset: "alphabetic",
            });

            const userId = generate({
                charset: "alphabetic",
            });

            const query = `
                {
                    users(where: {id: "${userId}"}) {
                        id
                        posts {
                            id
                        }
                    }   
                }
                `;

            try {
                await session.run(
                    `
                        CREATE (u:User {id: $userId})
                        CREATE (p:Post {id: $postId})
                        MERGE (u)-[:HAS_POST]->(p)
                        `,
                    {
                        postId,
                        userId,
                    }
                );

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

        test("should allow user to read a post (through a user) when do have the correct role", async () => {
            const session = driver.session();

            const typeDefs = `
                type User {
                    id: String
                    posts: [Post] @relationship(type: "HAS_POST", direction: "OUT")
                }
    
                type Post @auth(
                    rules: [
                        { 
                            roles: ["admin"],
                            operations: ["read"]
                        }
                    ]
                ) {
                    id: String
                }
            `;

            const neoSchema = makeAugmentedSchema({ typeDefs });

            const token = jsonwebtoken.sign({ roles: ["admin"] }, process.env.JWT_SECRET as string);

            const postId = generate({
                charset: "alphabetic",
            });

            const userId = generate({
                charset: "alphabetic",
            });

            const query = `
                {
                    users(where: {id: "${userId}"}) {
                        id
                        posts {
                            id
                        }
                    }   
                }
                `;

            try {
                await session.run(
                    `
                        CREATE (u:User {id: $userId})
                        CREATE (p:Post {id: $postId})
                        MERGE (u)-[:HAS_POST]->(p)
                        `,
                    {
                        postId,
                        userId,
                    }
                );

                const socket = new Socket({ readable: true });
                const req = new IncomingMessage(socket);
                req.headers.authorization = `Bearer ${token}`;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query as string,
                    contextValue: { driver, req },
                });

                expect((gqlResult.data as any).users[0]).toMatchObject({ id: userId, posts: [{ id: postId }] });
            } finally {
                await session.close();
            }
        });
    });

    describe("Relationship filtering", () => {
        describe("Pair", () => {
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

                const token = jsonwebtoken.sign({ sub: "INVALID" }, process.env.JWT_SECRET as string);

                const neoSchema = makeAugmentedSchema({ typeDefs });

                const postId = generate({
                    charset: "alphabetic",
                });

                const userId = generate({
                    charset: "alphabetic",
                });

                const query = `
                    {
                        posts(where: {id: "${postId}"}) {
                            id
                            title
                            creator {
                                id
                            }
                        }
                    }
                `;

                try {
                    await session.run(
                        `
                        CREATE (p:Post {id: $postId})
                        MERGE (p)-[:CREATOR]->(:User {id: $userId})
                        MERGE (p)<-[:MODERATOR]-(:User {id: $userId})
                    `,
                        { postId, userId }
                    );

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

                const token = jsonwebtoken.sign({ sub: userId }, process.env.JWT_SECRET as string);

                const neoSchema = makeAugmentedSchema({ typeDefs });

                const query = `
                    {
                        posts(where: {id: "${postId}"}) {
                            id
                            title
                            creator {
                                id
                            }
                        }
                    }
                `;

                try {
                    await session.run(
                        `
                        CREATE (p:Post {id: $postId})
                        MERGE (p)-[:CREATOR]->(:User {id: $userId})
                        MERGE (p)<-[:MODERATOR]-(:User {id: $userId})
                    `,
                        { postId, userId }
                    );

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
        });

        describe("Pair", () => {
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

                const token = jsonwebtoken.sign({ sub: "INVALID" }, process.env.JWT_SECRET as string);

                const postId = generate({
                    charset: "alphabetic",
                });

                const userId = generate({
                    charset: "alphabetic",
                });

                const groupId = generate({
                    charset: "alphabetic",
                });

                const query = `
                    {
                        posts(where: {id: "${postId}"}) {
                            id
                        }
                    }
                `;

                try {
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

                const token = jsonwebtoken.sign({ sub: userId }, process.env.JWT_SECRET as string);

                const query = `
                {
                    posts(where: {id: "${postId}"}) {
                        id
                    }
                }
                `;

                try {
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

                    const socket = new Socket({ readable: true });
                    const req = new IncomingMessage(socket);
                    req.headers.authorization = `Bearer ${token}`;

                    const gqlResult = await graphql({
                        schema: neoSchema.schema,
                        source: query as string,
                        contextValue: { driver, req },
                    });

                    expect((gqlResult.data as any).posts[0]).toMatchObject({ id: postId });
                } finally {
                    await session.close();
                }
            });
        });

        describe("Pair", () => {
            test("should throw forbidden when user tying to read a post (through a user) where they are not part of the corresponding group", async () => {
                const session = driver.session();

                const typeDefs = `
                    type Group {
                        id: ID
                        name: String
                        users: [User] @relationship(type: "OF_GROUP", direction: "IN")
                    }
    
                    type User {
                        id: String
                        name: String
                        posts: [Post] @relationship(type: "HAS_POST", direction: "OUT")
                    }
    
                    type Post @auth(
                        rules: [
                            { 
                                allow: {
                                    group: { users: { id: "sub" } }
                                },
                                operations: ["read"]
                            }
                        ]
                    ) {
                        id: String
                        title: String
                        group: Group @relationship(type: "OF_GROUP", direction: "OUT")
                    }
                `;

                const neoSchema = makeAugmentedSchema({ typeDefs });

                const token = jsonwebtoken.sign({ sub: "INVALID" }, process.env.JWT_SECRET as string);

                const postId = generate({
                    charset: "alphabetic",
                });

                const userId = generate({
                    charset: "alphabetic",
                });

                const groupId = generate({
                    charset: "alphabetic",
                });

                const query = `
                    {
                        users(where: {id: "${userId}"}) {
                            name
                            posts {
                                title
                            }
                        }   
                    }
                    `;

                try {
                    await session.run(
                        `
                            CREATE (u:User {id: $userId})
                            CREATE (g:Group {id: $groupId})
                            CREATE (p:Post {id: $postId})
                            MERGE (u)-[:OF_GROUP]->(g)
                            MERGE (u)-[:HAS_POST]->(p)
                            MERGE (p)-[:OF_GROUP]->(g)
                            `,
                        {
                            postId,
                            userId,
                            groupId,
                        }
                    );

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

            test("should allow a user to read a post (through a user) where they are part of the corresponding group", async () => {
                const session = driver.session();

                const typeDefs = `
                    type Group {
                        id: ID
                        users: [User] @relationship(type: "OF_GROUP", direction: "IN")
                    }
    
                    type User {
                        id: String
                        posts: [Post] @relationship(type: "HAS_POST", direction: "OUT")
                    }
    
                    type Post @auth(
                        rules: [
                            { 
                                allow: {
                                    group: { users: { id: "sub" } }
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

                const token = jsonwebtoken.sign({ sub: userId }, process.env.JWT_SECRET as string);

                const query = `
                {
                    users(where: {id: "${userId}"}) {
                        id
                        posts {
                            id
                        }
                    }   
                }
                `;

                try {
                    await session.run(
                        `
                        CREATE (u:User {id: $userId})
                        CREATE (g:Group {id: $groupId})
                        CREATE (p:Post {id: $postId})
                        MERGE (u)-[:OF_GROUP]->(g)
                        MERGE (u)-[:HAS_POST]->(p)
                        MERGE (p)-[:OF_GROUP]->(g)
                        `,
                        {
                            postId,
                            userId,
                            groupId,
                        }
                    );

                    const socket = new Socket({ readable: true });
                    const req = new IncomingMessage(socket);
                    req.headers.authorization = `Bearer ${token}`;

                    const gqlResult = await graphql({
                        schema: neoSchema.schema,
                        source: query as string,
                        contextValue: { driver, req },
                    });

                    expect(gqlResult.errors as any[]).toEqual(undefined);

                    expect((gqlResult.data as any).users[0]).toMatchObject({ id: userId, posts: [{ id: postId }] });
                } finally {
                    await session.close();
                }
            });
        });

        test("should throw forbidden when user trying to make a post on blog they don't belong to (allow connect)", async () => {
            const session = driver.session();

            const typeDefs = `
                    type User {
                        id: ID
                    }
                    
                    type Blog @auth(rules: [
                        { 
                            operations: ["connect"],
                            allow: {
                                creator: { id: "sub" }
                            }
                        }
                    ]) {
                        id: ID
                        creator: User @relationship(type: "HAS_BLOG", direction: "IN")
                        posts: [Post] @relationship(type: "HAS_POST", direction: "OUT")
                    }

                    type Post {
                        id: ID
                        blog: Blog @relationship(type: "HAS_POST", direction: "IN")
                    }
                `;

            const neoSchema = makeAugmentedSchema({ typeDefs });

            const postId = generate({
                charset: "alphabetic",
            });

            const userId = generate({
                charset: "alphabetic",
            });

            const secondaryUserId = generate({
                charset: "alphabetic",
            });

            const blogId = generate({
                charset: "alphabetic",
            });

            const token = jsonwebtoken.sign({ sub: userId }, process.env.JWT_SECRET as string);

            const query = `
                    mutation {
                        createPosts(input: [
                            { 
                                id: "${postId}",
                                blog: {
                                    connect: {
                                        where: { id: "${blogId}" }
                                    }
                                }
                            }
                        ]) {
                            id
                        }
                    }
                `;

            try {
                await session.run(
                    `
                            CREATE (:User {id: "${userId}"})
                            CREATE (:User {id: "${secondaryUserId}"})-[:HAS_BLOG]->(:Blog {id: "${blogId}"})
                        `
                );

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

        test("should throw forbidden when user trying disconnect a post on blog they don't belong to (allow disconnect)", async () => {
            const session = driver.session();

            const typeDefs = `
                    type User {
                        id: ID
                    }
                    
                    type Blog @auth(rules: [
                        { 
                            operations: ["disconnect"],
                            allow: {
                                creator: { id: "sub" }
                            }
                        }
                    ]) {
                        id: ID
                        creator: User @relationship(type: "HAS_BLOG", direction: "IN")
                        posts: [Post] @relationship(type: "HAS_POST", direction: "OUT")
                    }

                    type Post {
                        id: ID
                        blog: Blog @relationship(type: "HAS_POST", direction: "IN")
                    }
                `;

            const neoSchema = makeAugmentedSchema({ typeDefs });

            const postId = generate({
                charset: "alphabetic",
            });

            const userId = generate({
                charset: "alphabetic",
            });

            const secondaryUserId = generate({
                charset: "alphabetic",
            });

            const blogId = generate({
                charset: "alphabetic",
            });

            const token = jsonwebtoken.sign({ sub: userId }, process.env.JWT_SECRET as string);

            const query = `
                    mutation {
                        updatePosts(
                            where: {id: "${postId}"},
                            disconnect: {
                                blog: {
                                    where: { id: "${blogId}" }
                                }
                            }
                        ) {
                            id
                        }
                    }
                `;

            try {
                await session.run(
                    `
                            CREATE (:User {id: "${userId}"})
                            CREATE (:User {id: "${secondaryUserId}"})-[:HAS_BLOG]->(:Blog {id: "${blogId}"})-[:HAS_POST]->(:Post {id: "${postId}"})
                        `
                );

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
    });
});

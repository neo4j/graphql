import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import neo4j from "./neo4j";
import makeAugmentedSchema from "../../src/schema/make-augmented-schema";

describe("findOne", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should findOne Movie by its id", async () => {
        const session = driver.session();

        const typeDefs = `
            type Actor {
                name: String
                movies: [Movie] @relationship(type: "ACTED_IN", direction: "IN")
            }

            type Movie {
                id: ID!
                title: String!
                actors: [Actor] @relationship(type: "ACTED_IN", direction: "OUT")
                mainActor: Actor @relationship(type: "MAIN_ACTOR", direction: "OUT")
            }
        `;

        const neoSchema = makeAugmentedSchema({ typeDefs });

        const query = `
            query($id: ID){
                FindOne_Movie(query: {id: $id}){
                    id
                }
            }
        `;

        const id = generate({
            charset: "alphabetic",
        });

        try {
            await session.run(
                `
              CREATE (:Movie {id: $id})
            `,
                { id }
            );

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                variableValues: { id },
                contextValue: { driver },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.FindOne_Movie).toEqual({ id });
        } finally {
            await session.close();
        }
    });

    it("should use AND and findOne Movie by id and title", async () => {
        const session = driver.session();

        const typeDefs = `
            type Actor {
                name: String
                movies: [Movie] @relationship(type: "ACTED_IN", direction: "IN")
            }

            type Movie {
                id: ID!
                title: String!
                actors: [Actor] @relationship(type: "ACTED_IN", direction: "OUT")
                mainActor: Actor @relationship(type: "MAIN_ACTOR", direction: "OUT")
            }
        `;

        const neoSchema = makeAugmentedSchema({ typeDefs });

        const query = `
            query($id: ID){
                FindOne_Movie(query: {AND: [{title: "Movie"}, {id: $id}]}){
                    id
                    title
                }
            }
        `;

        const id = generate({
            charset: "alphabetic",
        });

        const title = "Movie";

        try {
            await session.run(
                `
              CREATE (:Movie {id: $id, title: $title})
            `,
                { id, title }
            );

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                variableValues: { id },
                contextValue: { driver },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.FindOne_Movie).toEqual({ id, title });
        } finally {
            await session.close();
        }
    });

    it("should use nested AND and findOne Movie by id and title", async () => {
        const session = driver.session();

        const typeDefs = `
            type Actor {
                name: String
                movies: [Movie] @relationship(type: "ACTED_IN", direction: "IN")
            }

            type Movie {
                id: ID!
                title: String!
                actors: [Actor] @relationship(type: "ACTED_IN", direction: "OUT")
                mainActor: Actor @relationship(type: "MAIN_ACTOR", direction: "OUT")
            }
        `;

        const neoSchema = makeAugmentedSchema({ typeDefs });

        const query = `
            query($id: ID){
                FindOne_Movie(query: {AND: [{id: $id, AND: [{AND: [{title: "Movie"}]}] }]}){
                    id
                    title
                }
            }
        `;

        const id = generate({
            charset: "alphabetic",
        });

        const title = "Movie";

        try {
            await session.run(
                `
              CREATE (:Movie {id: $id, title: $title})
            `,
                { id, title }
            );

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                variableValues: { id },
                contextValue: { driver },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.FindOne_Movie).toEqual({ id, title });
        } finally {
            await session.close();
        }
    });

    it("should use OR and findOne Movie by id or title", async () => {
        const session = driver.session();

        const typeDefs = `
            type Actor {
                name: String
                movies: [Movie] @relationship(type: "ACTED_IN", direction: "IN")
            }

            type Movie {
                id: ID!
                title: String!
                actors: [Actor] @relationship(type: "ACTED_IN", direction: "OUT")
                mainActor: Actor @relationship(type: "MAIN_ACTOR", direction: "OUT")
            }
        `;

        const neoSchema = makeAugmentedSchema({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const title = generate({
            charset: "alphabetic",
        });

        const query = `
            query($movieQuery: MovieQuery){
                FindOne_Movie(query: $movieQuery){
                    id
                    title
                }
            }
        `;

        try {
            await session.run(
                `
              CREATE (:Movie {id: $id, title: $title})
            `,
                { id, title }
            );

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                variableValues: { movieQuery: { OR: [{ title, id }] } },
                contextValue: { driver },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.FindOne_Movie).toEqual({ id, title });
        } finally {
            await session.close();
        }
    });
});

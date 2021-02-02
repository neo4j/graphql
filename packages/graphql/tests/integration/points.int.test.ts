import { Driver, int, Point } from "neo4j-driver";
import { graphql } from "graphql";
import faker from "faker";
import { describe, beforeAll, afterAll, test, expect } from "@jest/globals";
import neo4j from "./neo4j";
import makeAugmentedSchema from "../../src/schema/make-augmented-schema";

describe("points", () => {
    let driver: Driver;
    const imdbRating_float = 4.0;
    const imdbRating_int = 4;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should create a node with a wgs-84 point", async () => {
        const session = driver.session();

        const typeDefs = `
            type Photograph {
                id: String!
                size: Int!
                location: Point!
            }
        `;

        const neoSchema = makeAugmentedSchema({ typeDefs, debug: true });

        const id = faker.random.uuid();
        const size = faker.random.number({});
        const longitude = parseFloat(faker.address.longitude());
        const latitude = parseFloat(faker.address.latitude());
        const create = `
            mutation {
                createPhotographs(input:[{
                    id: "${id}",
                    size: ${size},
                    location: {
                      latitude: ${latitude},
                      longitude: ${longitude}
                    }
                }]) {
                    photographs {
                        id  
                        size
                        location {
                          latitude
                          longitude
                          height
                          crs
                        }
                    }
                }
            }
        `;

        try {
            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: create,
                contextValue: { driver },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data as any).createPhotographs.photographs[0]).toEqual({
                id,
                size,
                location: {
                    latitude,
                    longitude,
                    height: null,
                    crs: "wgs-84",
                },
            });

            const result = await session.run(`
                MATCH (p:Photograph {id: "${id}"})
                RETURN p { .id, .size, .location} as p
            `);

            console.log(typeof (result.records[0].toObject() as any).p.location);

            expect((result.records[0].toObject() as any).p.location.x).toEqual(longitude);
            expect((result.records[0].toObject() as any).p.location.y).toEqual(latitude);
            expect((result.records[0].toObject() as any).p.location.srid).toEqual(int(4326));
        } finally {
            await session.close();
        }
    });

    // test("should create a node with a cartesian point", async () => {
    //     const session = driver.session();

    //     const typeDefs = `
    //         type Movie {
    //             id: String
    //             imdbRating_float: Float
    //             imdbRating_int: Int
    //         }
    //     `;

    //     const neoSchema = makeAugmentedSchema({ typeDefs });

    //     const id = generate({
    //         charset: "alphabetic",
    //     });

    //     const create = `
    //         mutation($imdbRating_float: Float, $imdbRating_int: Int) {
    //             createMovies(input:[{
    //                 id: "${id}",
    //                 imdbRating_float: $imdbRating_float,
    //                 imdbRating_int: $imdbRating_int
    //             }]) {
    //                 movies {
    //                     id
    //                     imdbRating_float
    //                     imdbRating_int
    //                 }
    //             }
    //         }
    //     `;

    //     try {
    //         const gqlResult = await graphql({
    //             schema: neoSchema.schema,
    //             source: create,
    //             contextValue: { driver },
    //             variableValues: {
    //                 imdbRating_float,
    //                 imdbRating_int,
    //             },
    //         });

    //         expect(gqlResult.errors).toBeFalsy();
    //         expect((gqlResult.data as any).createMovies.movies[0]).toEqual({ id, imdbRating_float, imdbRating_int });

    //         const result = await session.run(`
    //             MATCH (m:Movie {id: "${id}"})
    //             RETURN m {.id, .imdbRating_float, .imdbRating_int} as m
    //         `);

    //         expect((result.records[0].toObject() as any).m).toEqual({
    //             id,
    //             imdbRating_float,
    //             imdbRating_int: int(imdbRating_int),
    //         });
    //     } finally {
    //         await session.close();
    //     }
    // });

    // test("should update a node with a wgs-84 point", async () => {
    //     const float = 4.0;
    //     const floats = [float, float, float];

    //     const session = driver.session();

    //     const typeDefs = `
    //         type Movie {
    //             id: String
    //         }

    //         input Nested {
    //             floats: [Float]
    //         }

    //         type Mutation {
    //             float(id: ID, float: Float, nested: Nested): Float
    //                 @cypher(
    //                     statement: """
    //                     CREATE (m:Movie {id: $id, float: $float, floats: $nested.floats})
    //                     RETURN m.float
    //                     """
    //                 )
    //         }
    //     `;

    //     const neoSchema = makeAugmentedSchema({ typeDefs });

    //     const id = generate({
    //         charset: "alphabetic",
    //     });

    //     const create = `
    //         mutation($float: Float, $floats: [Float]) {
    //             float(id: "${id}", float: $float, nested: {floats: $floats})
    //         }
    //     `;

    //     try {
    //         const gqlResult = await graphql({
    //             schema: neoSchema.schema,
    //             source: create,
    //             contextValue: { driver },
    //             variableValues: {
    //                 float,
    //                 floats,
    //             },
    //         });

    //         expect(gqlResult.errors).toBeFalsy();
    //         expect((gqlResult.data as any).float).toEqual(float);

    //         const result = await session.run(`
    //             MATCH (m:Movie {id: "${id}"})
    //             RETURN m {.id, .float, .floats} as m
    //         `);

    //         expect((result.records[0].toObject() as any).m).toEqual({
    //             id,
    //             float,
    //             floats,
    //         });
    //     } finally {
    //         await session.close();
    //     }
    // });
});

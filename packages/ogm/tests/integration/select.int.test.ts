/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import neo4j from "./neo4j";
import { OGM } from "../../src";
import gql from "graphql-tag";

describe("select", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    describe("validation - should throw when using select and selectionSet at the same time", () => {
        const typeDefs = gql`
            type Movie {
                id: ID!
                title: String!
            }
        `;

        test("find", async () => {
            const ogm = new OGM({ typeDefs, driver });
            await ogm.init();

            const Movie = ogm.model("Movie");

            await expect(Movie.find({ selectionSet: "{ id }", select: { id: true } })).rejects.toThrow(
                "Cannot use arguments 'select' and 'selectionSet' at the same time"
            );
        });

        test("create", async () => {
            const ogm = new OGM({ typeDefs, driver });
            await ogm.init();

            const Movie = ogm.model("Movie");

            await expect(Movie.create({ input: {}, selectionSet: "{ id }", select: { id: true } })).rejects.toThrow(
                "Cannot use arguments 'select' and 'selectionSet' at the same time"
            );
        });

        test("update", async () => {
            const ogm = new OGM({ typeDefs, driver });
            await ogm.init();

            const Movie = ogm.model("Movie");

            await expect(Movie.update({ update: {}, selectionSet: "{ id }", select: { id: true } })).rejects.toThrow(
                "Cannot use arguments 'select' and 'selectionSet' at the same time"
            );
        });
    });

    describe("basic usage - should select simple properties on a node", () => {
        const typeDefs = gql`
            type Movie {
                id: ID!
                title: String!
            }
        `;

        test("find", async () => {
            const session = driver.session();

            const id = generate({
                charset: "alphabetic",
            });

            const title = generate({
                charset: "alphabetic",
            });

            const ogm = new OGM({ typeDefs, driver });
            await ogm.init();
            const Movie = ogm.model("Movie");

            try {
                await session.run(`
                    CREATE (:Movie {id: "${id}", title: "${title}"})
                `);
            } finally {
                await session.close();
            }

            // Select id and title
            const moviesIdTitle = await Movie.find({
                where: {
                    id,
                },
                select: {
                    id: true,
                    title: true,
                },
            });

            expect(moviesIdTitle).toMatchObject([
                {
                    id,
                    title,
                },
            ]);

            // Select only id
            const moviesId = await Movie.find({
                where: {
                    id,
                },
                select: {
                    id: true,
                },
            });

            expect(moviesId).toMatchObject([
                {
                    id,
                },
            ]);
        });

        test("create", async () => {
            const id = generate({
                charset: "alphabetic",
            });

            const title = generate({
                charset: "alphabetic",
            });

            const ogm = new OGM({ typeDefs, driver });
            await ogm.init();
            const Movie = ogm.model("Movie");

            const moviesTitle = await Movie.create({
                input: { id, title },
                select: {
                    title: true,
                },
            });

            expect(moviesTitle).toMatchObject({
                movies: [{ title }],
            });
        });

        test("update", async () => {
            const session = driver.session();
            const id = generate({
                charset: "alphabetic",
            });

            const title = generate({
                charset: "alphabetic",
            });

            const ogm = new OGM({ typeDefs, driver });
            await ogm.init();
            const Movie = ogm.model("Movie");

            try {
                await session.run(`
                    CREATE (:Movie {id: "${id}", title: "${title}"})
                `);
            } finally {
                await session.close();
            }

            const moviesTitle = await Movie.update({
                where: { id, title },
                update: { id, title: title + "new" },
                select: {
                    title: true,
                },
            });

            expect(moviesTitle).toMatchObject({
                movies: [{ title: title + "new" }],
            });
        });
    });

    // test.skip("should select simple properties on a relationship", () => {});

    // test.skip("should inject where inside relationship select", () => {});
});

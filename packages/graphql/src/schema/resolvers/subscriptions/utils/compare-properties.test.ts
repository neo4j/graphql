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

import { compareProperties } from "./compare-properties";

describe("Compare Properties", () => {
    test("with string array - equal", () => {
        const test = {
            old: {
                releasedIn: 2022,
                similarTitles: ["the matrix"],
                fileSize: 100,
                averageRating: 9.5,
                title: "some_small_movie",
                isFavorite: false,
            },
            current: {
                releasedIn: 2022,
                similarTitles: ["the matrix"],
                fileSize: 100,
                averageRating: 9.5,
                title: "some_small_movie",
                isFavorite: false,
            },
        };
        const res = compareProperties(test.old, test.current);
        expect(res).toBeTrue();
    });

    test("with object and string array - equal", () => {
        const test = {
            old: {
                releasedIn: 2022,
                similarTitles: ["the matrix"],
                actors: {
                    name: "Neo",
                },
                fileSize: 100,
                averageRating: 9.5,
                title: "some_small_movie",
                isFavorite: false,
            },
            current: {
                releasedIn: 2022,
                similarTitles: ["the matrix"],
                actors: {
                    name: "Neo",
                },
                fileSize: 100,
                averageRating: 9.5,
                title: "some_small_movie",
                isFavorite: false,
            },
        };
        const res = compareProperties(test.old, test.current);
        expect(res).toBeTrue();
    });

    test("with object and object array - equal", () => {
        const test = {
            old: {
                releasedIn: 2022,
                similarTitles: [
                    {
                        title: "the matrix",
                        releasedIn: 2000,
                    },
                ],
                actors: {
                    name: "Neo",
                },
            },
            current: {
                releasedIn: 2022,
                similarTitles: [
                    {
                        title: "the matrix",
                        releasedIn: 2000,
                    },
                ],
                actors: {
                    name: "Neo",
                },
            },
        };
        const res = compareProperties(test.old, test.current);
        expect(res).toBeTrue();
    });

    test("with object and object array len>1 - equal", () => {
        const test = {
            old: {
                releasedIn: 2022,
                similarTitles: [
                    { title: "the matrix", releasedIn: 2000 },
                    { title: "the godfather", releasedIn: 1990 },
                ],
                actors: {
                    name: "Neo",
                },
            },
            current: {
                releasedIn: 2022,
                similarTitles: [
                    { title: "the matrix", releasedIn: 2000 },
                    { title: "the godfather", releasedIn: 1990 },
                ],
                actors: {
                    name: "Neo",
                },
            },
        };
        const res = compareProperties(test.old, test.current);
        expect(res).toBeTrue();
    });

    test("with object and object array len>1 - equal in different order", () => {
        const test = {
            old: {
                releasedIn: 2022,
                similarTitles: [
                    { title: "the matrix", releasedIn: 2000 },
                    { title: "the godfather", releasedIn: 1999 },
                ],
                actors: {
                    name: "Neo",
                },
            },
            current: {
                releasedIn: 2022,
                similarTitles: [
                    { title: "the godfather", releasedIn: 1999 },
                    { title: "the matrix", releasedIn: 2000 },
                ],
                actors: {
                    name: "Neo",
                },
            },
        };
        const res = compareProperties(test.old, test.current);
        expect(res).toBeTrue();
    });

    test("with object and nested object array - equal", () => {
        const test = {
            old: {
                releasedIn: 2022,
                similarTitles: [{ title: "pulp fiction", releasedIn: 1999, actors: [{ name: "Travolta", age: 30 }] }],
                actors: {
                    name: "Neo",
                },
            },
            current: {
                releasedIn: 2022,
                similarTitles: [{ title: "pulp fiction", releasedIn: 1999, actors: [{ name: "Travolta", age: 30 }] }],
                actors: {
                    name: "Neo",
                },
            },
        };

        const res = compareProperties(test.old, test.current);
        expect(res).toBeTrue();
    });

    test("with object and nested object array - equal in different order", () => {
        const test = {
            old: {
                releasedIn: 2022,
                similarTitles: [
                    {
                        title: "pulp fiction",
                        releasedIn: 1999,
                        director: { name: "Tarantino", age: 35 },
                        actors: [{ name: "Travolta", age: 30 }],
                    },
                ],
                actors: {
                    name: "Neo",
                },
            },
            current: {
                releasedIn: 2022,
                similarTitles: [
                    {
                        title: "pulp fiction",
                        releasedIn: 1999,
                        actors: [{ name: "Travolta", age: 30 }],
                        director: { name: "Tarantino", age: 35 },
                    },
                ],
                actors: {
                    name: "Neo",
                },
            },
        };
        const res = compareProperties(test.old, test.current);
        expect(res).toBeTrue();
    });

    test("with nested object with array of strings len>1 and nested object array len>1 - equal object in different order", () => {
        const test = {
            old: {
                releasedIn: 2022,
                similarTitles: [
                    {
                        title: "pulp fiction",
                        releasedIn: 1999,
                        director: { name: "Tarantino", age: 35 },
                        actors: [{ name: "Travolta", age: 30 }],
                    },
                    {
                        title: "the matrix",
                        releasedIn: 2000,
                    },
                ],
                actors: {
                    name: "Neo",
                    titles: ["Movie1", "Movie2"],
                },
            },
            current: {
                releasedIn: 2022,
                similarTitles: [
                    {
                        title: "the matrix",
                        releasedIn: 2000,
                    },
                    {
                        title: "pulp fiction",
                        releasedIn: 1999,
                        actors: [{ name: "Travolta", age: 30 }],
                        director: { name: "Tarantino", age: 35 },
                    },
                ],
                actors: {
                    name: "Neo",
                    titles: ["Movie1", "Movie2"],
                },
            },
        };
        const res = compareProperties(test.old, test.current);
        expect(res).toBeTrue();
    });

    test("with nested object with array of strings len>1 and nested object array len>1  - equal array in different order", () => {
        const test = {
            old: {
                releasedIn: 2022,
                similarTitles: [
                    {
                        title: "pulp fiction",
                        releasedIn: 1999,
                        director: { name: "Tarantino", age: 35 },
                        actors: [{ name: "Travolta", age: 30 }],
                    },
                ],
                actors: {
                    name: "Neo",
                    titles: ["Movie1", "Movie2"],
                },
            },
            current: {
                releasedIn: 2022,
                actors: {
                    name: "Neo",
                    titles: ["Movie2", "Movie1"],
                },
                similarTitles: [
                    {
                        title: "pulp fiction",
                        releasedIn: 1999,
                        director: { name: "Tarantino", age: 35 },
                        actors: [{ name: "Travolta", age: 30 }],
                    },
                ],
            },
        };
        const res = compareProperties(test.old, test.current);
        expect(res).toBeTrue();
    });

    test("with nested object with array of objects len>1 and nested object array len>1  - equal", () => {
        const test = {
            old: {
                releasedIn: 2022,
                similarTitles: [
                    {
                        title: "pulp fiction",
                        releasedIn: 1999,
                        director: { name: "Tarantino", age: 35 },
                        actors: [{ name: "Travolta", age: 30 }],
                    },
                    {
                        title: "the matrix",
                        releasedIn: 2000,
                    },
                ],
                actors: {
                    name: "Neo",
                    titles: [
                        { title: "Movie1", releasedIn: 2020 },
                        { title: "Movie2", releasedIn: 2000 },
                    ],
                },
            },
            current: {
                releasedIn: 2022,
                similarTitles: [
                    {
                        title: "the matrix",
                        releasedIn: 2000,
                    },
                    {
                        title: "pulp fiction",
                        releasedIn: 1999,
                        director: { name: "Tarantino", age: 35 },
                        actors: [{ name: "Travolta", age: 30 }],
                    },
                ],
                actors: {
                    name: "Neo",
                    titles: [
                        { title: "Movie2", releasedIn: 2000 },
                        { title: "Movie1", releasedIn: 2020 },
                    ],
                },
            },
        };
        const res = compareProperties(test.old, test.current);
        expect(res).toBeTrue();
    });

    test("with nested object with array of objects len>1 and nested object array len>1  - equal in different order", () => {
        const test = {
            old: {
                releasedIn: 2022,
                similarTitles: [
                    {
                        title: "pulp fiction",
                        releasedIn: 1999,
                        director: { name: "Tarantino", age: 35 },
                        actors: [{ name: "Travolta", age: 30 }],
                    },
                ],
                actors: {
                    name: "Neo",
                    titles: [
                        { title: "Movie2", releasedIn: 2000 },
                        { title: "Movie1", releasedIn: 2020 },
                    ],
                },
            },
            current: {
                releasedIn: 2022,
                similarTitles: [
                    {
                        title: "pulp fiction",
                        releasedIn: 1999,
                        director: { age: 35, name: "Tarantino" },
                        actors: [{ age: 30, name: "Travolta" }],
                    },
                ],
                actors: {
                    name: "Neo",
                    titles: [
                        { releasedIn: 2020, title: "Movie1" },
                        { releasedIn: 2000, title: "Movie2" },
                    ],
                },
            },
        };
        const res = compareProperties(test.old, test.current);
        expect(res).toBeTrue();
    });

    test("with string array - diferent strings", () => {
        const test = {
            old: {
                releasedIn: 2022,
                similarTitles: ["the matrix"],
                fileSize: 100,
                averageRating: 9.5,
                title: "some_small_movie",
                isFavorite: false,
            },
            current: {
                releasedIn: 2022,
                similarTitles: ["the godfather"],
                fileSize: 101,
                averageRating: 9.5,
                title: "some_small_movie",
                isFavorite: false,
            },
        };
        const res = compareProperties(test.old, test.current);
        expect(res).toBeFalse();
    });

    test("with object and string array - different object", () => {
        const test = {
            old: {
                releasedIn: 2022,
                similarTitles: ["the matrix"],
                actors: {
                    name: "Neo",
                },
                fileSize: 100,
                averageRating: 9.5,
                title: "some_small_movie",
                isFavorite: false,
            },
            current: {
                releasedIn: 2022,
                similarTitles: ["the matrix"],
                actors: {
                    name: "Cypher",
                },
                fileSize: 101,
                averageRating: 9.5,
                title: "some_small_movie",
                isFavorite: false,
            },
        };
        const res = compareProperties(test.old, test.current);
        expect(res).toBeFalse();
    });

    test("with object and string array - different int", () => {
        const test = {
            old: {
                releasedIn: 2022,
                similarTitles: ["the matrix"],
                actors: {
                    name: "Neo",
                },
                fileSize: 100,
                averageRating: 9.5,
                title: "some_small_movie",
                isFavorite: false,
            },
            current: {
                releasedIn: 2022,
                similarTitles: ["the matrix"],
                actors: {
                    name: "Cypher",
                    age: 20,
                },
                fileSize: 101,
                averageRating: 9.5,
                title: "some_small_movie",
                isFavorite: false,
            },
        };
        const res = compareProperties(test.old, test.current);
        expect(res).toBeFalse();
    });

    test("with object and object array - different lengths", () => {
        const test = {
            old: {
                releasedIn: 2022,
                similarTitles: [
                    { title: "the matrix", releasedIn: 2000 },
                    { title: "the godfather", releasedIn: 1999 },
                ],
                actors: {
                    name: "Neo",
                },
            },
            current: {
                releasedIn: 2022,
                similarTitles: [{ title: "the matrix", releasedIn: 2000 }],
                actors: {
                    name: "Neo",
                },
            },
        };
        const res = compareProperties(test.old, test.current);
        expect(res).toBeFalse();
    });

    test("with object and object array - different lengths inverse", () => {
        const test = {
            old: {
                releasedIn: 2022,
                similarTitles: [{ title: "pulp fiction", releasedIn: 1999, actors: [{ name: "Travolta", age: 30 }] }],
                actors: {
                    name: "Neo",
                },
            },
            current: {
                releasedIn: 2022,
                similarTitles: [
                    { title: "the matrix", releasedIn: 2000 },
                    { title: "pulp fiction", releasedIn: 1990, actors: [{ name: "Travolta", age: 30 }] },
                ],
                actors: {
                    name: "Neo",
                },
            },
        };
        const res = compareProperties(test.old, test.current);
        expect(res).toBeFalse();
    });

    test("with object and object array - different object int field", () => {
        const test = {
            old: {
                releasedIn: 2022,
                similarTitles: [
                    {
                        title: "pulp fiction",
                        releasedIn: 1999,
                        director: { name: "Tarantino", age: 35 },
                        actors: [{ name: "Travolta", age: 30 }],
                    },
                ],
                actors: {
                    name: "Neo",
                },
            },
            current: {
                releasedIn: 2022,
                similarTitles: [
                    {
                        title: "pulp fiction",
                        releasedIn: 1990,
                        director: { name: "Tarantino", age: 35 },
                        actors: [{ name: "Travolta", age: 30 }],
                    },
                ],
                actors: {
                    name: "Neo",
                },
            },
        };
        const res = compareProperties(test.old, test.current);
        expect(res).toBeFalse();
    });

    test("with object and object array - different object fields", () => {
        const test = {
            old: {
                releasedIn: 2022,
                similarTitles: [
                    {
                        title: "pulp fiction",
                        releasedIn: 1999,
                        director: { name: "Tarantino" },
                        actors: [{ name: "Travolta", age: 30 }],
                    },
                ],
                actors: {
                    name: "Neo",
                },
            },
            current: {
                releasedIn: 2022,
                similarTitles: [
                    {
                        title: "pulp fiction",
                        releasedIn: 1999,
                        director: { name: "Tarantino", age: 35 },
                        actors: [{ name: "Travolta", age: 30 }],
                    },
                ],
                actors: {
                    name: "Neo",
                },
            },
        };
        const res = compareProperties(test.old, test.current);
        expect(res).toBeFalse();
    });

    test("with object and nested object array - different lengths", () => {
        const test = {
            old: {
                releasedIn: 2022,
                similarTitles: [
                    {
                        title: "pulp fiction",
                        releasedIn: 1999,
                        director: { name: "Tarantino", age: 35 },
                        actors: [{ name: "Travolta", age: 30 }],
                    },
                ],
                actors: {
                    name: "Neo",
                },
            },
            current: {
                releasedIn: 2022,
                similarTitles: [
                    {
                        title: "the matrix",
                        releasedIn: 2000,
                    },
                    {
                        title: "pulp fiction",
                        releasedIn: 1999,
                        director: { name: "Tarantin", age: 35 },
                        actors: [{ name: "Travolta", age: 30 }],
                    },
                ],
                actors: {
                    name: "Neo",
                },
            },
        };
        const res = compareProperties(test.old, test.current);
        expect(res).toBeFalse();
    });

    test("with object and nested object array - different", () => {
        const test = {
            old: {
                releasedIn: 2022,
                similarTitles: [
                    {
                        title: "pulp fiction",
                        releasedIn: 1999,
                        director: { name: "Tarantino", age: 35 },
                        actors: [{ name: "Travolta", age: 30 }, { name: "x" }],
                    },
                ],
                actors: {
                    name: "Neo",
                },
            },
            current: {
                releasedIn: 2022,
                similarTitles: [
                    {
                        title: "pulp fiction",
                        releasedIn: 1999,
                        director: { name: "Tarantino", age: 35 },
                        actors: [{ name: "Travolta", age: 30 }, { name: "y" }],
                    },
                ],
                actors: {
                    name: "Neo",
                },
            },
        };

        const res = compareProperties(test.old, test.current);
        expect(res).toBeFalse();
    });

    test("with nested object with array of strings len>1 and nested object array - different obj.array len", () => {
        const test = {
            old: {
                releasedIn: 2022,
                similarTitles: [
                    {
                        title: "pulp fiction",
                        releasedIn: 1999,
                        director: { name: "Tarantino", age: 35 },
                        actors: [{ name: "Travolta", age: 30 }],
                    },
                ],
                actors: {
                    name: "Neo",
                    titles: ["Movie1", "Movie2", "Movie3"],
                },
            },
            current: {
                releasedIn: 2022,
                similarTitles: [
                    {
                        title: "pulp fiction",
                        releasedIn: 1999,
                        director: { name: "Tarantino", age: 35 },
                        actors: [{ name: "Travolta", age: 30 }],
                    },
                ],
                actors: {
                    name: "Neo",
                    titles: ["Movie1", "Movie2"],
                },
            },
        };
        const res = compareProperties(test.old, test.current);
        expect(res).toBeFalse();
    });

    test("with nested object with array of strings len>1 and nested object array - different obj.array fields", () => {
        const test = {
            old: {
                releasedIn: 2022,
                similarTitles: [
                    {
                        title: "pulp fiction",
                        releasedIn: 1999,
                        director: { name: "Tarantino", age: 35 },
                        actors: [{ name: "Travolta", age: 30 }],
                    },
                ],
                actors: {
                    name: "Neo",
                    titles: [
                        { title: "Movie1", releasedIn: 2020 },
                        { title: "Movie2", releasedIn: 2000 },
                    ],
                },
            },
            current: {
                releasedIn: 2022,
                similarTitles: [
                    {
                        title: "pulp fiction",
                        releasedIn: 1999,
                        director: { name: "Tarantino", age: 35 },
                        actors: [{ name: "Travolta", age: 30 }],
                    },
                ],
                actors: {
                    name: "Neo",
                    titles: [
                        { title: "Movie1", releasedIn: 2020 },
                        { title: "Movie3", releasedIn: 2000 },
                    ],
                },
            },
        };
        const res = compareProperties(test.old, test.current);
        expect(res).toBeFalse();
    });

    test("with nested object with array of strings len>1 and nested object array - different obj fields of same type", () => {
        const test = {
            old: {
                releasedIn: 2022,
                similarTitles: [
                    {
                        title: "pulp fiction",
                        releasedIn: 1999,
                        director: { name: "Tarantino", age: 35 },
                        actors: [{ name: "Travolta", age: 30 }],
                    },
                ],
                actors: {
                    name: "Neo",
                    titles: [
                        { title: "Movie1", releasedIn: 2020 },
                        { title: "Movie2", releasedIn: 2000 },
                    ],
                },
            },
            current: {
                releasedIn: 2022,
                actors: {
                    name: "Neo",
                    titles: [
                        { title: "Movie1", releasedIn: 2020 },
                        { title: "Movie3", releasedIn: 2000 },
                    ],
                },
                ratings: [
                    {
                        site: "imdb",
                        rating: 9,
                    },
                    {
                        site: "rotten tomatos",
                        rating: 9.9,
                    },
                ],
            },
        };

        // @ts-ignore
        const res = compareProperties(test.old, test.current);
        expect(res).toBeFalse();
    });

    test("with nested object with array of strings len>1 and nested object array - different obj types of same field", () => {
        const test = {
            old: {
                releasedIn: 2022,
                ratings: {
                    imdb: 9,
                    rottenTomatoes: 9.9,
                },
                actors: {
                    name: "Neo",
                    titles: [
                        { title: "Movie1", releasedIn: 2020 },
                        { title: "Movie2", releasedIn: 2000 },
                    ],
                },
            },
            current: {
                releasedIn: 2022,
                actors: {
                    name: "Neo",
                    titles: [
                        { title: "Movie1", releasedIn: 2020 },
                        { title: "Movie3", releasedIn: 2000 },
                    ],
                },
                ratings: [
                    {
                        site: "imdb",
                        rating: 9,
                    },
                    {
                        site: "rotten tomatos",
                        rating: 9.9,
                    },
                ],
            },
        };

        // @ts-ignore
        const res = compareProperties(test.old, test.current);
        expect(res).toBeFalse();
    });
});

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

    test("with number array - equal", () => {
        const test = {
            old: {
                releasedIn: 2022,
                otherReleases: [2000],
            },
            current: {
                releasedIn: 2022,
                otherReleases: [2000],
            },
        };
        const res = compareProperties(test.old, test.current);
        expect(res).toBeTrue();
    });

    test("with number array - different", () => {
        const test = {
            old: {
                releasedIn: 2022,
                otherReleases: [2000],
            },
            current: {
                releasedIn: 2022,
                otherReleases: [200],
            },
        };
        const res = compareProperties(test.old, test.current);
        expect(res).toBeFalse();
    });

    test("with number array len>1 - different bc order", () => {
        const test = {
            old: {
                releasedIn: 2022,
                otherReleases: [2000, 2020],
            },
            current: {
                releasedIn: 2022,
                otherReleases: [2020, 2000],
            },
        };
        const res = compareProperties(test.old, test.current);
        expect(res).toBeFalse();
    });

    test("with number array len>1 - equal", () => {
        const test = {
            old: {
                releasedIn: 2022,
                otherReleases: [2000, 2020],
            },
            current: {
                releasedIn: 2022,
                otherReleases: [2000, 2020],
            },
        };
        const res = compareProperties(test.old, test.current);
        expect(res).toBeTrue();
    });

    test("with string array len>1 - equal", () => {
        const test = {
            old: {
                releasedIn: 2022,
                similarTitles: ["the matrix", "the godfather"],
            },
            current: {
                releasedIn: 2022,
                similarTitles: ["the matrix", "the godfather"],
            },
        };
        const res = compareProperties(test.old, test.current);
        expect(res).toBeTrue();
    });

    test("with string array len>1 - different bc order", () => {
        const test = {
            old: {
                releasedIn: 2022,
                similarTitles: ["the matrix", "the godfather"],
            },
            current: {
                releasedIn: 2022,
                similarTitles: ["the godfather", "the matrix"],
            },
        };
        const res = compareProperties(test.old, test.current);
        expect(res).toBeFalse();
    });

    test("with string array len>1 - different bc props order", () => {
        const test = {
            old: {
                similarTitles: ["the matrix", "the godfather"],
                releasedIn: 2022,
            },
            current: {
                releasedIn: 2022,
                similarTitles: ["the godfather", "the matrix"],
            },
        };
        const res = compareProperties(test.old, test.current);
        expect(res).toBeFalse();
    });

    test("with string array len>1 - different bc number prop", () => {
        const test = {
            old: {
                releasedIn: 2002,
                similarTitles: ["the matrix", "the godfather"],
            },
            current: {
                releasedIn: 2022,
                similarTitles: ["the godfather", "the matrix"],
            },
        };
        const res = compareProperties(test.old, test.current);
        expect(res).toBeFalse();
    });

    test("with string array len>1 - different bc one empty", () => {
        const test = {
            old: {
                releasedIn: 2002,
                similarTitles: [],
            },
            current: {
                releasedIn: 2022,
                similarTitles: ["the godfather", "the matrix"],
            },
        };
        const res = compareProperties(test.old, test.current);
        expect(res).toBeFalse();
    });

    test("with empty array - equal", () => {
        const test = {
            old: {
                releasedIn: 2022,
                similarTitles: [],
            },
            current: {
                releasedIn: 2022,
                similarTitles: [],
            },
        };
        const res = compareProperties(test.old, test.current);
        expect(res).toBeTrue();
    });

    test("with empty array - different number", () => {
        const test = {
            old: {
                releasedIn: 2022,
                similarTitles: [],
            },
            current: {
                releasedIn: 2020,
                similarTitles: [],
            },
        };
        const res = compareProperties(test.old, test.current);
        expect(res).toBeFalse();
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

    test("with all prop types - different int", () => {
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
                fileSize: 101,
                averageRating: 9.5,
                title: "some_small_movie",
                isFavorite: false,
            },
        };
        const res = compareProperties(test.old, test.current);
        expect(res).toBeFalse();
    });

    test("with all prop types - different bool", () => {
        const test = {
            old: {
                releasedIn: 2022,
                similarTitles: ["the matrix"],
                fileSize: 100,
                averageRating: 9.5,
                title: "some_small_movie",
                isFavorite: true,
            },
            current: {
                releasedIn: 2022,
                similarTitles: ["the matrix"],
                fileSize: 101,
                averageRating: 9.5,
                title: "some_small_movie",
                isFavorite: false,
            },
        };
        const res = compareProperties(test.old, test.current);
        expect(res).toBeFalse();
    });

    test("with all prop types - equal in different order", () => {
        const test = {
            old: {
                releasedIn: 2022,
                similarTitles: ["the matrix"],
                isFavorite: false,
                fileSize: 101,
                averageRating: 9.5,
                title: "some_small_movie",
            },
            current: {
                releasedIn: 2022,
                similarTitles: ["the matrix"],
                fileSize: 101,
                averageRating: 9.5,
                title: "some_small_movie",
                isFavorite: false,
            },
        };
        const res = compareProperties(test.old, test.current);
        expect(res).toBeTrue();
    });

    test("with string array - different len", () => {
        const test = {
            old: {
                releasedIn: 2022,
                similarTitles: ["the matrix", "fight club"],
            },
            current: {
                releasedIn: 2022,
                similarTitles: ["the matrix"],
            },
        };
        const res = compareProperties(test.old, test.current);
        expect(res).toBeFalse();
    });

    test("with string array - different len inverse", () => {
        const test = {
            old: {
                releasedIn: 2022,
                similarTitles: ["the matrix"],
            },
            current: {
                releasedIn: 2022,
                similarTitles: ["the matrix", "fight club"],
            },
        };
        const res = compareProperties(test.old, test.current);
        expect(res).toBeFalse();
    });
});

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
    const withstringarrayequal = {
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
    }; // pass

    const withstringarraydifferentarray = {
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
    }; // fail

    const withobjectandstringarrayequal = {
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
    }; // pass

    const withobjectandstringarraydifferentobject = {
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

    const withobjectandstringarraydifferentobject2 = {
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

    const withobjectandstringarrayequal2 = {
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
    }; // pass

    const withobjectandstringarraymultipleequal = {
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
    }; // pass

    const withobjectandstringarraymultipleequaldifferentorder = {
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
    }; // pass

    const withobjectandstringarraymultipledifferentlengths = {
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

    const withobjectandstringarraynestedequal = {
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
    }; // pass

    const withobjectandstringarraynesteddifferentlengths = {
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

    const withobjectandstringarraynestedwithobjectequaldifferentorder = {
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
    }; // pass

    const withobjectandstringarraynestedwithobjectdifferent = {
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

    // TODO: this passes bc not checking for same properties currently
    const withobjectandstringarraynestedwithobjectdifferent2 = {
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

    const withobjectandstringarraynestedwithobjectdifferent3 = {
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

    const withobjectandstringarraynestedwithobjectdifferent4 = {
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

    const withobjectandstringarraynestedwithobjectmultipleequaldifferentorder = {
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
    }; // pass

    const withobjectandstringarraynestedwithobjectmultipleequaldifferentorder2 = {
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
    }; // pass

    const withnestedobjectandstringarraynestedwithobjectmultipledifferent = {
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

    const withnestedobjectandstringarraynestedwithobjectmultipleequal = {
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
    }; // pass

    const withnestedobjectandstringarraynestedwithobjectmultipleequal2 = {
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
    }; // pass

    const withnestedobjectandstringarraynestedwithobjectmultipledifferent2 = {
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

    test("withstringarrayequal", () => {
        const res = compareProperties(withstringarrayequal.old, withstringarrayequal.current);
        expect(res).toBeTrue();
    });

    test("withobjectandstringarrayequal", () => {
        const res = compareProperties(withobjectandstringarrayequal.old, withobjectandstringarrayequal.current);
        expect(res).toBeTrue();
    });

    test("withobjectandstringarrayequal2", () => {
        const res = compareProperties(withobjectandstringarrayequal2.old, withobjectandstringarrayequal2.current);
        expect(res).toBeTrue();
    });

    test("withobjectandstringarraymultipleequal", () => {
        const res = compareProperties(
            withobjectandstringarraymultipleequal.old,
            withobjectandstringarraymultipleequal.current
        );
        expect(res).toBeTrue();
    });

    test("withobjectandstringarraymultipleequaldifferentorder", () => {
        const res = compareProperties(
            withobjectandstringarraymultipleequaldifferentorder.old,
            withobjectandstringarraymultipleequaldifferentorder.current
        );
        expect(res).toBeTrue();
    });

    test("withobjectandstringarraynestedequal", () => {
        const res = compareProperties(
            withobjectandstringarraynestedequal.old,
            withobjectandstringarraynestedequal.current
        );
        expect(res).toBeTrue();
    });

    test("withobjectandstringarraynestedwithobjectequaldifferentorder", () => {
        const res = compareProperties(
            withobjectandstringarraynestedwithobjectequaldifferentorder.old,
            withobjectandstringarraynestedwithobjectequaldifferentorder.current
        );
        expect(res).toBeTrue();
    });

    test("withobjectandstringarraynestedwithobjectmultipleequaldifferentorder", () => {
        const res = compareProperties(
            withobjectandstringarraynestedwithobjectmultipleequaldifferentorder.old,
            withobjectandstringarraynestedwithobjectmultipleequaldifferentorder.current
        );
        expect(res).toBeTrue();
    });

    test("withobjectandstringarraynestedwithobjectmultipleequaldifferentorder2", () => {
        const res = compareProperties(
            withobjectandstringarraynestedwithobjectmultipleequaldifferentorder2.old,
            withobjectandstringarraynestedwithobjectmultipleequaldifferentorder2.current
        );
        expect(res).toBeTrue();
    });

    test("withnestedobjectandstringarraynestedwithobjectmultipleequal", () => {
        const res = compareProperties(
            withnestedobjectandstringarraynestedwithobjectmultipleequal.old,
            withnestedobjectandstringarraynestedwithobjectmultipleequal.current
        );
        expect(res).toBeTrue();
    });

    test("withnestedobjectandstringarraynestedwithobjectmultipleequal2", () => {
        const res = compareProperties(
            withnestedobjectandstringarraynestedwithobjectmultipleequal2.old,
            withnestedobjectandstringarraynestedwithobjectmultipleequal2.current
        );
        expect(res).toBeTrue();
    });

    test("withstringarraydifferentarray", () => {
        const res = compareProperties(withstringarraydifferentarray.old, withstringarraydifferentarray.current);
        expect(res).toBeFalse();
    });

    test("withobjectandstringarraydifferentobject", () => {
        const res = compareProperties(
            withobjectandstringarraydifferentobject.old,
            withobjectandstringarraydifferentobject.current
        );
        expect(res).toBeFalse();
    });

    test("withobjectandstringarraydifferentobject2", () => {
        const res = compareProperties(
            withobjectandstringarraydifferentobject2.old,
            withobjectandstringarraydifferentobject2.current
        );
        expect(res).toBeFalse();
    });

    test("withobjectandstringarraymultipledifferentlengths", () => {
        const res = compareProperties(
            withobjectandstringarraymultipledifferentlengths.old,
            withobjectandstringarraymultipledifferentlengths.current
        );
        expect(res).toBeFalse();
    });

    test("withobjectandstringarraynesteddifferentlengths", () => {
        const res = compareProperties(
            withobjectandstringarraynesteddifferentlengths.old,
            withobjectandstringarraynesteddifferentlengths.current
        );
        expect(res).toBeFalse();
    });

    test("withobjectandstringarraynestedwithobjectdifferent", () => {
        const res = compareProperties(
            withobjectandstringarraynestedwithobjectdifferent.old,
            withobjectandstringarraynestedwithobjectdifferent.current
        );
        expect(res).toBeFalse();
    });

    test.skip("withobjectandstringarraynestedwithobjectdifferent2", () => {
        const res = compareProperties(
            withobjectandstringarraynestedwithobjectdifferent2.old,
            withobjectandstringarraynestedwithobjectdifferent2.current
        );
        expect(res).toBeFalse();
    });

    test("withobjectandstringarraynestedwithobjectdifferent3", () => {
        const res = compareProperties(
            withobjectandstringarraynestedwithobjectdifferent3.old,
            withobjectandstringarraynestedwithobjectdifferent3.current
        );
        expect(res).toBeFalse();
    });

    test("withobjectandstringarraynestedwithobjectdifferent4", () => {
        const res = compareProperties(
            withobjectandstringarraynestedwithobjectdifferent4.old,
            withobjectandstringarraynestedwithobjectdifferent4.current
        );
        expect(res).toBeFalse();
    });

    test("withnestedobjectandstringarraynestedwithobjectmultipledifferent", () => {
        const res = compareProperties(
            withnestedobjectandstringarraynestedwithobjectmultipledifferent.old,
            withnestedobjectandstringarraynestedwithobjectmultipledifferent.current
        );
        expect(res).toBeFalse();
    });

    test("withnestedobjectandstringarraynestedwithobjectmultipledifferent2", () => {
        const res = compareProperties(
            withnestedobjectandstringarraynestedwithobjectmultipledifferent2.old,
            withnestedobjectandstringarraynestedwithobjectmultipledifferent2.current
        );
        expect(res).toBeFalse();
    });
});

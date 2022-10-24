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

import { queryIsMutation } from "./utils";

describe("queryIsMutation", () => {
    test("should detect unnamed mutation", () => {
        const query = `
            mutation {
                createMovies(input: {released: 19992, title: "1232123"}) {
                    movies {
                        released
                        tagline
                        title
                    }
                }
            }
        `;

        expect(queryIsMutation(query)).toBeTruthy();
    });

    test("should detect named mutation", () => {
        const query = `
            mutation MyMutation {
                createMovies(input: {released: 19992, title: "1232123"}) {
                    movies {
                        released
                        tagline
                        title
                    }
                }
            }
        `;

        expect(queryIsMutation(query)).toBeTruthy();
    });

    test("should detect named mutation with arguments", () => {
        const query = `
            mutation CreateReviewForEpisode($ep: Episode!, $review: ReviewInput!) {
                createReview(episode: $ep, review: $review) {
                    stars
                    commentary
                }
            }
        `;

        expect(queryIsMutation(query)).toBeTruthy();
    });

    test("should ignore named query", () => {
        const query = `
            query MyTest {
                createReview(episode: $ep, review: $review) {
                    stars
                    commentary
                }
            }
        `;

        expect(queryIsMutation(query)).toBeFalsy();
    });

    test("should ignore unnamed query", () => {
        const query = `
            query {
                createReview(episode: $ep, review: $review) {
                    stars
                    commentary
                }
            }
        `;

        expect(queryIsMutation(query)).toBeFalsy();
    });

    test("should ignore implicit query type", () => {
        const query = `
            {
                createReview(episode: $ep, review: $review) {
                    stars
                    commentary
                }
            }
        `;

        expect(queryIsMutation(query)).toBeFalsy();
    });

    test("should detect named query with arguments", () => {
        const query = `
            query TheEpisodeQuery($ep: Episode!, $review: ReviewInput!) {
                episodes {
                    stars
                    commentary
                }
            }
        `;

        expect(queryIsMutation(query)).toBeFalsy();
    });
});

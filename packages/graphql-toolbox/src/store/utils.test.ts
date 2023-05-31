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

import { getQueryOrMutationName } from "./utils";

describe("getQueryOrMutationName", () => {
    test("well named query", () => {
        const query = `
        query MyQuery {
            movies {
              title
            }
          }
        `;
        expect(getQueryOrMutationName(query)).toBe("MyQuery");
    });

    test("query with parameter", () => {
        const query = `
        query MyTest2 ($moviesWhere: MovieWhere) {
          movies(where: $moviesWhere) {
              id
          }
      }
      `;
        expect(getQueryOrMutationName(query)).toBe("MyTest2");
    });

    test("query with parameter no white space", () => {
        const query = `
      query MyTest2($moviesWhere: MovieWhere) {
        movies(where: $moviesWhere) {
            id
        }
    }
    `;
        expect(getQueryOrMutationName(query)).toBe("MyTest2");
    });

    test("two well named queries", () => {
        const query = `
        query MyQuery0 {
            movies {
              title
            }
          }

        query MyQuery1 {
            movies {
              title
            }
          }
        `;
        expect(getQueryOrMutationName(query)).toBe("MyQuery0");
    });

    test("query and mutation", () => {
        const query = `
        mutation MyMutationOne {
            createMovies(input: {title: "rty"}) {
              movies {
                title
              }
            }
          }

        query MyQuery1 {
            movies {
              title
            }
          }
        `;
        expect(getQueryOrMutationName(query)).toBe("MyMutationOne");
    });

    test("well named mutation", () => {
        const query = `
        mutation MyMutationM {
            createMovies(input: {title: "rty"}) {
              movies {
                title
              }
            }
          }
        `;
        expect(getQueryOrMutationName(query)).toBe("MyMutationM");
    });

    test("query with no name", () => {
        const query = `
          query {
            __typename
          }
          `;
        expect(getQueryOrMutationName(query)).toBe("Unnamed");
    });

    test("query with one letter name", () => {
        const query = `
          query P {
            __typename
          }
          `;
        expect(getQueryOrMutationName(query)).toBe("P");
    });

    test("random text", () => {
        const query = `
        ekjbtehrdfg
        `;
        expect(getQueryOrMutationName(query)).toBe("Unnamed");
    });

    test("semi-random text", () => {
        const query = `
        typ Query2
        `;
        expect(getQueryOrMutationName(query)).toBe("Unnamed");
    });

    test("no text", () => {
        const query = " ";
        expect(getQueryOrMutationName(query)).toBe("Unnamed");
    });
});

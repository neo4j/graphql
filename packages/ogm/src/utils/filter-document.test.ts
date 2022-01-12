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

import { parse, print } from "graphql";
import filterDocument from "./filter-document";

describe("filterDocument", () => {
    test("should remove all directives", () => {
        const initial = `
            type User @auth @exclude {
                id: ID @auth @private @readonly @writeonly
                name: String @auth @private @readonly @writeonly
                email: String @auth @private @readonly @writeonly
                password: String @auth @private @readonly @writeonly
            }


        `;

        const filtered = filterDocument(initial);

        expect(print(filtered)).toEqual(
            print(
                parse(`
                    type User {
                        id: ID
                        name: String
                        email: String
                        password: String
                    }
                `)
            )
        );
    });
});

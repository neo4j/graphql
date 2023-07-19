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

import { print } from "graphql";
import { filterDocument } from "./filter-document";

describe("filterDocument", () => {
    test("should remove all directives", () => {
        const initial = `
            type User @auth @exclude {
                id: ID @auth @private @readonly @writeonly
                name: String @auth @private @readonly @writeonly
                email: String @auth @private @readonly @writeonly
                password: String @auth @private @readonly @writeonly
                cars: [Car!]! @relationship(type: "HAS_CAR", direction: OUT, aggregate: false)
                bikes: [Car!]! @relationship(type: "HAS_CAR", direction: OUT)  
            }

            type Car @query(read: false, aggregate: false) @mutation(operations: []), @subscription(operations: []) {
                name: String @filterable(byValue: false, byAggregate: false)
                engine: String @selectable(onRead: false, onAggregate: false)
            }

            type Bike {
                name: String @settable(onCreate: false, onUpdate: false)
                engine: String @filterable
                model: String @selectable
                type: String @settable
            }
            extend schema @query(read: false, aggregate: false) @mutation(operations: []) @subscription(operations: [])
        `;

        const filtered = filterDocument(initial);

        expect(print(filtered)).toMatchInlineSnapshot(`
            "type User {
              id: ID
              name: String
              email: String
              password: String
              cars: [Car!]! @relationship(type: \\"HAS_CAR\\", direction: OUT, aggregate: true)
              bikes: [Car!]! @relationship(type: \\"HAS_CAR\\", direction: OUT, aggregate: true)
            }

            type Car {
              name: String
              engine: String
            }

            type Bike {
              name: String
              engine: String
              model: String
              type: String
            }

            extend schema @query(read: true, aggregate: true) @mutation(operations: [CREATE, UPDATE, DELETE]) @subscription(operations: [CREATE, UPDATE, DELETE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP])"
        `);
    });
});

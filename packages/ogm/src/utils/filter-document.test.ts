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
        const initial = /* GraphQL */ `
            type User @authentication @authorization {
                id: ID @id @private @unique
                name: String @authentication @authorization @private
                email: String @cypher @private
                password: String @private
                cars: [Car!]! @relationship(type: "HAS_CAR", direction: OUT, aggregate: false)
                bikes: [Car!]! @relationship(type: "HAS_CAR", direction: OUT)
            }

            type Car {
                name: String @filterable(byValue: false, byAggregate: false)
                engine: String @selectable(onRead: false, onAggregate: false)
            }

            union CarOrBike = Car | Bike

            interface Vehicle @query(read: false) {
                name: String @settable(onCreate: false, onUpdate: false)
                engine: String
            }

            type Motorbike implements Vehicle @query(read: false) {
                name: String @settable(onCreate: false, onUpdate: false)
                kw: Int
                engine: String @filterable
            }

            type Bike @query(read: false) {
                name: String @settable(onCreate: false, onUpdate: false)
                engine: String @filterable
                model: String @selectable
                type: String @settable
            }

            extend type Car @query(read: false, aggregate: false)

            extend type Bike {
                stuff: String @settable(onCreate: false)
            }

            extend interface Vehicle @query(read: false) {
                kw: Int @settable(onCreate: false, onUpdate: false)
            }
            extend union CarOrBike @query(read: false)
            extend schema @query(read: false, aggregate: false) @mutation(operations: []) @subscription(events: [])
        `;

        const filtered = filterDocument(initial);

        expect(print(filtered)).toMatchInlineSnapshot(`
            "type User {
              id: ID @id @unique
              name: String
              email: String @cypher
              password: String
              cars: [Car!]! @relationship(type: \\"HAS_CAR\\", direction: OUT, aggregate: true)
              bikes: [Car!]! @relationship(type: \\"HAS_CAR\\", direction: OUT, aggregate: true)
            }

            type Car {
              name: String
              engine: String
            }

            union CarOrBike = Car | Bike

            interface Vehicle {
              name: String
              engine: String
              kw: Int
            }

            type Motorbike implements Vehicle {
              name: String
              kw: Int
              engine: String
            }

            type Bike {
              name: String
              engine: String
              model: String
              type: String
              stuff: String
            }

            extend schema @query(read: true, aggregate: true) @mutation(operations: [CREATE, UPDATE, DELETE]) @subscription(events: [CREATED, UPDATED, DELETED, RELATIONSHIP_CREATED, RELATIONSHIP_DELETED])"
        `);
    });
});

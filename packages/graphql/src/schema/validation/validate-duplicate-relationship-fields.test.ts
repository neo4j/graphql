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

import { gql } from "apollo-server";
import validateDocument from "./validate-document";

describe("validateDuplicateRelationshipFields", () => {
    test("should throw an error if multiple relationship fields in the same type have the same relationship type.", () => {
        const doc = gql`
            type Team {
                name: String!
                player1: Person! @relationship(type: "PLAYS_IN", direction: IN)
                player2: Person! @relationship(type: "PLAYS_IN", direction: IN)
                backupPlayers: [Person!]! @relationship(type: "PLAYS_IN", direction: IN)
            }

            type Person {
                name: String!
                teams: [Team!]! @relationship(type: "PLAYS_IN", direction: OUT)
            }
        `;

        expect(() => validateDocument({ document: doc })).toThrow(
            "Multiple relationship fields with the same type and direction may not have the same relationship type."
        );
    });

    test("should not throw an error if multiple relationship fields of different types have the same relationship type.", () => {
        const doc = gql`
            type Team {
                name: String!
                player: Person! @relationship(type: "PLAYS_IN", direction: IN)
                venue: Venue! @relationship(type: "PLAYS_IN", direction: IN)
            }

            type Person {
                name: String!
                teams: [Team!]! @relationship(type: "PLAYS_IN", direction: OUT)
            }

            type Venue {
                location: String!
            }
        `;

        expect(() => validateDocument({ document: doc })).not.toThrow();
    });

    test("should not throw an error if multiple relationship fields in the same type have the same relationship type but have different directions.", () => {
        const doc = gql`
            type Team {
                name: String!
                player: Person! @relationship(type: "PLAYS_IN", direction: IN)
                venue: Venue! @relationship(type: "PLAYS_IN", direction: IN)
            }

            type Person {
                name: String!
                teams: [Team!]! @relationship(type: "PLAYS_IN", direction: OUT)
            }

            type Venue {
                location: String!
            }
        `;

        expect(() => validateDocument({ document: doc })).not.toThrow();
    });
});

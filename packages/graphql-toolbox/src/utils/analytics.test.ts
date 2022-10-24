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

import { simpleTypeDefinitionsAnalytics } from "./analytics";

describe("simpleTypeDefinitionsAnalytics", () => {
    test("should count types correctly for very simple type definitions", () => {
        const typeDefinitions = `
            type Query {
                me: String
            }
        `;

        const { numberOfDirectives, numberOfInterfaces, numberOfTypes, numberOfUnions } =
            simpleTypeDefinitionsAnalytics(typeDefinitions);
        expect(numberOfTypes).toBe(1);
        expect(numberOfDirectives).toBe(0);
        expect(numberOfUnions).toBe(0);
        expect(numberOfInterfaces).toBe(0);
    });

    test("should count interfaces correctly", () => {
        const typeDefinitions = `
            type Movie {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
                directors: [Director!]! @relationship(type: "DIRECTED", properties: "Directed", direction: IN)
                reviewers: [Reviewer!]! @relationship(type: "REVIEWED", properties: "Review", direction: IN)
                imdbId: Int @unique
            }
            
            type Actor {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }
            
            interface ActedIn @relationshipProperties {
                screenTime: Int!
            }
            
            interface Directed @relationshipProperties {
                year: Int!
            }
            
            interface Review {
                score: Int!
            }
        
            type Person implements Reviewer {
                name: String!
                reputation: Int!
            }
            
            type Influencer implements Reviewer {
                reputation: Int!
                url: String!
            }
            
            union Director = Person | Actor
            
            interface Reviewer {
                reputation: Int!

            }
        `;

        const { numberOfDirectives, numberOfInterfaces, numberOfTypes, numberOfUnions } =
            simpleTypeDefinitionsAnalytics(typeDefinitions);
        expect(numberOfTypes).toBe(4);
        expect(numberOfDirectives).toBe(0);
        expect(numberOfUnions).toBe(1);
        expect(numberOfInterfaces).toBe(4);
    });

    test("should count directives correctly", () => {
        const typeDefinitions = `
            # Definition
            directive @uppercase on FIELD_DEFINITION

            directive @lowercase on FIELD_DEFINITION

            type Query {
                # Usage
                hello: String @uppercase
                bello: String @lowercase
            }
        `;

        const { numberOfDirectives, numberOfInterfaces, numberOfTypes, numberOfUnions } =
            simpleTypeDefinitionsAnalytics(typeDefinitions);
        expect(numberOfTypes).toBe(1);
        expect(numberOfDirectives).toBe(2);
        expect(numberOfUnions).toBe(0);
        expect(numberOfInterfaces).toBe(0);
    });

    test("should count unions correctly", () => {
        const typeDefinitions = `
            type Movie {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
                directors: [Director!]! @relationship(type: "DIRECTED", properties: "Directed", direction: IN)
                reviewers: [Reviewer!]! @relationship(type: "REVIEWED", properties: "Review", direction: IN)
                imdbId: Int @unique
            }
            
            type Actor {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }
            
            union Director = Person | Actor
            
            union Tester = Person | Actor

            interface Reviewer {
                reputation: Int!

            }
        `;

        const { numberOfDirectives, numberOfInterfaces, numberOfTypes, numberOfUnions } =
            simpleTypeDefinitionsAnalytics(typeDefinitions);
        expect(numberOfTypes).toBe(2);
        expect(numberOfDirectives).toBe(0);
        expect(numberOfUnions).toBe(2);
        expect(numberOfInterfaces).toBe(1);
    });
});

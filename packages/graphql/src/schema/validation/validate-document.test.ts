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
import { parse } from "graphql";
import { RESERVED_TYPE_NAMES } from "../../constants";
import validateDocument from "./validate-document";

describe("validateDocument", () => {
    test("should throw an error if a directive is in the wrong location", () => {
        const doc = parse(`
            type User @coalesce {
                name: String
            }
        `);

        expect(() => validateDocument(doc)).toThrow('Directive "@coalesce" may not be used on OBJECT.');
    });

    test("should throw an error if a directive is missing an argument", () => {
        const doc = parse(`
            type User {
                name: String @coalesce
            }
        `);

        expect(() => validateDocument(doc)).toThrow(
            'Directive "@coalesce" argument "value" of type "Scalar!" is required, but it was not provided.'
        );
    });

    test("should throw a missing scalar error", () => {
        const doc = parse(`
            type User {
                name: Unknown
            }
        `);

        expect(() => validateDocument(doc)).toThrow('Unknown type "Unknown".');
    });

    test("should throw an error if a user tries to pass in their own Point definition", () => {
        const doc = parse(`
            type Point {
                latitude: Float!
                longitude: Float!
            }

            type User {
                location: Point
            }
        `);

        expect(() => validateDocument(doc)).toThrow(
            'Type "Point" already exists in the schema. It cannot also be defined in this type definition.'
        );
    });

    test("should throw an error if a user tries to pass in their own DateTime definition", () => {
        const doc = parse(`
            scalar DateTime

            type User {
                birthDateTime: DateTime
            }
        `);

        expect(() => validateDocument(doc)).toThrow(
            'Type "DateTime" already exists in the schema. It cannot also be defined in this type definition.'
        );
    });

    test("should throw an error if a user tries to pass in their own PointInput definition", () => {
        const doc = parse(`
            input PointInput {
                latitude: Float!
                longitude: Float!
            }

            type Query {
                pointQuery(point: PointInput!): String
            }
        `);

        expect(() => validateDocument(doc)).toThrow(
            'Type "PointInput" already exists in the schema. It cannot also be defined in this type definition.'
        );
    });

    test("should throw an error if an interface is incorrectly implemented", () => {
        const doc = parse(`
            interface UserInterface {
                age: Int!
            }

            type User implements UserInterface {
                name: String!
            }
        `);

        expect(() => validateDocument(doc)).toThrow(
            "Interface field UserInterface.age expected but User does not provide it."
        );
    });

    test("should throw an error a user tries to redefine one of our directives", () => {
        const doc = parse(`
            directive @relationship on FIELD_DEFINITION

            type Movie {
                title: String
            }
        `);

        expect(() => validateDocument(doc)).toThrow(
            'Directive "@relationship" already exists in the schema. It cannot be redefined.'
        );
    });

    test("should remove auth directive and pass validation", () => {
        const doc = parse(`
            type User @auth {
                name: String @auth
            }
        `);

        const res = validateDocument(doc);
        expect(res).toBeUndefined();
    });

    test("should not throw error on use of internal node input types", () => {
        const doc = parse(`
            type Mutation {
                login: String
                createPost(input: PostCreateInput!, options: PostOptions): Post!
                    @cypher(
                        statement: """
                        CREATE (post:Post)
                        SET
                          post = $input,
                          post.datetime = datetime(),
                          post.id = randomUUID()
                        RETURN post
                        """
                    )
            }

            type Post {
                id: ID! @id
                title: String!
                datetime: DateTime @readonly @timestamp(operations: [CREATE])
            }
        `);

        const res = validateDocument(doc);
        expect(res).toBeUndefined();
    });

    describe("relationshipProperties directive", () => {
        test("should not throw when used correctly on an interface", () => {
            const doc = parse(`
                interface ActedIn @relationshipProperties {
                    screenTime: Int!
                }

                type Actor {
                    name: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
                }

                type Movie {
                    title: String!
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                }
            `);

            const res = validateDocument(doc);
            expect(res).toBeUndefined();
        });

        test("should throw if used on an object type", () => {
            const doc = parse(`
                type ActedIn @relationshipProperties {
                    screenTime: Int!
                }
            `);

            expect(() => validateDocument(doc)).toThrow(
                'Directive "@relationshipProperties" may not be used on OBJECT.'
            );
        });

        test("should throw if used on a field", () => {
            const doc = parse(`
                type ActedIn {
                    screenTime: Int! @relationshipProperties
                }
            `);

            expect(() => validateDocument(doc)).toThrow(
                'Directive "@relationshipProperties" may not be used on FIELD_DEFINITION.'
            );
        });
    });

    test("should not throw error on use of internal input types within input types", () => {
        const doc = parse(`
            type Salary {
                salaryId: ID!
                amount: Float
                currency: String
                frequency: String
                eligibleForBonus: Boolean
                bonusPercentage: Float
                salaryReviewDate: DateTime
                pays_salary: EmploymentRecord @relationship(type: "PAYS_SALARY", direction: IN)
            }

            type EmploymentRecord {
                employmentRecordId: ID!
                pays_salary: [Salary] @relationship(type: "PAYS_SALARY", direction: OUT)
            }

            input EmpRecord {
                employmentRecordId: ID!
                salary: SalaryCreateInput
                startDate: Date
                endDate: Date
            }

            type Mutation {
                mergeSalaries(salaries: [SalaryCreateInput!]): [Salary]
                    @cypher(
                        statement: """
                        UNWIND $salaries as salary
                        MERGE (s:Salary {salaryId: salary.salaryId})
                        ON CREATE SET s.amount = salary.amount,
                                      s.currency = salary.currency,
                                      s.frequency = salary.frequency,
                                      s.eligibleForBonus = salary.eligibleForBonus,
                                      s.bonusPercentage = salary.bonusPercentage,
                                      s.salaryReviewDate = salary.salaryReviewDate
                        ON MATCH SET  s.amount = salary.amount,
                                      s.currency = salary.currency,
                                      s.frequency = salary.frequency,
                                      s.eligibleForBonus = salary.eligibleForBonus,
                                      s.bonusPercentage = salary.bonusPercentage,
                                      s.salaryReviewDate = salary.salaryReviewDate
                        RETURN s
                        """
                    )

                mergeEmploymentRecords(employmentRecords: [EmpRecord]): [EmploymentRecord]
                    @cypher(
                        statement: """
                        UNWIND $employmentRecords as employmentRecord
                        MERGE (er:EmploymentRecord {
                          employmentRecordId: employmentRecord.employmentRecordId
                        })
                        MERGE (s:Salary {salaryId: employmentRecord.salary.salaryId})
                        ON CREATE SET s.amount = employmentRecord.salary.amount,
                                      s.currency = employmentRecord.salary.currency,
                                      s.frequency = employmentRecord.salary.frequency,
                                      s.eligibleForBonus = employmentRecord.salary.eligibleForBonus,
                                      s.bonusPercentage = employmentRecord.salary.bonusPercentage,
                                      s.salaryReviewDate = employmentRecord.salary.salaryReviewDate
                        ON MATCH SET  s.amount = employmentRecord.salary.amount,
                                      s.currency = employmentRecord.salary.currency,
                                      s.frequency = employmentRecord.salary.frequency,
                                      s.eligibleForBonus = employmentRecord.salary.eligibleForBonus,
                                      s.bonusPercentage = employmentRecord.salary.bonusPercentage,
                                      s.salaryReviewDate = employmentRecord.salary.salaryReviewDate

                        MERGE (er)-[:PAYS_SALARY]->(s)
                        RETURN er
                        """
                    )
            }
        `);

        const res = validateDocument(doc);
        expect(res).toBeUndefined();
    });

    describe("Github Issue 158", () => {
        test("should not throw error on validation of schema", () => {
            const doc = parse(`
                type Test {
                    createdAt: DateTime
                }

              type Query {
                nodes: [Test] @cypher(statement: "")
              }
            `);

            const res = validateDocument(doc);
            expect(res).toBeUndefined();
        });
    });

    describe("https://github.com/neo4j/graphql/issues/442", () => {
        test("should not throw error on validation of schema if MutationResponse used", () => {
            const doc = parse(`
                type Post {
                    id: Int!
                    text: String!
                }

                type Mutation {
                    create_Post(text: String!): CreatePostsMutationResponse!
                }
            `);

            const res = validateDocument(doc);
            expect(res).toBeUndefined();
        });

        test("should not throw error on validation of schema if SortDirection used", () => {
            const doc = parse(`
                type Post {
                    id: Int!
                    text: String!
                }

                type Mutation {
                    create_Post(direction: SortDirection!): CreatePostsMutationResponse!
                }
            `);

            const res = validateDocument(doc);
            expect(res).toBeUndefined();
        });
    });

    describe("Issue https://codesandbox.io/s/github/johnymontana/training-v3/tree/master/modules/graphql-apis/supplemental/code/03-graphql-apis-custom-logic/end?file=/schema.graphql:64-86", () => {
        test("should not throw error on validation of schema", () => {
            const doc = parse(`
            type Order {
                orderID: ID! @id
                placedAt: DateTime @timestamp
                shipTo: Address @relationship(type: "SHIPS_TO", direction: OUT)
                customer: Customer @relationship(type: "PLACED", direction: IN)
                books: [Book] @relationship(type: "CONTAINS", direction: OUT)
              }

              extend type Order {
                subTotal: Float @cypher(statement:"MATCH (this)-[:CONTAINS]->(b:Book) RETURN sum(b.price)")
                shippingCost: Float @cypher(statement:"MATCH (this)-[:SHIPS_TO]->(a:Address) RETURN round(0.01 * distance(a.location, Point({latitude: 40.7128, longitude: -74.0060})) / 1000, 2)")
                estimatedDelivery: DateTime @ignore
              }

              type Customer {
                username: String
                orders: [Order] @relationship(type: "PLACED", direction: OUT)
                reviews: [Review] @relationship(type: "WROTE", direction: OUT)
                recommended(limit: Int = 3): [Book] @cypher(statement: "MATCH (this)-[:PLACED]->(:Order)-[:CONTAINS]->(:Book)<-[:CONTAINS]-(:Order)<-[:PLACED]-(c:Customer) MATCH (c)-[:PLACED]->(:Order)-[:CONTAINS]->(rec:Book) WHERE NOT EXISTS((this)-[:PLACED]->(:Order)-[:CONTAINS]->(rec)) RETURN rec LIMIT $limit")
              }

              type Address {
                address: String
                location: Point
                order: Order @relationship(type: "SHIPS_TO", direction: IN)
              }

              extend type Address {
                currentWeather: Weather @cypher(statement:"CALL apoc.load.json('https://www.7timer.info/bin/civil.php?lon=' + this.location.longitude + '&lat=' + this.location.latitude + '&ac=0&unit=metric&output=json&tzshift=0') YIELD value WITH value.dataseries[0] as weather RETURN {temperature: weather.temp2m, windSpeed: weather.wind10m.speed, windDirection: weather.wind10m.direction, precipitation: weather.prec_type, summary: weather.weather} AS conditions")
              }

              type Weather {
                temperature: Int
                windSpeed: Int
                windDirection: Int
                precipitation: String
                summary: String
              }

              type Book {
                isbn: ID!
                title: String
                price: Float
                description: String
                authors: [Author] @relationship(type: "AUTHOR_OF", direction: IN)
                subjects: [Subject] @relationship(type: "ABOUT", direction: OUT)
                reviews: [Review] @relationship(type: "REVIEWS", direction: IN)
              }

              extend type Book {
                similar: [Book] @cypher(statement: """
                MATCH (this)-[:ABOUT]->(s:Subject)
                WITH this, COLLECT(id(s)) AS s1
                MATCH (b:Book)-[:ABOUT]->(s:Subject) WHERE b <> this
                WITH this, b, s1, COLLECT(id(s)) AS s2
                WITH b, gds.alpha.similarity.jaccard(s2, s2) AS jaccard
                ORDER BY jaccard DESC
                RETURN b LIMIT 1
                """)
              }

              type Review {
                rating: Int
                text: String
                createdAt: DateTime @timestamp
                book: Book @relationship(type: "REVIEWS", direction: OUT)
                author: Customer @relationship(type: "WROTE", direction: IN)
              }

              type Author {
                name: String!
                books: [Book] @relationship(type: "AUTHOR_OF", direction: OUT)
              }

              type Subject {
                name: String!
                books: [Book] @relationship(type: "ABOUT", direction: IN)
              }

              type Mutation {
                mergeBookSubjects(subject: String!, bookTitles: [String!]!): Subject @cypher(statement: """
                MERGE (s:Subject {name: $subject})
                WITH s
                UNWIND $bookTitles AS bookTitle
                MATCH (t:Book {title: bookTitle})
                MERGE (t)-[:ABOUT]->(s)
                RETURN s
                """)
              }

              type Query {
                bookSearch(searchString: String!): [Book] @cypher(statement: """
                CALL db.index.fulltext.queryNodes('bookIndex', $searchString+'~')
                YIELD node RETURN node
                """)
              }
            `);

            const res = validateDocument(doc);
            expect(res).toBeUndefined();
        });
    });

    describe("Github Issue 213", () => {
        test("should not throw error on validation of schema", () => {
            const doc = parse(`
                  interface Vehicle {
                    id: ID!
                    color: String # NOTE: 'color' is optional on the interface
                  }

                  type Car implements Vehicle {
                    id: ID!
                    color: String! # NOTE: 'color' is mandatory on the type, which should be okay
                  }

                  type Query {
                    cars: [Vehicle!]!
                  }
            `);

            const res = validateDocument(doc);
            expect(res).toBeUndefined();
        });
    });

    describe("@alias directive", () => {
        test("should throw an error if missing an argument", () => {
            const doc = parse(`
                type User {
                    name: String @alias
                }
            `);
            expect(() => validateDocument(doc)).toThrow(
                'Directive "@alias" argument "property" of type "String!" is required, but it was not provided.'
            );
        });
        test("should throw an error if a directive is in the wrong location", () => {
            const doc = parse(`
                type User @alias {
                    name: String
                }
            `);
            expect(() => validateDocument(doc)).toThrow('Directive "@alias" may not be used on OBJECT.');
        });
        test("should not throw when used correctly", () => {
            const doc = parse(`
                type User {
                    name: String @alias(property: "dbName")
                }
            `);
            const res = validateDocument(doc);
            expect(res).toBeUndefined();
        });
    });

    describe("Reserved Names", () => {
        describe("Node", () => {
            test("should throw when using PageInfo as node name", () => {
                const doc = parse(`
                    type PageInfo {
                        id: ID
                    }
                `);

                expect(() => validateDocument(doc)).toThrow(
                    RESERVED_TYPE_NAMES.find((x) => x.regex.test("PageInfo"))?.error
                );
            });

            test("should throw when using Connection in a node name", () => {
                const doc = parse(`
                    type NodeConnection {
                        id: ID
                    }
                `);

                expect(() => validateDocument(doc)).toThrow(
                    RESERVED_TYPE_NAMES.find((x) => x.regex.test("NodeConnection"))?.error
                );
            });

            test("should throw when using Node as node name", () => {
                const doc = parse(`
                    type Node {
                        id: ID
                    }
                `);

                expect(() => validateDocument(doc)).toThrow(
                    RESERVED_TYPE_NAMES.find((x) => x.regex.test("Node"))?.error
                );
            });
        });

        describe("Interface", () => {
            test("should throw when using PageInfo as relationship properties interface name", () => {
                const doc = parse(`
                    type Movie {
                        id: ID
                        actors: [Actor] @relationship(type: "ACTED_IN", direction: OUT, properties: "PageInfo")
                    }

                    interface PageInfo {
                        screenTime: Int
                    }

                    type Actor {
                        name: String
                    }
                `);

                expect(() => validateDocument(doc)).toThrow(
                    RESERVED_TYPE_NAMES.find((x) => x.regex.test("PageInfo"))?.error
                );
            });

            test("should throw when using Connection in a properties interface name", () => {
                const doc = parse(`
                    type Movie {
                        id: ID
                        actors: [Actor] @relationship(type: "ACTED_IN", direction: OUT, properties: "NodeConnection")
                    }

                    interface NodeConnection {
                        screenTime: Int
                    }

                    type Actor {
                        name: String
                    }
                `);

                expect(() => validateDocument(doc)).toThrow(
                    RESERVED_TYPE_NAMES.find((x) => x.regex.test("NodeConnection"))?.error
                );
            });

            test("should throw when using Node as relationship properties interface name", () => {
                const doc = parse(`
                    type Movie {
                        id: ID
                        actors: [Actor] @relationship(type: "ACTED_IN", direction: OUT, properties: "Node")
                    }

                    interface Node {
                        screenTime: Int
                    }

                    type Actor {
                        name: String
                    }
                `);

                expect(() => validateDocument(doc)).toThrow(
                    RESERVED_TYPE_NAMES.find((x) => x.regex.test("Node"))?.error
                );
            });
        });
    });
});

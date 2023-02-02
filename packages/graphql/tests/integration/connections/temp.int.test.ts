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
 * Unless required exactly once by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { Driver, Session } from "neo4j-driver";
import type { GraphQLSchema } from "graphql";
import { graphql } from "graphql";
import { gql } from "apollo-server";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import type { UniqueType } from "../../utils/graphql-types";
import { generateUniqueType } from "../../utils/graphql-types";
import { cleanNodes } from "../../utils/clean-nodes";

describe.skip("Validate relationship count on connections from both sides", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let session: Session;
    let schema: GraphQLSchema;

    let typeMovie: UniqueType;
    let typePerson: UniqueType;

    const movieTitle = "The Matrix";
    const movieID = "0";
    const directorName = "Bob";

    beforeEach(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
        session = await neo4j.getSession();

        typeMovie = generateUniqueType("Movie");
        typePerson = generateUniqueType("Person");

        const typeDefs = gql`
            type ${typeMovie} {
                title: String!
                id: ID @unique
                director: ${typePerson}! @relationship(type: "DIRECTED", direction: IN)
            }
            
            type ${typePerson} {
                name: String!
                id: ID @unique
                movies: [${typeMovie}!]! @relationship(type: "DIRECTED",  direction: OUT)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });
        schema = await neoSchema.getSchema();
    });

    afterEach(async () => {
        await cleanNodes(session, [typeMovie, typePerson]);
        await session.close();
        await driver.close();
    });

    test("should return error on resulting movie connected to 2 directors [create - connect]", async () => {
        const query = `
          mutation($directorName: String!, $movieTitle: String!) {
            ${typePerson.operations.create}(input: [
                {
                  name: $directorName,
                  movies: {
                    connect: [
                      {
                        where: {
                          node: {
                            title: $movieTitle
                          }
                        }
                      }
                    ]
                  }
                }
              ]) {
                info {
                    nodesCreated
                }
            }
          }
        `;

        await session.run(
            `
                    CREATE (movie:${typeMovie} {title: $movieTitle})
                    CREATE (actor:${typePerson} {name: $directorName})
                    CREATE (actor)-[:DIRECTED]->(movie)
                `,
            {
                movieTitle,
                directorName,
            }
        );

        const result = await graphql({
            schema,
            source: query,
            variableValues: { directorName, movieTitle },
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(result.errors).toBeDefined();
        console.log("ERROR FOUND::", result.errors);
        expect((result?.errors as any[])[0].message).toBe(`${typeMovie}.director required exactly once`);
    });

    test("should return error on resulting movie connected to 2 directors [create - create - connect]", async () => {
        const query = `
          mutation($movieTitle: String!) {
            ${typeMovie.operations.create}(input: [
                {
                    title: "Avatar",
                    director: {
                      create: {
                        node: {
                          name: "Jim",
                          movies: {
                            connect: [
                              {
                                where: {
                                  node: {
                                    title: $movieTitle
                                  }
                                }
                              }
                            ]
                          }
                        }
                      }
                    }
                  }
              ]) {
                info {
                    nodesCreated
                }
            }
          }
        `;

        await session.run(
            `
                    CREATE (movie:${typeMovie} {title: $movieTitle})
                    CREATE (actor:${typePerson} {name: $directorName})
                    CREATE (actor)-[:DIRECTED]->(movie)
                `,
            {
                movieTitle,
                directorName,
            }
        );

        const result = await graphql({
            schema,
            source: query,
            variableValues: { movieTitle },
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(result.errors).toBeDefined();
        expect((result?.errors as any[])[0].message).toBe(`${typeMovie}.director required exactly once`);
    });

    test("should return error on resulting movie connected to 2 directors [create - connectOrCreate]", async () => {
        const query = `
          mutation($movieTitle: String!, $movieID: ID!) {
            ${typePerson.operations.create}(input: [
                {
                  name: "Jim",
                  movies: {
                    connectOrCreate: [
                      {
                        where: {
                          node: {
                            id: $movieID
                          }
                        },
                        onCreate: {
                          node: {
                            id: $movieID,
                            title: $movieTitle
                          }
                        }
                      }
                    ]
                  }
                }
              ]) {
                info {
                    nodesCreated
                }
            }
          }
        `;

        await session.run(
            `
                    CREATE (movie:${typeMovie} {title: $movieTitle, id: $movieID})
                    CREATE (actor:${typePerson} {name: $directorName})
                    CREATE (actor)-[:DIRECTED]->(movie)
                `,
            {
                movieTitle,
                directorName,
                movieID,
            }
        );

        const result = await graphql({
            schema,
            source: query,
            variableValues: { movieTitle, movieID },
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        console.log("Resu", result);
        expect(result.errors).toBeDefined();
        expect((result?.errors as any[])[0].message).toBe(`${typeMovie}.director required exactly once`);
    });

    test("should return error on resulting movie connected to 2 directors [update - connect]", async () => {
        const query = `
          mutation($movieTitle: String!) {
            ${typePerson.operations.create}(input: [
                {
                    name: "Jim",
                }
              ]) {
                info {
                    nodesCreated
                }
            }

            ${typePerson.operations.update}(  
              where: {
                name: "Jim"
              },
              connect: {
                movies: [
                  {
                    where: {
                      node: {
                        title: $movieTitle
                      }
                    }
                  }
                ]
              }) {
                info {
                    relationshipsCreated
                }
            }
          }
        `;

        await session.run(
            `
                    CREATE (movie:${typeMovie} {title: $movieTitle})
                    CREATE (actor:${typePerson} {name: $directorName})
                    CREATE (actor)-[:DIRECTED]->(movie)
                `,
            {
                movieTitle,
                directorName,
            }
        );

        const result = await graphql({
            schema,
            source: query,
            variableValues: { movieTitle },
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(result.errors).toBeDefined();
        expect((result?.errors as any[])[0].message).toBe(`${typeMovie}.director required exactly once`);
    });

    test("should return error on resulting movie connected to 2 directors [update - connectOrCreate]", async () => {
        const query = `
          mutation($movieTitle: String!, $movieID: ID!) {
            ${typePerson.operations.create}(input: [
                {
                    name: "Jim",
                }
              ]) {
                info {
                    nodesCreated
                }
            }

            ${typePerson.operations.update}(  
              where: {
                name: "Jim"
              },
              connectOrCreate: {
                movies: [
                  {
                    where: {
                      node: {
                        id: $movieID
                      }
                    },
                    onCreate: {
                      node: {
                        title: $movieTitle,
                        id: $movieID
                      }
                    }
                  }
                ]
              }) {
                info {
                    relationshipsCreated
                }
            }
          }
        `;

        await session.run(
            `
                    CREATE (movie:${typeMovie} {title: $movieTitle, id: $movieID})
                    CREATE (actor:${typePerson} {name: $directorName})
                    CREATE (actor)-[:DIRECTED]->(movie)
                `,
            {
                movieTitle,
                directorName,
                movieID,
            }
        );

        const result = await graphql({
            schema,
            source: query,
            variableValues: { movieTitle, movieID },
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(result.errors).toBeDefined();
        expect((result?.errors as any[])[0].message).toBe(`${typeMovie}.director required exactly once`);
    });

    test("should return error on resulting movie connected to 2 directors [update - connect - connect]", async () => {
        const query = `
          mutation($movieTitle: String!) {
            ${typePerson.operations.create}(input: [
                {
                    name: "Jim",
                }
              ]) {
                info {
                    nodesCreated
                }
            }

            ${typeMovie.operations.update}(  
              where: {
                title: "Avatar"
              },
              disconnect: {
                director: {
                  where: {
                    node: {
                      name: "John"
                    }
                  }
                }
              },
              connect: {
                director: {
                  where: {
                    node: {
                      name: "Jim"
                    }
                  },
                  connect: {
                    movies: [
                      {
                        where: {
                          node: {
                            title: $movieTitle
                          }
                        }
                      }
                    ]
                  }
                }
              }) {
                info {
                    relationshipsCreated
                }
            }
          }
        `;

        await session.run(
            `
                    CREATE (movie:${typeMovie} {title: $movieTitle})
                    CREATE (movie2:${typeMovie} {title: "Avatar"})
                    CREATE (actor:${typePerson} {name: $directorName})
                    CREATE (actor2:${typePerson} {name: "John"})
                    CREATE (actor)-[:DIRECTED]->(movie)
                    CREATE (actor2)-[:DIRECTED]->(movie2)
                `,
            {
                movieTitle,
                directorName,
            }
        );

        const result = await graphql({
            schema,
            source: query,
            variableValues: { movieTitle },
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(result.errors).toBeDefined();
        expect((result?.errors as any[])[0].message).toBe(`${typeMovie}.director required exactly once`);
    });

    test("should return error on resulting movie connected to 2 directors [update - update - connect]", async () => {
        const query = `
          mutation($movieTitle: String!) {
            ${typePerson.operations.create}(input: [
                {
                    name: "Jim",
                }
              ]) {
                info {
                    nodesCreated
                }
            }

            ${typePerson.operations.update}(  
              where: {
                name: "Jim"
              },
              update: {
                movies: [
                  {
                    connect: [
                      {
                        where: {
                          node: {
                            title: $movieTitle
                          }
                        }
                      }
                    ]
                  }
                ]
              }) {
                info {
                    relationshipsCreated
                }
            }
          }
        `;

        await session.run(
            `
                    CREATE (movie:${typeMovie} {title: $movieTitle})
                    CREATE (actor:${typePerson} {name: $directorName})
                    CREATE (actor)-[:DIRECTED]->(movie)
                `,
            {
                movieTitle,
                directorName,
            }
        );

        const result = await graphql({
            schema,
            source: query,
            variableValues: { movieTitle },
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(result.errors).toBeDefined();
        expect((result?.errors as any[])[0].message).toBe(`${typeMovie}.director required exactly once`);
    });

    test("should return error on resulting movie connected to 2 directors [update - update - connectOrCreate]", async () => {
        const query = `
          mutation($movieTitle: String!, $movieID: ID!) {
            ${typePerson.operations.create}(input: [
                {
                    name: "Jim",
                }
              ]) {
                info {
                    nodesCreated
                }
            }

            ${typePerson.operations.update}(  
              where: {
                name: "Jim"
              },
              update: {
                movies: [
                  {
                    connectOrCreate: [
                      {
                        where: {
                          node: {
                            id: $movieID
                          }
                        },
                        onCreate: {
                          node: {
                            title: $movieTitle,
                            id: $movieID
                          }
                        }
                      }
                    ]
                  }
                ]
              }) {
                info {
                    relationshipsCreated
                }
            }
          }
        `;

        await session.run(
            `
                    CREATE (movie:${typeMovie} {title: $movieTitle, id: $movieID})
                    CREATE (actor:${typePerson} {name: $directorName})
                    CREATE (actor)-[:DIRECTED]->(movie)
                `,
            {
                movieTitle,
                directorName,
                movieID,
            }
        );

        const result = await graphql({
            schema,
            source: query,
            variableValues: { movieTitle, movieID },
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(result.errors).toBeDefined();
        expect((result?.errors as any[])[0].message).toBe(`${typeMovie}.director required exactly once`);
    });

    // TODO: java.lang exception
    test.skip("should return error bc cannot have more than one node linked [update - create]", async () => {
        const query = `
          mutation($movieTitle: String!) {
            ${typeMovie.operations.update}(  
              where: {
                title: $movieTitle
              },
              create: {
                director: {
                  node: {
                    name: "Jim"
                  }
                }
              }) {
                info {
                    relationshipsCreated
                }
            }
          }
        `;

        await session.run(
            `
                    CREATE (movie:${typeMovie} {title: $movieTitle})
                    CREATE (actor:${typePerson} {name: $directorName})
                    CREATE (actor)-[:DIRECTED]->(movie)
                `,
            {
                movieTitle,
                directorName,
            }
        );

        const result = await graphql({
            schema,
            source: query,
            variableValues: { movieTitle },
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        // console.log(result.errors);
        expect(result.errors).toBeDefined();
        // Failed to invoke procedure `apoc.util.validate`: Caused by: java.lang.RuntimeException: Relationship field \"Movie.director\" cannot have more than one node linked
        expect((result?.errors as any[])[0].message).toBe(`${typeMovie}.director required exactly once`);
    });

    test("should return error on resulting movie connected to 2 directors [update - create - connect]", async () => {
        const query = `
          mutation($directorName: String!, $movieTitle: String!) {
            ${typePerson.operations.update}(  
              where: {
                name: $directorName
              },
              create: {
                movies: [
                  {
                    node: {
                      title: "Avatar",
                      director: {
                        create: {
                          node: {
                            name: "Jim",
                            movies: {
                              connect: [
                                {
                                  where: {
                                    node: {
                                      title: $movieTitle
                                    }
                                  }
                                }
                              ]
                            }
                          }
                        }
                      }
                    }
                  }
                ]
              }) {
                info {
                    relationshipsCreated
                }
            }
          }
        `;

        await session.run(
            `
                    CREATE (movie:${typeMovie} {title: $movieTitle})
                    CREATE (director:${typePerson} {name: $directorName})
                    CREATE (director)-[:DIRECTED]->(movie)
                `,
            {
                movieTitle,
                directorName,
            }
        );

        const result = await graphql({
            schema,
            source: query,
            variableValues: { directorName, movieTitle },
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(result.errors).toBeDefined();
        expect((result?.errors as any[])[0].message).toBe(`${typeMovie}.director required exactly once`);
    });

    test("should return error on resulting movie connected to 2 directors [update - create - connectOrCreate]", async () => {
        const query = `
          mutation($movieTitle: String!, $movieID: ID!) {
            ${typeMovie.operations.update}(  
              where: {
                title: "Avatar"
              },
              disconnect: {
                director: {
                  where: {
                    node: {
                      name: "John"
                    }
                  }
                }
              },
              create: {
                director: {
                  node: {
                    name: "Jim",
                    movies: {
                      connectOrCreate: [
                        {
                          where: {
                            node: {
                              id: $movieID
                            }
                          },
                          onCreate: {
                            node: {
                              title: $movieTitle,
                              id: $movieID
                            }
                          }
                        }
                      ]
                    }
                  }
                }
              }) {
                info {
                    relationshipsCreated
                }
            }
          }
        `;

        await session.run(
            `
                    CREATE (movie:${typeMovie} {title: $movieTitle, id: $movieID})
                    CREATE (movie2:${typeMovie} {title: "Avatar", id: 1})
                    CREATE (actor:${typePerson} {name: $directorName})
                    CREATE (actor2:${typePerson} {name: "John"})
                    CREATE (actor)-[:DIRECTED]->(movie)
                    CREATE (actor2)-[:DIRECTED]->(movie2)
                `,
            {
                movieTitle,
                directorName,
                movieID,
            }
        );

        const result = await graphql({
            schema,
            source: query,
            variableValues: { movieTitle, movieID },
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(result.errors).toBeDefined();
        expect((result?.errors as any[])[0].message).toBe(`${typeMovie}.director required exactly once`);
    });

    test("should return error on resulting movie left w/o connections [update - disconnect]", async () => {
        const query = `
          mutation($directorName: String!, $movieTitle: String!) {
            ${typePerson.operations.update}(  
              where: {
                name: $directorName
              },
              disconnect: {
                movies: [
                  {
                    where: {
                      node: {
                        title: $movieTitle
                      }
                    }
                  }
                ]
              }) {
                info {
                    relationshipsCreated
                }
            }
          }
        `;

        await session.run(
            `
                    CREATE (movie:${typeMovie} {title: $movieTitle})
                    CREATE (actor:${typePerson} {name: $directorName})
                    CREATE (actor)-[:DIRECTED]->(movie)
                `,
            {
                movieTitle,
                directorName,
            }
        );

        const result = await graphql({
            schema,
            source: query,
            variableValues: { directorName, movieTitle },
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(result.errors).toBeDefined();
        expect((result?.errors as any[])[0].message).toBe(`${typeMovie}.director required exactly once`);
    });

    test("[inverse] should return error on resulting movie left w/o connections [update - disconnect]", async () => {
        const query = `
        mutation($directorName: String!, $movieTitle: String!) {
          ${typeMovie.operations.update}(  
            where: {
              title: $movieTitle
            },
            disconnect: {
              director: 
                {
                  where: {
                    node: {
                      name: $directorName
                    }
                  }
                }
              
            }) {
              info {
                  relationshipsCreated
              }
          }
        }
      `;

        await session.run(
            `
                  CREATE (movie:${typeMovie} {title: $movieTitle})
                  CREATE (actor:${typePerson} {name: $directorName})
                  CREATE (actor)-[:DIRECTED]->(movie)
              `,
            {
                movieTitle,
                directorName,
            }
        );

        const result = await graphql({
            schema,
            source: query,
            variableValues: { directorName, movieTitle },
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(result.errors).toBeDefined();
        expect((result?.errors as any[])[0].message).toBe(`${typeMovie}.director required exactly once`);
    });

    test("should return error on resulting movie left w/o connections [update - update - disconnect]", async () => {
        const otherMovieTitle = "Avatar";
        const query = `
          mutation($directorName: String!, $movieTitle: String!, $otherMovieTitle: String!) {
            ${typeMovie.operations.update}(  
              where: {
                title: $otherMovieTitle
              },
              update: {
                director: {
                  where: {
                    node: {
                      name: $directorName
                    }
                  },
                  update: {
                    node: {
                      movies: [
                        {
                          disconnect: [
                            {
                              where: {
                                node: {
                                  title: $movieTitle
                                }
                              }
                            }
                          ]
                        }
                      ]
                    }
                  }
                }
              }) {
                info {
                    relationshipsCreated
                }
            }
          }
        `;

        await session.run(
            `
                    CREATE (movie:${typeMovie} {title: $movieTitle})
                    CREATE (movie2:${typeMovie} {title: $otherMovieTitle})
                    CREATE (actor:${typePerson} {name: $directorName})
                    CREATE (actor)-[:DIRECTED]->(movie)
                    CREATE (actor)-[:DIRECTED]->(movie2)
                `,
            {
                movieTitle,
                otherMovieTitle,
                directorName,
            }
        );

        const result = await graphql({
            schema,
            source: query,
            variableValues: { directorName, movieTitle, otherMovieTitle },
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(result.errors).toBeDefined();
        expect((result?.errors as any[])[0].message).toBe(`${typeMovie}.director required exactly once`);
    });

    // TODO: impl for delete
    test.skip("should return error on resulting movie left w/o connections [delete]", async () => {
        const otherMovieTitle = "Avatar";
        const query = `
          mutation($directorName: String!) {
            ${typePerson.operations.delete}(where: {
                name: $directorName
            }) {
                nodesDeleted
            }
          }
        `;

        await session.run(
            `
            CREATE (movie:${typeMovie} {title: $movieTitle})
            CREATE (movie2:${typeMovie} {title: $otherMovieTitle})
            CREATE (actor:${typePerson} {name: $directorName})
            CREATE (actor)-[:DIRECTED]->(movie)
            CREATE (actor)-[:DIRECTED]->(movie2)
        `,
            {
                movieTitle,
                otherMovieTitle,
                directorName,
            }
        );

        const result = await graphql({
            schema,
            source: query,
            variableValues: { directorName },
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(result.errors).toBeDefined();
        expect((result?.errors as any[])[0].message).toBe(`${typeMovie}.director required exactly once`);
    });

    describe("Multiple relationship fields", () => {
        let typeUser: UniqueType;
        let typePost: UniqueType;
        let typePage: UniqueType;

        const pageID = "p1";
        const otherPageID = "p2";
        const userID = "u1";
        const otherUserID = "u2";
        const postID = "post";

        beforeEach(async () => {
            typeUser = generateUniqueType("User");
            typePost = generateUniqueType("Post");
            typePage = generateUniqueType("Page");

            const typeDefs = gql`
              type ${typeUser} {
                  id: ID @unique
                  posts: [${typePost}!]! @relationship(type: "HAS_POST", direction: IN)
              }

              type ${typePost} {
                  id: ID @unique
                  creator: ${typeUser}! @relationship(type: "HAS_POST", direction: IN)
                  blog: ${typePage}! @relationship(type: "IN_PAGE", direction: OUT)
              }

              type ${typePage} {
                  id: ID @unique
                  owner: ${typeUser}! @relationship(type: "OWNS", direction: IN)
              }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            schema = await neoSchema.getSchema();
        });

        test("should not return error when providing two connections in the same operation [create - connectOrCreate]", async () => {
            const query = `
        mutation($pageID: ID!, $userID: ID!) {
          ${typePost.operations.create}(input: [
            {
              creator: {
                connectOrCreate: {
                  where: {
                    node: {
                      id: $userID
                    }
                  },
                  onCreate: {
                    node: {
                      id: $userID
                    }
                  }
                }
              },
              blog: {
                connectOrCreate: {
                  where: {
                    node: {
                      id: $pageID
                    }
                  },
                  onCreate: {
                    node: {
                      id: $pageID
                    }
                  }
                }
              }
            }
          ]) {
              info {
                  nodesCreated
              }
          }
        }
      `;

            await session.run(
                `
                  CREATE (page:${typePage} {id: $pageID})
                  CREATE (usr:${typeUser} {id: $userID})
                  CREATE (usr)-[:OWNS]->(page)
              `,
                {
                    userID,
                    pageID,
                }
            );

            const result = await graphql({
                schema,
                source: query,
                variableValues: { pageID, userID },
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(result.errors).toBeUndefined();
        });

        test("should not return error on valid connect, disconnect combination on same field [update - connect + disconnect]", async () => {
            const query = `
              mutation($pageID: ID!, $postID: ID!, $otherPageID: ID!) {
                ${typePost.operations.update}(where: {
                  id: $postID
                },
                disconnect: {
                  blog: {
                    where: {
                      node: {
                        id: $pageID
                      }
                    }
                  }
                },
                connect: {
                  blog: {
                    where: {
                      node: {
                        id: $otherPageID
                      }
                    },
                    overwrite: false
                  }
                }) {
                    info {
                        nodesCreated
                    }
                }
              }
            `;

            await session.run(
                `
                CREATE (page:${typePage} {id: $pageID})
                CREATE (usr:${typeUser} {id: $userID})
                CREATE (usr)-[:OWNS]->(page)
                CREATE (post:${typePost} {id: $postID})
                CREATE (usr)-[:HAS_POST]->(post)
                CREATE (page)<-[:IN_PAGE]-(post)
                CREATE (page2:${typePage} {id: $otherPageID})
                CREATE (usr)-[:OWNS]->(page2)
            `,
                {
                    userID,
                    pageID,
                    postID,
                    otherPageID,
                }
            );

            const result = await graphql({
                schema,
                source: query,
                variableValues: { pageID, postID, otherPageID },
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(result.errors).toBeUndefined();
        });

        test("should not return error on valid connect, disconnect combination on same field [update - connectOrCreate + disconnect]", async () => {
            const query = `
            mutation($pageID: ID!, $postID: ID!, $otherPageID: ID!) {
              ${typePost.operations.update}(where: {
                id: $postID
              },
              disconnect: {
                blog: {
                  where: {
                    node: {
                      id: $pageID
                    }
                  }
                }
              },
              connectOrCreate: {
                blog: {
                  where: {
                    node: {
                      id: $otherPageID
                    }
                  },
                  onCreate: {
                    node: {
                      id: $otherPageID
                    }
                  }
                }
              }) {
                  info {
                      nodesCreated
                  }
              }
            }
          `;

            await session.run(
                `
              CREATE (page:${typePage} {id: $pageID})
              CREATE (usr:${typeUser} {id: $userID})
              CREATE (usr)-[:OWNS]->(page)
              CREATE (post:${typePost} {id: $postID})
              CREATE (usr)-[:HAS_POST]->(post)
              CREATE (page)<-[:IN_PAGE]-(post)
              CREATE (page2:${typePage} {id: $otherPageID})
              CREATE (usr)-[:OWNS]->(page2)
          `,
                {
                    userID,
                    pageID,
                    postID,
                    otherPageID,
                }
            );

            const result = await graphql({
                schema,
                source: query,
                variableValues: { pageID, postID, otherPageID },
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(result.errors).toBeUndefined();
        });

        test("should not return error on valid connect, disconnect combination on same field [update - create + disconnect]", async () => {
            const query = `
            mutation($pageID: ID!, $postID: ID!, $userID: ID!) {
              ${typePost.operations.update}(where: {
                id: $postID
              },
              disconnect: {
                blog: {
                  where: {
                    node: {
                      id: $pageID
                    }
                  }
                }
              },
              create: {
                blog: {
                    node: {
                      id: $pageID,
                      owner: {
                        connect: {
                          where: {
                            node: {
                              id: $userID
                            }
                          }
                        }
                      }
                    }
                  }
              }) {
                  info {
                      nodesCreated
                  }
              }
            }
          `;

            await session.run(
                `
              CREATE (page:${typePage} {id: $pageID})
              CREATE (usr:${typeUser} {id: $userID})
              CREATE (usr)-[:OWNS]->(page)
              CREATE (post:${typePost} {id: $postID})
              CREATE (usr)-[:HAS_POST]->(post)
              CREATE (page)<-[:IN_PAGE]-(post)
          `,
                {
                    userID,
                    pageID,
                    postID,
                }
            );

            const result = await graphql({
                schema,
                source: query,
                variableValues: { pageID, postID, userID },
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(result.errors).toBeUndefined();
        });

        test("should not return error on valid connect, disconnect combination on same field [update - update - connect + disconnect]", async () => {
            const query = `
            mutation($pageID: ID!, $postID: ID!) {
              ${typePost.operations.update}(where: {
                id: $postID
              },
              update: {
                blog: {
                  connect: {
                    overwrite: false,
                    where: {
                      node: {
                        id: $pageID
                      }
                    }
                  },
                  disconnect: {
                    where: {
                      node: {
                        id: $pageID
                      }
                    }
                  }
                }
              }) {
                  info {
                      nodesCreated
                  }
              }
            }
          `;

            await session.run(
                `
              CREATE (page:${typePage} {id: $pageID})
              CREATE (usr:${typeUser} {id: $userID})
              CREATE (usr)-[:OWNS]->(page)
              CREATE (post:${typePost} {id: $postID})
              CREATE (usr)-[:HAS_POST]->(post)
              CREATE (page)<-[:IN_PAGE]-(post)
              CREATE (page2:${typePage} {id: $otherPageID})
              CREATE (usr)-[:OWNS]->(page2)
          `,
                {
                    userID,
                    pageID,
                    postID,
                    otherPageID,
                }
            );

            const result = await graphql({
                schema,
                source: query,
                variableValues: { pageID, postID },
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(result.errors).toBeUndefined();
        });

        test("should not return error on valid connect, disconnect combination on same field [update - update - create + disconnect]", async () => {
            const query = `
          mutation($pageID: ID!, $postID: ID!, $userID: ID!) {
            ${typePost.operations.update}(where: {
              id: $postID
            },
            update: {
              blog: {
                create: {
                  node: {
                    id: $pageID,
                    owner: {
                      connect: {
                        where: {
                          node: {
                            id: $userID
                          }
                        }
                      }
                    }
                  }
                },
                disconnect: {
                  where: {
                    node: {
                      id: $pageID
                    }
                  }
                }
              }
            }) {
                info {
                    nodesCreated
                }
            }
          }
        `;

            await session.run(
                `
            CREATE (page:${typePage} {id: $pageID})
            CREATE (usr:${typeUser} {id: $userID})
            CREATE (usr)-[:OWNS]->(page)
            CREATE (post:${typePost} {id: $postID})
            CREATE (usr)-[:HAS_POST]->(post)
            CREATE (page)<-[:IN_PAGE]-(post)
        `,
                {
                    userID,
                    pageID,
                    postID,
                }
            );

            const result = await graphql({
                schema,
                source: query,
                variableValues: { pageID, postID, userID },
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(result.errors).toBeUndefined();
        });

        test("should not return error on valid connect, disconnect combination on multiple fields [update - update - connect + disconnect]", async () => {
            const query = `
            mutation($pageID: ID!, $postID: ID!, $userID: ID!) {
              ${typePost.operations.update}(where: {
                id: $postID
              },
              update: {
                blog: {
                  connect: {
                    overwrite: false,
                    where: {
                      node: {
                        id: $pageID
                      }
                    }
                  },
                  disconnect: {
                    where: {
                      node: {
                        id: $pageID
                      }
                    }
                  }
                },
                creator: {
                  connect: {
                    overwrite: false,
                    where: {
                      node: {
                        id: $userID
                      }
                    }
                  },
                  disconnect: {
                    where: {
                      node: {
                        id: $userID
                      }
                    }
                  }
                }
              }) {
                  info {
                      nodesCreated
                  }
              }
            }
          `;

            await session.run(
                `
              CREATE (page:${typePage} {id: $pageID})
              CREATE (usr:${typeUser} {id: $userID})
              CREATE (usr)-[:OWNS]->(page)
              CREATE (post:${typePost} {id: $postID})
              CREATE (usr)-[:HAS_POST]->(post)
              CREATE (page)<-[:IN_PAGE]-(post)
              CREATE (page2:${typePage} {id: $otherPageID})
              CREATE (usr)-[:OWNS]->(page2)
          `,
                {
                    userID,
                    pageID,
                    postID,
                    otherPageID,
                }
            );

            const result = await graphql({
                schema,
                source: query,
                variableValues: { pageID, postID, userID },
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(result.errors).toBeUndefined();
        });

        test.skip("should not return error on valid connect, disconnect combination [update - nested (connect + disconnect)]", async () => {
            const query = `
            mutation($pageID: ID!, $postID: ID!, $userID: ID!, $otherUserID: ID!) {
              ${typePost.operations.update}(where: {
                id: $postID
              },
              disconnect: {
                creator: {
                  where: {
                    node: {
                      id: $userID
                    }
                  }
                },
                blog: {
                  disconnect: {
                    owner: {
                      where: {
                        node: {
                          id: $otherUserID
                        }
                      }
                    }
                  }
                }
              },
              connect: {
                blog: {
                  where: {
                    node: {
                      id: $pageID
                    }
                  },
                  overwrite: true,
                  connect: {
                    owner: {
                      where: {
                        node: {
                          id: $userID
                        }
                      },
                      overwrite: false
                    }
                  }
                },
                creator: {
                  where: {
                    node: {
                      id: $otherUserID
                    }
                  },
                  overwrite: false,
                }
              }) {
                  info {
                      nodesCreated
                  }
              }
            }
          `;

            await session.run(
                `
              CREATE (page1:${typePage} {id: $pageID})
              CREATE (page2:${typePage} {id: $otherPageID})
              CREATE (usr1:${typeUser} {id: $userID})
              CREATE (usr2:${typeUser} {id: $otherUserID})
              CREATE (usr1)-[:OWNS]->(page2)
              CREATE (usr2)-[:OWNS]->(page1)
              CREATE (post:${typePost} {id: $postID})
              CREATE (usr1)-[:HAS_POST]->(post)
              CREATE (page1)<-[:IN_PAGE]-(post)
          `,
                {
                    userID,
                    pageID,
                    postID,
                    otherPageID,
                    otherUserID,
                }
            );

            const result = await graphql({
                schema,
                source: query,
                variableValues: { pageID, postID, userID, otherUserID },
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(result.errors).toBeUndefined();
        });

        test.only("2should not return error on valid connect, disconnect combination [update - nested (connect + disconnect)]", async () => {
            const query = `
          mutation($pageID: ID!, $postID: ID!, $userID: ID!, $otherUserID: ID!) {
            ${typePost.operations.update}(where: {
              id: $postID
            },
            disconnect: {
              creator: {
                where: {
                  node: {
                    id: $userID
                  }
                }
              },
              blog: {
                disconnect: {
                  owner: {
                    where: {
                      node: {
                        id: $otherUserID
                      }
                    }
                  }
                }
              }
            },
            connect: {
              blog: {
                where: {
                  node: {
                    id: $pageID
                  }
                },
                overwrite: true,
                connect: {
                  owner: {
                    where: {
                      node: {
                        id: $userID
                      }
                    },
                    #overwrite: false
                  }
                }
              },
              creator: {
                where: {
                  node: {
                    id: $otherUserID
                  }
                },
                #overwrite: false,
              }
            }) {
                info {
                    nodesCreated
                }
            }
          }
        `;

            await session.run(
                `
            CREATE (page1:${typePage} {id: $pageID})
            CREATE (page2:${typePage} {id: $otherPageID})
            CREATE (usr1:${typeUser} {id: $userID})
            CREATE (usr2:${typeUser} {id: $otherUserID})
            CREATE (usr1)-[:OWNS]->(page2)
            CREATE (usr2)-[:OWNS]->(page1)
            CREATE (post:${typePost} {id: $postID})
            CREATE (usr1)-[:HAS_POST]->(post)
            CREATE (page1)<-[:IN_PAGE]-(post)
        `,
                {
                    userID,
                    pageID,
                    postID,
                    otherPageID,
                    otherUserID,
                }
            );

            const result = await graphql({
                schema,
                source: query,
                variableValues: { pageID, postID, userID, otherUserID },
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(result.errors).toBeUndefined();
        });

        test.skip("should not return error on valid connect, disconnect combination [update - update - nested (connect + disconnect)]", async () => {
            const query = `
          mutation($pageID: ID!, $postID: ID!, $userID: ID!, $otherUserID: ID!) {
            ${typePost.operations.update}(where: {
              id: $postID
            },
            update: {
              blog: {
                connect: {
                  where: {
                    node: {
                      id: $pageID
                    }
                  },
                  overwrite: true,
                  connect: {
                    owner: {
                      where: {
                        node: {
                          id: $userID
                        }
                      },
                      overwrite: false
                    }
                  }
                },
                disconnect: {
                    disconnect: {
                      owner: {
                        where: {
                          node: {
                            OR: [{
                              id: $userID
                            }, {
                              id: $otherUserID
                            }]
                          }
                        }
                      }
                    }
                }
              },
              creator: {
                connect: {
                  where: {
                    node: {
                      id: $otherUserID
                    }
                  },
                  overwrite: false,
                },
                disconnect: {
                  where: {
                    node: {
                      id: $userID
                    }
                  }
                }
              }
            }) {
                info {
                    nodesCreated
                }
            }
          }
        `;

            await session.run(
                `
            CREATE (page1:${typePage} {id: $pageID})
            CREATE (page2:${typePage} {id: $otherPageID})
            CREATE (usr1:${typeUser} {id: $userID})
            CREATE (usr2:${typeUser} {id: $otherUserID})
            CREATE (usr1)-[:OWNS]->(page2)
            CREATE (usr2)-[:OWNS]->(page1)
            CREATE (post:${typePost} {id: $postID})
            CREATE (usr1)-[:HAS_POST]->(post)
            CREATE (page1)<-[:IN_PAGE]-(post)
        `,
                {
                    userID,
                    pageID,
                    postID,
                    otherPageID,
                    otherUserID,
                }
            );

            const result = await graphql({
                schema,
                source: query,
                variableValues: { pageID, postID, userID, otherUserID },
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(result.errors).toBeUndefined();
        });
    });

    describe("Interfaces 1:1", () => {
        let typeSeries: UniqueType;

        beforeEach(async () => {
            typeMovie = generateUniqueType("Movie");
            typePerson = generateUniqueType("Person");
            typeSeries = generateUniqueType("Series");

            const typeDefs = gql`
            type ${typeMovie} implements Production {
                title: String!
                id: ID @unique
                director: Creature!
            }

            type ${typeSeries} implements Production {
              title: String!
              episode: Int!
              id: ID @unique
              director: Creature!
          }

            interface Production {
              title: String!
              director: Creature! @relationship(type: "DIRECTED", direction: IN)
            }
            
            type ${typePerson} implements Creature {
                name: String!
                id: ID @unique
                movies: Production! 
            }

            interface Creature {
              name: String!
              movies: Production! @relationship(type: "DIRECTED",  direction: OUT)
            }
        `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            schema = await neoSchema.getSchema();
        });

        test("should return error on resulting movie connected to 2 directors [create - connect]", async () => {
            const query = `
        mutation($directorName: String!, $movieTitle: String!) {
          ${typePerson.operations.create}(input: [
              {
                name: $directorName,
                movies: {
                  connect: 
                    {
                      where: {
                        node: {
                          title: $movieTitle
                        }
                      }
                    }
                  
                }
              }
            ]) {
              info {
                  nodesCreated
              }
          }
        }
      `;

            await session.run(
                `
                  CREATE (movie:${typeMovie} {title: $movieTitle})
                  CREATE (actor:${typePerson} {name: $directorName})
                  CREATE (actor)-[:DIRECTED]->(movie)
              `,
                {
                    movieTitle,
                    directorName,
                }
            );

            const result = await graphql({
                schema,
                source: query,
                variableValues: { directorName, movieTitle },
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(result.errors).toBeDefined();
            console.log("ERROR FOUND::", result.errors);
            expect((result?.errors as any[])[0].message).toBe(`${typeMovie}.director required exactly once`);
        });

        test("should return error on resulting movie connected to 2 directors [create - create - connect]", async () => {
            const query = `
            mutation($movieTitle: String!) {
              ${typeMovie.operations.create}(input: [
                  {
                      title: "Avatar",
                      director: {
                        create: {
                          node: {
                            ${typePerson.name}: {
                              name: "Jim",
                              movies: {
                                connect: 
                                  {
                                    where: {
                                      node: {
                                        title: $movieTitle
                                      }
                                    }
                                  }
                               }
                            }
                          }
                        }
                      }
                    }
                ]) {
                  info {
                      nodesCreated
                  }
              }
            }
          `;

            await session.run(
                `
                      CREATE (movie:${typeMovie} {title: $movieTitle})
                      CREATE (actor:${typePerson} {name: $directorName})
                      CREATE (actor)-[:DIRECTED]->(movie)
                  `,
                {
                    movieTitle,
                    directorName,
                }
            );

            const result = await graphql({
                schema,
                source: query,
                variableValues: { movieTitle },
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(result.errors).toBeDefined();
            expect((result?.errors as any[])[0].message).toBe(`${typeMovie}.director required exactly once`);
        });

        // where + _on
        test("should return error on resulting person connected to 2 productions [create - create - connect]", async () => {
            const query = `
          mutation($movieTitle: String!) {
            ${typeMovie.operations.create}(input: [
                {
                    title: "Avatar",
                    director: {
                      create: {
                        node: {
                          ${typePerson.name}: {
                            name: "Jim",
                            movies: {
                              connect: 
                                {
                                  where: {
                                    node: {
                                      _on: {
                                        ${typeMovie.name}: {
                                          title: $movieTitle
                                        },
                                        ${typeSeries.name}: {
                                          episode: 1
                                        }
                                      }
                                    }
                                  }
                                }
                             }
                          }
                        }
                      }
                    }
                  }
              ]) {
                info {
                    nodesCreated
                }
            }
          }
        `;

            await session.run(
                `
                    CREATE (series:${typeSeries} {title: "some series", episode: 1})
                    CREATE (:${typeMovie} {title: $movieTitle})
                    CREATE (actor:${typePerson} {name: $directorName})
                    CREATE (actor)-[:DIRECTED]->(series)
                `,
                {
                    movieTitle,
                    directorName,
                }
            );

            const result = await graphql({
                schema,
                source: query,
                variableValues: { movieTitle },
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(result.errors).toBeDefined();
            expect((result?.errors as any[])[0].message).toBe(`${typeMovie}.director required exactly once`);
        });

        test("should return error on resulting movie connected to 2 directors [update - connect]", async () => {
            const query = `
            mutation($movieTitle: String!) {
              ${typePerson.operations.create}(input: [
                  {
                      name: "Jim",
                  }
                ]) {
                  info {
                      nodesCreated
                  }
              }
  
              ${typePerson.operations.update}(  
                where: {
                  name: "Jim"
                },
                connect: {
                  movies: 
                    {
                      where: {
                        node: {
                          title: $movieTitle
                        }
                      }
                    }
                  
                }) {
                  info {
                      relationshipsCreated
                  }
              }
            }
          `;

            await session.run(
                `
                      CREATE (movie:${typeMovie} {title: $movieTitle})
                      CREATE (actor:${typePerson} {name: $directorName})
                      CREATE (actor)-[:DIRECTED]->(movie)
                  `,
                {
                    movieTitle,
                    directorName,
                }
            );

            const result = await graphql({
                schema,
                source: query,
                variableValues: { movieTitle },
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(result.errors).toBeDefined();
            expect((result?.errors as any[])[0].message).toBe(`${typeMovie}.director required exactly once`);
        });

        // TODO: java.lang exception
        test.skip("should return error on resulting movie connected to 2 directors [update - connect - connect]", async () => {
            const query = `
            mutation($movieTitle: String!) {
              ${typePerson.operations.create}(input: [
                  {
                      name: "Jim",
                  }
                ]) {
                  info {
                      nodesCreated
                  }
              }
  
              ${typeMovie.operations.update}(  
                where: {
                  title: "Avatar"
                },
                disconnect: {
                  director: {
                    where: {
                      node: {
                        name: "John"
                      }
                    }
                  }
                },
                connect: {
                  director: {
                    where: {
                      node: {
                        name: "Jim"
                      }
                    },
                    connect: {
                      movies: 
                        {
                          where: {
                            node: {
                              title: $movieTitle
                            }
                          }
                        }
                      
                    }
                  }
                }) {
                  info {
                      relationshipsCreated
                  }
              }
            }
          `;

            await session.run(
                `
                      CREATE (movie:${typeMovie} {title: $movieTitle})
                      CREATE (movie2:${typeMovie} {title: "Avatar"})
                      CREATE (actor:${typePerson} {name: $directorName})
                      CREATE (actor2:${typePerson} {name: "John"})
                      CREATE (actor)-[:DIRECTED]->(movie)
                      CREATE (actor2)-[:DIRECTED]->(movie2)
                  `,
                {
                    movieTitle,
                    directorName,
                }
            );

            const result = await graphql({
                schema,
                source: query,
                variableValues: { movieTitle },
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(result.errors).toBeDefined();
            expect((result?.errors as any[])[0].message).toBe(`${typeMovie}.director required exactly once`);
        });

        test("should return error on resulting movie connected to 2 directors [update - update - connect]", async () => {
            const query = `
            mutation($movieTitle: String!) {
              ${typePerson.operations.create}(input: [
                  {
                      name: "Jim",
                  }
                ]) {
                  info {
                      nodesCreated
                  }
              }
  
              ${typePerson.operations.update}(  
                where: {
                  name: "Jim"
                },
                update: {
                  movies: {
                    connect: {
                      where: {
                        node: {
                          title: $movieTitle
                        }
                      }
                    }
                  }
                  
                }) {
                  info {
                      relationshipsCreated
                  }
              }
            }
          `;

            await session.run(
                `
                      CREATE (movie:${typeMovie} {title: $movieTitle})
                      CREATE (actor:${typePerson} {name: $directorName})
                      CREATE (actor)-[:DIRECTED]->(movie)
                  `,
                {
                    movieTitle,
                    directorName,
                }
            );

            const result = await graphql({
                schema,
                source: query,
                variableValues: { movieTitle },
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(result.errors).toBeDefined();
            expect((result?.errors as any[])[0].message).toBe(`${typeMovie}.director required exactly once`);
        });

        // TODO: java.lang exception
        test.skip("should return error bc cannot have more than one node linked [update - create]", async () => {
            const query = `
        mutation($movieTitle: String!) {
          ${typeMovie.operations.update}(  
            where: {
              title: $movieTitle
            },
            create: {
              director: {
                node: {
                  ${typePerson.name}: {
                    name: "Jim"
                  }
                }
              }
            }) {
              info {
                  relationshipsCreated
              }
          }
        }
      `;

            await session.run(
                `
                  CREATE (movie:${typeMovie} {title: $movieTitle})
                  CREATE (actor:${typePerson} {name: $directorName})
                  CREATE (actor)-[:DIRECTED]->(movie)
              `,
                {
                    movieTitle,
                    directorName,
                }
            );

            const result = await graphql({
                schema,
                source: query,
                variableValues: { movieTitle },
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            // console.log(result.errors);
            expect(result.errors).toBeDefined();
            // Failed to invoke procedure `apoc.util.validate`: Caused by: java.lang.RuntimeException: Relationship field \"Movie.director\" cannot have more than one node linked
            expect((result?.errors as any[])[0].message).toBe(`${typeMovie}.director required exactly once`);
        });

        // TODO: java.lang exception
        test.skip("should return error on resulting movie connected to 2 directors [update - create - connect]", async () => {
            const query = `
        mutation($directorName: String!, $movieTitle: String!) {
          ${typePerson.operations.update}(  
            where: {
              name: $directorName
            },
            create: {
              movies: 
                {
                  node: {
                    ${typeMovie.name}: {
                      title: "Avatar",
                      director: {
                        create: {
                          node: {
                            ${typePerson.name}: {
                              name: "Jim",
                              movies: {
                                connect: {
                                    where: {
                                      node: {
                                        title: $movieTitle
                                      }
                                    }
                                  }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
            }) {
              info {
                  relationshipsCreated
              }
          }
        }
      `;

            await session.run(
                `
                  CREATE (movie:${typeMovie} {title: $movieTitle})
                  CREATE (director:${typePerson} {name: $directorName})
                  CREATE (director)-[:DIRECTED]->(movie)
              `,
                {
                    movieTitle,
                    directorName,
                }
            );

            const result = await graphql({
                schema,
                source: query,
                variableValues: { directorName, movieTitle },
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(result.errors).toBeDefined();
            expect((result?.errors as any[])[0].message).toBe(`${typeMovie}.director required exactly once`);
        });

        test("should return error on resulting movie left w/o connections [update - disconnect]", async () => {
            const query = `
        mutation($directorName: String!, $movieTitle: String!) {
          ${typePerson.operations.update}(  
            where: {
              name: $directorName
            },
            disconnect: {
              movies: 
                {
                  where: {
                    node: {
                      title: $movieTitle
                    }
                  }
                }
              
            }) {
              info {
                  relationshipsCreated
              }
          }
        }
      `;

            await session.run(
                `
                  CREATE (movie:${typeMovie} {title: $movieTitle})
                  CREATE (actor:${typePerson} {name: $directorName})
                  CREATE (actor)-[:DIRECTED]->(movie)
              `,
                {
                    movieTitle,
                    directorName,
                }
            );

            const result = await graphql({
                schema,
                source: query,
                variableValues: { directorName, movieTitle },
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(result.errors).toBeDefined();
            expect((result?.errors as any[])[0].message).toBe(`${typeMovie}.director required exactly once`);
        });

        test("[inverse] should return error on resulting movie left w/o connections [update - disconnect]", async () => {
            const query = `
      mutation($directorName: String!, $movieTitle: String!) {
        ${typeMovie.operations.update}(  
          where: {
            title: $movieTitle
          },
          disconnect: {
            director: 
              {
                where: {
                  node: {
                    name: $directorName
                  }
                }
              }
            
          }) {
            info {
                relationshipsCreated
            }
        }
      }
    `;

            await session.run(
                `
                CREATE (movie:${typeMovie} {title: $movieTitle})
                CREATE (actor:${typePerson} {name: $directorName})
                CREATE (actor)-[:DIRECTED]->(movie)
            `,
                {
                    movieTitle,
                    directorName,
                }
            );

            const result = await graphql({
                schema,
                source: query,
                variableValues: { directorName, movieTitle },
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(result.errors).toBeDefined();
            expect((result?.errors as any[])[0].message).toBe(`${typeMovie}.director required exactly once`);
        });

        test("should return error on resulting movie left w/o connections [update - update - disconnect]", async () => {
            const otherMovieTitle = "Avatar";
            const query = `
        mutation($directorName: String!, $movieTitle: String!, $otherMovieTitle: String!) {
          ${typeMovie.operations.update}(  
            where: {
              title: $otherMovieTitle
            },
            update: {
              director: {
                where: {
                  node: {
                    name: $directorName
                  }
                },
                update: {
                  node: {
                    movies: {
                        disconnect: {
                            where: {
                              node: {
                                title: $movieTitle
                              }
                            }
                          } 
                      }
                  }
                }
              }
            }) {
              info {
                  relationshipsCreated
              }
          }
        }
      `;

            await session.run(
                `
                  CREATE (movie:${typeMovie} {title: $movieTitle})
                  CREATE (movie2:${typeMovie} {title: $otherMovieTitle})
                  CREATE (actor:${typePerson} {name: $directorName})
                  CREATE (actor)-[:DIRECTED]->(movie)
                  CREATE (actor)-[:DIRECTED]->(movie2)
              `,
                {
                    movieTitle,
                    otherMovieTitle,
                    directorName,
                }
            );

            const result = await graphql({
                schema,
                source: query,
                variableValues: { directorName, movieTitle, otherMovieTitle },
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(result.errors).toBeDefined();
            expect((result?.errors as any[])[0].message).toBe(`${typeMovie}.director required exactly once`);
        });
    });
});

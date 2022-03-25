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

import { Driver, Session } from "neo4j-driver";
import { graphql } from "graphql";
import neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";
import { toGlobalId } from "../../src/utils/global-ids";
import { NodeBuilder } from "../utils/builders/node-builder";
import { generateUniqueType } from "../utils/graphql-types";

describe("Global node resolution", () => {
    let driver: Driver;
    let session: Session;

    const typeFilm = generateUniqueType("Film");

    beforeAll(async () => {
        driver = await neo4j();
        session = driver.session();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("returns the correct id after create mutation", async () => {
        const typeDefs = `type ${typeFilm.name} @node(global: true) {
            title: String! @unique
        }`;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const create = `
          mutation($input: [${typeFilm.name}CreateInput!]!) {
            ${typeFilm.operations.create}(input: $input) {
              ${typeFilm.plural} {
                  id
              }
            }
          }
        `;

        const node = new NodeBuilder({
            name: typeFilm.name,
            primitiveFields: [
                {
                    fieldName: "title",
                    typeMeta: {
                        name: "String",
                        array: false,
                        required: false,
                        pretty: "String",
                        input: {
                            where: {
                                type: "String",
                                pretty: "String",
                            },
                            create: { type: "String", pretty: "String" },
                            update: { type: "String", pretty: "String" },
                        },
                    },
                    otherDirectives: [],
                    arguments: [],
                },
            ],
        })
            .withNodeDirective({ global: true, nodeIdField: "title" })
            .instance();

        const expectedId = node.toGlobalId("2001: A Space Odyssey");

        try {
            const mutationResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: create,
                variableValues: { input: [{ title: "2001: A Space Odyssey" }] },
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

            expect(mutationResult.errors).toBeUndefined();

            const createdMovie = (mutationResult as { data: { [key: string]: Record<string, any> } }).data[
                typeFilm.operations.create
            ][typeFilm.plural][0];
            expect(createdMovie).toEqual({ id: expectedId });
        } finally {
            await session.close();
        }
    });
    test("returns the correct id when queried", async () => {
        const typeDefs = `type ${typeFilm.name} @node(global: true) {
            title: String! @unique
        }`;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const query = `query {
            ${typeFilm.plural} {
                id
              }
            }`;

        const create = `
          mutation($input: [${typeFilm.name}CreateInput!]!) {
            ${typeFilm.operations.create}(input: $input) {
              ${typeFilm.plural} {
                  id
              }
            }
          }
        `;

        const expectedId = toGlobalId(typeFilm.name, "title", "2001: A Space Odyssey");

        try {
            await graphql({
                schema: await neoSchema.getSchema(),
                source: create,
                variableValues: { input: [{ title: "2001: A Space Odyssey" }] },
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

            expect(gqlResult.errors).toBeUndefined();

            const movie = (gqlResult as { data: { [key: string]: Record<string, any>[] } }).data[typeFilm.plural][0];
            expect(movie).toEqual({ id: expectedId });
        } finally {
            await session.close();
        }
    });
    test("sends and returns the correct selectionSet for the node", async () => {
        const typeDefs = `
        type ${typeFilm.name} @node(global:true) {
          title: String! @unique  
          website: String
        }

        type FilmActor @node(global: true) {
          name: String! @unique
          hairColor: String
        }
      `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const query = `
          query($id: ID!) {
            node(id: $id) {
              id
              ... on ${typeFilm.name} {
                title
                website
              }
              ... on FilmActor {
                name
                hairColor
              }
            }
          }
        `;

        try {
            const film = {
                id: toGlobalId(typeFilm.name, "title", "The Matrix 2022"),
                title: "The Matrix 2022",
                website: "http://whatisthematrix.com",
            };

            await graphql({
                schema: await neoSchema.getSchema(),
                variableValues: { input: [{ title: film.title, website: film.website }] },
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
                source: `
                  mutation($input: [${typeFilm.name}CreateInput!]!) {
                    ${typeFilm.operations.create}(input: $input) {
                      ${typeFilm.plural} {
                          id
                      }
                    }
                  }
                `,
            });
            const actor = {
                id: toGlobalId(`FilmActor`, "name", "Keanu Reeves"),
                name: "Keanu Reeves",
                hairColor: "BLACK",
            };

            await graphql({
                schema: await neoSchema.getSchema(),
                variableValues: { input: [{ name: actor.name, hairColor: actor.hairColor }] },
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
                source: `
                  mutation($input: [FilmActorCreateInput!]!) {
                    createFilmActors(input: $input) {
                      filmActors {
                          id
                      }
                    }
                  }
                `,
            });

            const filmQueryResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: { driver, driverConfig: { bookMarks: [session.lastBookmark()] } },
                variableValues: { id: film.id },
            });

            expect(filmQueryResult.errors).toBeUndefined();

            const filmResult = (filmQueryResult as { data: { [key: string]: any } }).data.node;
            expect(filmResult).toEqual(film);

            const actorQueryResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: { driver, driverConfig: { bookMarks: [session.lastBookmark()] } },
                variableValues: { id: actor.id },
            });

            expect(actorQueryResult.errors).toBeUndefined();

            const actorResult = (actorQueryResult as { data: { [key: string]: any } }).data.node;
            expect(actorResult).toEqual(actor);
        } finally {
            await session.close();
        }
    });
});

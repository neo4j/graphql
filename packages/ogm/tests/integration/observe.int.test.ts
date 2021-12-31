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

import { localPubSub } from "@neo4j/graphql";
import { MutationEventWithResult } from "@neo4j/graphql/src/types";
import { PubSub } from "graphql-subscriptions";
import gql from "graphql-tag";
import { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { OGM } from "../../src";
import neo4j from "./neo4j";

describe("OGM Subscriptions", () => {
    let driver: Driver;
    let foreignPubSub = new PubSub();

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should return result when subscribed to", async () => {
        // const session = driver.session();

        const typeDefs = gql`
            type Movie {
                name: String!
            }
        `;

        const name = 'Lord of the Wizards';

        const ogm = new OGM({ typeDefs, driver });

        const Movie = ogm.model('Movie');
        const obs = Movie.observe<{ name: string }>({});
        const movies: any[] = [];
        const prom = new Promise((resolve) => {
            const sub = obs.subscribe((res) => {
                movies.push(res);
                resolve(movies);
                sub.unsubscribe();
            });
        });

        await Movie.create({
            input: {
                name,
            },
        });

        // const movie = await obs.toPromise();
        await prom;
        expect(movies).toHaveLength(1);
        const [ movie ] = movies;
        expect(movie.name).toEqual('Movie');
        expect(movie).toEqual({
            name: 'Movie',
            id: expect.any(Number),
            type: 'Created',
            properties: { name, },
            bookmark: expect.any(String),
            result: { name, _id: expect.any(Number) },
        });
        await obs.close();
    });

    test("should close the observable and cleanup", async () => {
        // const session = driver.session();

        const typeDefs = gql`
            type Movie {
                name: String!
            }
        `;

        const ogm = new OGM({ typeDefs, driver });

        const Movie = ogm.model('Movie');
        const obs = Movie.observe<{ name: string }>({});
        const result = await obs.close();
        expect(result?.done).toEqual(true);
        await new Promise((resolve) => setTimeout(resolve, 200));
    });

    test('should use local pubsub by default', async () => {
        const session = driver.session();
        const typeDefs = gql`
            type Movie {
                name: String!
            }
        `;

        const name = generate({ charset: "alphabetic" });
        let id: number;

        try {
            const { records: [ record ] } = await session.run(`
                CREATE (m:Movie { name: $name })
                RETURN id(m) as id
            `, { name });

            id = record.get('id').toNumber();
        } catch (err) {
            await session.close();
            throw err;
        }

        const ogm = new OGM({ typeDefs, driver, pubsub: foreignPubSub });

        const Movie = ogm.model('Movie');
        const obs = Movie.observe<{ name: string }>({});

        const prom = new Promise((resolve) => {
            const sub = obs.subscribe((res) => {
                resolve(res);
                sub.unsubscribe();
            });
        });

        localPubSub.publish('Movie.Created', {
            name: 'Movie',
            id,
            type: 'Created',
            properties: { name, },
        });

        await expect(prom).resolves.toEqual({
            name: 'Movie',
            id,
            type: 'Created',
            properties: { name, },
            result: { name, _id: expect.any(Number) },
        });

        await obs.close();
        await session.close();
    });
    test('should override foreign pubsub', async () => {

        const session = driver.session();
        const typeDefs = gql`
            type Movie {
                name: String!
            }
        `;

        const name = generate({ charset: "alphabetic" });
        let id: number;

        try {
            const { records: [ record ] } = await session.run(`
                CREATE (m:Movie { name: $name })
                RETURN id(m) as id
            `, { name });

            id = record.get('id').toNumber();
        } catch (err) {
            await session.close();
            throw err;
        }

        const ogm = new OGM({ typeDefs, driver, pubsub: foreignPubSub });

        const Movie = ogm.model('Movie');
        const obs = Movie.observe<{ name: string }>({
            pubsub: 'foreign',
        });

        const prom = new Promise((resolve) => {
            const sub = obs.subscribe((res) => {
                resolve(res);
                sub.unsubscribe();
            });
        });

        foreignPubSub.publish('Movie.Created', {
            name: 'Movie',
            id,
            type: 'Created',
            properties: { name, },
        });

        await expect(prom).resolves.toEqual({
            name: 'Movie',
            id,
            type: 'Created',
            properties: { name, },
            result: { name, _id: expect.any(Number) },
        });

        await obs.close();
        await session.close();
    });
    test('should override pubsub', async () => {
        

        const session = driver.session();
        const typeDefs = gql`
            type Movie {
                name: String!
            }
        `;

        const name = generate({ charset: "alphabetic" });
        let id: number;

        try {
            const { records: [ record ] } = await session.run(`
                CREATE (m:Movie { name: $name })
                RETURN id(m) as id
            `, { name });

            id = record.get('id').toNumber();
        } catch (err) {
            await session.close();
            throw err;
        }

        // Note lack of pubsub here
        const ogm = new OGM({ typeDefs, driver });

        const Movie = ogm.model('Movie');
        const obs = Movie.observe<{ name: string }>({
            pubsub: foreignPubSub,
        });

        const prom = new Promise((resolve) => {
            const sub = obs.subscribe((res) => {
                resolve(res);
                sub.unsubscribe();
            });
        });

        foreignPubSub.publish('Movie.Created', {
            name: 'Movie',
            id,
            type: 'Created',
            properties: { name, },
        });

        await expect(prom).resolves.toEqual({
            name: 'Movie',
            id,
            type: 'Created',
            properties: { name, },
            result: { name, _id: expect.any(Number) },
        });

        await obs.close();
        await session.close();
    });
    test('should filter results before execution', async () => {
        
        const typeDefs = gql`
            type Movie {
                name: String!
                actors: [ Actor! ] @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }
            type Actor {
                name: String!
                movies: [ Movie! ] @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            interface ActedIn {
                screenTime: Int
            }
        `;
        const movieName1 = generate({ charset: "alphabetic" });
        const actorName1 = generate({ charset: "alphabetic" });
        const movieName2 = generate({ charset: "alphabetic" });
        const actorName2 = generate({ charset: "alphabetic" });

        const ogm = new OGM({ typeDefs, driver });

        const Movie = ogm.model('Movie');
        const Actor = ogm.model('Actor');

        const obs = Movie.observe<{ name: string }>({
            filter: {
                type_IN: [ 'Connected' ],
                toName: 'Actor',
                propsUpdated: [ 'screenTime' ],
            }
        });
        const mutationEvents: MutationEventWithResult<any>[] = [];
        const sub = obs.subscribe((res) => {
            mutationEvents.push(res);
        });

        await Movie.create({
            input: {
                name: movieName1,
                actors: {
                    create: [{
                        node: {
                            name: actorName1,
                        }
                    }]
                }
            },
        });

        await Actor.create({
            input: {
                name: actorName2,
                movies: {
                    create: [{
                        node: {
                            name: movieName2,
                        },
                        edge: {
                            screenTime: 42,
                        },
                    }],
                }
            },
        });

        // const movie = await obs.toPromise();
        await new Promise((resolve) => setTimeout(resolve, 50));
        sub.unsubscribe();
        await obs.close();
        expect(mutationEvents).toHaveLength(1);
        const [ ev ] = mutationEvents;
        expect(ev).toEqual({
            name: 'Movie',
            id: expect.any(Number),
            type: 'Connected',
            toID: expect.any(Number),
            relationshipName: 'ACTED_IN',
            toName: 'Actor',
            bookmark: expect.any(String),
            relationshipID: expect.any(Number),
            properties: {
                screenTime: 42,
            },
            result: { name: movieName2, _id: expect.any(Number) },
        });
    });
    test('should pass where args to subscription', async () => {

        const typeDefs = gql`
            type Movie {
                name: String!
            }

        `;
        const movieName1 = generate({ charset: "alphabetic" });
        const movieName2 = generate({ charset: "alphabetic" });

        const ogm = new OGM({ typeDefs, driver });

        const Movie = ogm.model('Movie');

        const obs = Movie.observe<{ name: string }>({
            filter: {
                type_IN: [ 'Created' ],
            },
            where: {
                name: movieName1,
            },
        });
        const mutationEvents: MutationEventWithResult<any>[] = [];
        const sub = obs.subscribe((res) => {
            mutationEvents.push(res);
        });

        await Movie.create({
            input: [
                {
                    name: movieName1,
                },
                {
                    name: movieName2,
                }
            ],
        });

        // const movie = await obs.toPromise();
        await new Promise((resolve) => setTimeout(resolve, 50));
        sub.unsubscribe();
        await obs.close();
        expect(mutationEvents).toHaveLength(1);
        const [ ev ] = mutationEvents;
        expect(ev).toEqual({
            name: 'Movie',
            id: expect.any(Number),
            type: 'Created',
            bookmark: expect.any(String),
            properties: {
                name: movieName1,
            },
            result: { name: movieName1, _id: expect.any(Number) },
        });

    });
    test('resolve a deleted object from the cache using existing, updated, and deleted', async () => {
        const typeDefs = gql`
            type Movie {
                name: String!
                category: String!
            }

        `;
        const category = generate({ charset: "alphabetic" });
        const movieName1 = generate({ charset: "alphabetic" });
        const movieName2 = generate({ charset: "alphabetic" });
        const movieName2_new = generate({ charset: "alphabetic" });
        const movieName3 = generate({ charset: "alphabetic" });

        const ogm = new OGM({ typeDefs, driver });

        const Movie = ogm.model('Movie');

        await Movie.create({
            input: [
                {
                    name: movieName1,
                    category,
                },
                {
                    name: movieName2,
                    category,
                },
            ],
        });

        let waitForSubcacheResolve;
        const waitForSubcache = new Promise((resolve) => {
            waitForSubcacheResolve = resolve;
        });

        await new Promise((resolve) => setTimeout(resolve, 20));
        const obs = Movie.observe<{ name: string }>({
            filter: {
                type_IN: [ 'Created', 'Updated', 'Deleted' ],
            },
            where: {
                category,
            },
            enableSubCache: true,
            cbSubCacheResolved: waitForSubcacheResolve,
        });
        const mutationEvents: MutationEventWithResult<any>[] = [];
        const sub = obs.subscribe((res) => {
            mutationEvents.push(res);
        });

        await waitForSubcache;
        console.log(obs.subCache);

        await Movie.create({
            input: [
                {
                    name: movieName3,
                    category,
                }
            ],
        });
        await Movie.update({
            where: {
                name: movieName2,
            },
            update: {
                name: movieName2_new,
            },
        });

        await new Promise((resolve) => setTimeout(resolve, 20));

        await Movie.delete({ where: { name: movieName1 } });
        await Movie.delete({ where: { name: movieName2_new } });
        await Movie.delete({ where: { name: movieName3 } });

        // const movie = await obs.toPromise();
        await new Promise((resolve) => setTimeout(resolve, 50));
        sub.unsubscribe();
        await obs.close();
        expect(mutationEvents).toHaveLength(5);
        expect(mutationEvents).toContainEqual({
            name: 'Movie',
            id: expect.any(Number),
            type: 'Deleted',
            bookmark: expect.any(String),
            result: {
                _id: expect.any(Number),
                category: expect.any(String),
                name: movieName1,
            },
        });
        expect(mutationEvents).toContainEqual({
            name: 'Movie',
            id: expect.any(Number),
            type: 'Deleted',
            bookmark: expect.any(String),
            result: {
                _id: expect.any(Number),
                category: expect.any(String),
                name: movieName2_new,
            },
        });
        expect(mutationEvents).toContainEqual({
            name: 'Movie',
            id: expect.any(Number),
            type: 'Deleted',
            bookmark: expect.any(String),
            result: {
                _id: expect.any(Number),
                category: expect.any(String),
                name: movieName3,
            },
        });
    });

    test('keeps an unresolved node', async () => {
        const typeDefs = gql`
            type Movie {
                name: String!
            }

        `;
        const movieName1 = generate({ charset: "alphabetic" });
        const movieName2 = generate({ charset: "alphabetic" });

        const ogm = new OGM({ typeDefs, driver });

        const Movie = ogm.model('Movie');

        const obs = Movie.observe<{ name: string }>({
            keepUnresolved: true,
            filter: {
                type_IN: [ 'Created' ],
            },
            where: {
                name: movieName1,
            },
        });
        const mutationEvents: MutationEventWithResult<any>[] = [];
        const sub = obs.subscribe((res) => {
            mutationEvents.push(res);
        });

        await Movie.create({
            input: [
                {
                    name: movieName1,
                },
                {
                    name: movieName2,
                }
            ],
        });

        // const movie = await obs.toPromise();
        await new Promise((resolve) => setTimeout(resolve, 50));
        sub.unsubscribe();
        await obs.close();
        expect(mutationEvents).toHaveLength(2);
        expect(mutationEvents).toEqual([
            {
                name: 'Movie',
                id: expect.any(Number),
                type: 'Created',
                bookmark: expect.any(String),
                properties: {
                    name: movieName1,
                },
                result: { name: movieName1, _id: expect.any(Number) },
            },
            {
                name: 'Movie',
                id: expect.any(Number),
                type: 'Created',
                bookmark: expect.any(String),
                properties: {
                    name: movieName2,
                },
                result: undefined,
            },
            
        ]
        );
    });

    test('disables resolving', async () => {
        const typeDefs = gql`
            type Movie {
                name: String!
            }

        `;
        const movieName1 = generate({ charset: "alphabetic" });
        const movieName2 = generate({ charset: "alphabetic" });

        const ogm = new OGM({ typeDefs, driver });

        const Movie = ogm.model('Movie');

        const obs = Movie.observe<{ name: string }>({
            disableResolve: true,
            filter: {
                type_IN: [ 'Created' ],
            },
            where: {
                name: movieName1,
            },
        });
        const mutationEvents: MutationEventWithResult<any>[] = [];
        const sub = obs.subscribe((res) => {
            mutationEvents.push(res);
        });

        await Movie.create({
            input: [
                {
                    name: movieName1,
                },
                {
                    name: movieName2,
                }
            ],
        });

        // const movie = await obs.toPromise();
        await new Promise((resolve) => setTimeout(resolve, 50));
        sub.unsubscribe();
        await obs.close();
        expect(mutationEvents).toHaveLength(2);
        expect(mutationEvents).toEqual([
            {
                name: 'Movie',
                id: expect.any(Number),
                type: 'Created',
                bookmark: expect.any(String),
                properties: {
                    name: movieName1,
                },
                result: undefined,
            },
            {
                name: 'Movie',
                id: expect.any(Number),
                type: 'Created',
                bookmark: expect.any(String),
                properties: {
                    name: movieName2,
                },
                result: undefined,
            },
            
        ]
        );

    });

});
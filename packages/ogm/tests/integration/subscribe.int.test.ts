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

import { localPubSub, publishMutateMeta } from "@neo4j/graphql";
import gql from "graphql-tag";
import { Driver } from "neo4j-driver";
import { OGM } from "../../src";
import neo4j from "./neo4j";

describe("OGM Subscriptions", () => {
    let driver: Driver;

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
            result: { name, },
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

    // test.skip('should use local pubsub by default');
    // test.skip('should override foreign pubsub');
    // test.skip('should override pubsub');
    // test.skip('should filter results before execution');
    // test.skip('should pass arguments to subscription');
    // test.skip('resolve a deleted object from the cache');
    // test.skip('');
    // test.skip('');
    // test.skip('');
    // test.skip('');
    // test.skip('');
    // test.skip('');

});
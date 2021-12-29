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
        const session = driver.session();

        const typeDefs = gql`
            type Movie {
                id: ID!
            }
        `;

        const ogm = new OGM({ typeDefs, driver });

        const Movie = ogm.model('Movie');
        const subscription = Movie
            .observe({})
            .subscribe((result) => {
                console.log(result);
            });


        localPubSub.publish('Movie.Created', {
            "name": "Movie",
            "id": 26,
            "type": "Created",
            "properties": {
              "name": "Mr Director"
            },
            "bookmark": "FB:kcwQvD1NlYfdQKqlcPiAwmu+Sx2Q"
        });

        await new Promise((resolve) => setTimeout(resolve, 1000));

        expect(true).toEqual(false);



        await session.close();
    });

    // test.skip('should use local pubsub by default');
    // test.skip('should override foreign pubsub');
    // test.skip('should override pubsub');

});
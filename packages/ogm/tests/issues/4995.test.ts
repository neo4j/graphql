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

import type { Driver, Session } from "neo4j-driver";
import { OGM } from "../../src";
import neo4j from "../integration/neo4j";
import { cleanNodes } from "../utils/clean-nodes";
import { UniqueType } from "../utils/utils";

describe("https://github.com/neo4j/graphql/issues/4995", () => {
    let driver: Driver;
    let session: Session;

    let A: UniqueType;
    let B: UniqueType;

    beforeAll(async () => {
        driver = await neo4j();
    });

    beforeEach(() => {
        session = driver.session();
        A = new UniqueType("A");
        B = new UniqueType("B");
    });

    afterEach(async () => {
        await cleanNodes(session, [A, B]);
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should not raise an error when schema configuration is used on union types", async () => {
        const typeDefs = /* GraphQL */ `
            type ${A} {
                a: String
            }

            type ${B} {
                b: String
            }

            union AorB = ${A} | ${B}
            extend union AorB @query(read: true, aggregate: true)
        `;

        const ogm = new OGM({
            typeDefs,
            driver,
        });

        await expect(ogm.init()).resolves.not.toThrow();
    });
});

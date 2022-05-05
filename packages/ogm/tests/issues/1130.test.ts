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

import { generate, OGM } from "../../src";

describe("issues/1130", () => {
    test("should re-create issue and return types without throwing", async () => {
        const typeDefs = `
            type Company {
              name: String!
              industries: [SICIndustry!]! @relationship(type: "CONDUCTS_BUSINESS_IN", direction: OUT)
            }
            
            # <-- Changing the name to "SicIndustry" works
            type SICIndustry {
              code: ID! @id(autogenerate: false)
              title: String!
              companies: [Company!]! @relationship(type: "CONDUCTS_BUSINESS_IN", direction: IN)
            }
        `;

        const ogm = new OGM({
            typeDefs,
            // @ts-ignore
            driver: {},
        });

        const generated = (await generate({
            ogm,
            noWrite: true,
        })) as string;

        expect(generated).toContain(`export interface SICIndustryAggregateSelectionInput`);
    });
});

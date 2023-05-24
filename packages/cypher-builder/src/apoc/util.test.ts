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

import Cypher from "..";
describe("apoc.util", () => {
    describe("Validate", () => {
        test("Simple Validate", () => {
            const validate = Cypher.apoc.util.validate(
                Cypher.eq(new Cypher.Literal(1), new Cypher.Literal(2)),
                "That's not how math works"
            );
            expect(validate.build().cypher).toMatchInlineSnapshot(
                `"CALL apoc.util.validate(1 = 2, \\"That's not how math works\\", [0])"`
            );
        });
    });

    describe("ValidatePredicate", () => {
        test("Simple validatePredicate", () => {
            const node = new Cypher.Node({ labels: ["Movie"] });
            const validatePredicate = Cypher.apoc.util.validatePredicate(
                Cypher.eq(new Cypher.Literal(1), new Cypher.Literal(2)),
                "That's not how math works"
            );

            const query = new Cypher.Match(node);
            query.where(validatePredicate).return(node);

            const { cypher, params } = query.build();
            expect(cypher).toMatchInlineSnapshot(`
                "MATCH (this0:\`Movie\`)
                WHERE apoc.util.validatePredicate(1 = 2, \\"That's not how math works\\", [0])
                RETURN this0"
            `);
            expect(params).toMatchInlineSnapshot(`Object {}`);
        });
    });
});

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

import Cypher from "../..";

describe("Validate", () => {
    // test("Validate types", () => {
    //     expectTypeOf<Cypher.apoc.Validate>().toMatchTypeOf<CypherASTNode>();
    //     expectTypeOf<Cypher.apoc.Validate>().toMatchTypeOf<Cypher.Procedure>();
    // });

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

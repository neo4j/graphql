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

import { expectTypeOf } from "expect-type";
import { CypherEnvironment } from "../../Environment";
import Cypher from "../..";
import type { CypherASTNode } from "../../CypherASTNode";

describe("ValidatePredicate", () => {
    let env: CypherEnvironment;

    beforeEach(() => {
        env = new CypherEnvironment();
    });

    test("ValidatePredicate types", () => {
        expectTypeOf<Cypher.apoc.ValidatePredicate>().toMatchTypeOf<CypherASTNode>();
        expectTypeOf<Cypher.apoc.ValidatePredicate>().toMatchTypeOf<Cypher.Predicate>();
    });

    test("Simple validatePredicate", () => {
        const node = new Cypher.Node({ labels: ["Movie"] });
        const validatePredicate = new Cypher.apoc.ValidatePredicate(
            Cypher.eq(new Cypher.Literal(1), new Cypher.Literal(2)),
            "That's not how math works",
        );
        const query = new Cypher.Match(node);
        query.where(validatePredicate).return(node);

        expect(query.getCypher(env)).toMatchInlineSnapshot(`
            "MATCH (this0:\`Movie\`)
            WHERE apoc.util.validatePredicate(1 = 2, \\"That's not how math works\\", [0])
            RETURN this0"
        `);
    });
});

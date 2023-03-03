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
import { TestClause } from "../../utils/TestClause";

describe("string operators", () => {
    const im = new Cypher.Literal("I'm");
    const space = new Cypher.Literal(" ");
    const batman = new Cypher.Literal("Batman");

    test("append two strings", () => {
        const append = Cypher.append(im, space);
        const { cypher } = new TestClause(append).build();
        expect(cypher).toMatchInlineSnapshot(`"\\"I'm\\" + \\" \\""`);
    });

    test("append more than two strings", () => {
        const append = Cypher.append(im, space, batman);
        const { cypher } = new TestClause(append).build();
        expect(cypher).toMatchInlineSnapshot(`"\\"I'm\\" + \\" \\" + \\"Batman\\""`);
    });
});

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

import * as Cypher from "../Cypher";

describe("CypherBuilder USE", () => {
    test("USE before clause", () => {
        const n1 = new Cypher.Node({ labels: ["Movie"] });
        const query1 = new Cypher.Match(n1).return(n1);

        const useQuery = new Cypher.Use("mydb", query1);
        const queryResult = useQuery.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`
            "USE mydb
            MATCH (this0:\`Movie\`)
            RETURN this0"
        `);
        expect(queryResult.params).toMatchInlineSnapshot(`Object {}`);
    });

    test("USE in CALL", () => {
        const n1 = new Cypher.Node({ labels: ["Movie"] });
        const query1 = new Cypher.Match(n1).return(n1);

        const callQuery = new Cypher.Call(new Cypher.Use("mydb", query1));
        const queryResult = callQuery.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`
            "CALL {
                USE mydb
                MATCH (this0:\`Movie\`)
                RETURN this0
            }"
        `);
        expect(queryResult.params).toMatchInlineSnapshot(`Object {}`);
    });

    test("USE in UNION", () => {
        const n1 = new Cypher.Node({ labels: ["Movie"] });
        const query1 = new Cypher.Match(n1).return(n1);
        const n2 = new Cypher.Node({ labels: ["Movie"] });
        const query2 = new Cypher.Match(n2).return(n2);

        const callQuery = new Cypher.Union(new Cypher.Use("mydb", query1), query2);
        const queryResult = callQuery.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`
            "USE mydb
            MATCH (this0:\`Movie\`)
            RETURN this0
            UNION
            MATCH (this1:\`Movie\`)
            RETURN this1"
        `);
        expect(queryResult.params).toMatchInlineSnapshot(`Object {}`);
    });
});

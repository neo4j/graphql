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

import { AuthBuilder } from "./create-auth-and-params-cypher";
import * as CypherBuilder from "./cypher-builder/CypherBuilder";
import { CypherEnvironment } from "./cypher-builder/Environment";

describe("createAuthAndParams Cypher", () => {
    it("Create roles", () => {
        const authBuilder = new AuthBuilder();

        const param = new CypherBuilder.Param(["admin", "owner"]);
        const predicate = authBuilder.createRolesCypher(["admin", "user"], param);

        const predicateCypher = predicate.getCypher(new CypherEnvironment());

        expect(predicateCypher).toMatchInlineSnapshot(
            `"any(var1 IN [admin, user] WHERE any(var0 IN $param0 WHERE var0 = var1))"`
        );
    });
});

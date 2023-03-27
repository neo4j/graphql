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

import Cypher from "@neo4j/cypher-builder";
import { ContextBuilder } from "../../../../tests/utils/builders/context-builder";
import { createJwtPayloadWherePredicate } from "./create-authorization-jwt-payload-predicate";

describe("createAuthorizationJwtPayloadPredicate", () => {
    test("simple check for role", () => {
        const authParam = new Cypher.Param({ roles: ["admin", "user"] });

        const context = new ContextBuilder({ authParam }).instance();

        const where = { roles_INCLUDES: "admin" };

        const predicate = createJwtPayloadWherePredicate({ where, context });

        new Cypher.RawCypher((env) => {
            expect(predicate?.getCypher(env)).toBe("$param0 IN $param1");
            expect(env.getParams()).toEqual({
                param0: "admin",
                param1: {
                    roles: ["admin", "user"],
                },
            });
            return "";
        }).build();
    });
});

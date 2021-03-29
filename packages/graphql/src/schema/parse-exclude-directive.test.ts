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

import { parse } from "graphql";
import parseExcludeDirective from "./parse-exclude-directive";
import { Exclude } from "../classes";

describe("parseExcludeDirective", () => {
    test("should throw an error if incorrect directive is passed in", () => {
        const typeDefs = `
            type TestType @wrongdirective {
                name: String
            }
        `;

        // @ts-ignore
        const directive = parse(typeDefs).definitions[0].directives[0];

        expect(() => parseExcludeDirective(directive)).toThrow(
            "Undefined or incorrect directive passed into parseExcludeDirective function"
        );
    });

    test("should return array of operations to ignore given valid array input", () => {
        const typeDefs = `
            type TestType @exclude(operations: [CREATE, DELETE]) {
                name: String
            }
        `;

        // @ts-ignore
        const directive = parse(typeDefs).definitions[0].directives[0];

        const expected = new Exclude({ operations: ["create", "delete"] });

        expect(parseExcludeDirective(directive)).toMatchObject(expected);
    });

    test("should return array of all operations to ignore given valid input of '*'", () => {
        const typeDefs = `
            type TestType @exclude {
                name: String
            }
        `;

        // @ts-ignore
        const directive = parse(typeDefs).definitions[0].directives[0];

        const expected = new Exclude({ operations: ["create", "read", "update", "delete"] });

        expect(parseExcludeDirective(directive)).toMatchObject(expected);
    });
});

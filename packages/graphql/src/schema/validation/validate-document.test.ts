/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable jest/no-conditional-expect */
/* eslint-disable jest/no-try-expect */
/* ^ so we can use toContain on the errors */

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
import validateDocument from "./validate-document";

describe("validateDocument", () => {
    test("should throw one of the directive errors", () => {
        const doc = parse(`
            type User @coalesce {
                name: String
            }
        `);

        try {
            validateDocument(doc);
            throw new Error();
        } catch (error) {
            expect(error.message).toContain('Directive "@coalesce" may not be used on OBJECT.');
        }
    });

    test("should throw a missing scalar error", () => {
        const doc = parse(`
            type User {
                name: Unknown
            }
        `);

        try {
            validateDocument(doc);
            throw new Error();
        } catch (error) {
            expect(error.message).toContain('Unknown type "Unknown".');
        }
    });

    test("should remove auth directive and pass validation", () => {
        const doc = parse(`
            type User @auth {
                name: String @auth
            }
        `);

        const res = validateDocument(doc);
        expect(res).toBeUndefined();
    });

    describe("Github Issue 158", () => {
        test("should not throw error on validation of schema", () => {
            const doc = parse(`
                type User {
                    name: String
                }
            `);

            const res = validateDocument(doc);
            expect(res).toBeUndefined();
        });
    });
});

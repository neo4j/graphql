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

import * as matchers from "jest-extended";
import { expect } from "vitest";

// Setup files run once per test file, and without isolation the files in a worker share one
// `expect`, so register everything once
const registered = Symbol.for("neo4j-graphql.vitest-setup");
const state = globalThis as typeof globalThis & { [registered]?: boolean };

if (!state[registered]) {
    state[registered] = true;

    expect.extend(matchers);

    // Jest treats two errors as equal when their messages are equal. Vitest also compares their
    // other properties, such as the locations and path of a GraphQLError. Many tests compare
    // received errors with `new GraphQLError(message)`, so keep Jest's rule. It also applies to
    // jest-extended matchers such as toIncludeSameMembers. Unlike Jest, `toStrictEqual` then does
    // not check that the two errors have the same class.
    expect.addEqualityTesters([
        function errorsEqualByMessage(a: unknown, b: unknown): boolean | undefined {
            if (a instanceof Error && b instanceof Error) {
                return a.message === b.message;
            }
            return undefined;
        },
    ]);
}

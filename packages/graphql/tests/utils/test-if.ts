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

/** Skips test if condition is not met */
export function testIf(condition: boolean, message?: string): jest.It {
    if (!condition && message) {
        console.log(message);
    }

    return condition ? test : test.skip;
}

// Hacks to support testIt.only and testIt.skip
//  - Do not cite the Deep Magic to me, Witch! I was there when it was written.
testIf.only = function (condition: boolean, message?: string): jest.It {
    if (!condition && message) {
        console.log(message);
    }

    return condition ? test.only : test.only.skip;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
testIf.skip = function (_condition: boolean, _message?: string): jest.It {
    return test.skip;
};

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

import { leadingUnderscores } from "./leading-underscore";

describe("leadingUnderscores", () => {
    test("should return empty string if no leading underscores", () => {
        expect(leadingUnderscores("test")).toBe("");
    });
    
    test("should return single underscore if single leading underscore", () => {
        expect(leadingUnderscores("_test")).toBe("_");
    });

    test("should return multiple underscores if multiple leading underscores", () => {
        expect(leadingUnderscores("___test")).toBe("___");
    });
});

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

import { Neo4jError } from "neo4j-driver";
import { errorHasGQLStatus } from "./error-has-gql-status";

describe("errorHasGQLStatus", () => {
    const changeIdentifierError = new Neo4jError(
        "error: procedure exception",
        "SERVICE_UNAVAILABLE",
        "52N29",
        "error: procedure exception - outdated change identifier. Given ChangeIdentifier describes a transaction that occurred before any enrichment records exist."
    );
    const wrappedChangeIdentifierError = new Neo4jError(
        "error: procedure exception",
        "SERVICE_UNAVAILABLE",
        "52N16",
        "error: procedure exception - outdated change identifier. Given ChangeIdentifier describes a transaction that occurred before any enrichment records exist.",
        {} as any,
        changeIdentifierError
    );

    test("checks an error with a gqlStatus", () => {
        expect(errorHasGQLStatus(changeIdentifierError, "52N29")).toBeTrue();
        expect(errorHasGQLStatus(changeIdentifierError, "52N30")).toBeFalse();
    });

    test("checks a wrapped error with a gqlStatus", () => {
        expect(errorHasGQLStatus(wrappedChangeIdentifierError, "52N29")).toBeTrue();
        expect(errorHasGQLStatus(wrappedChangeIdentifierError, "52N16")).toBeTrue();
        expect(errorHasGQLStatus(wrappedChangeIdentifierError, "52N30")).toBeFalse();
    });
});

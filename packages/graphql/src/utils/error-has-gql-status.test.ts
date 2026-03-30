/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
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

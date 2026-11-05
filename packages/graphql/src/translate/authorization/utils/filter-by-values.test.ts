/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { filterByValues } from "./filter-by-values";

describe("filterByValues", () => {
    describe("single condition", () => {
        test("returns true when the condition is satisfied", () => {
            const result = filterByValues<any>({ roles: { includes: "admin" } }, { roles: ["user", "admin"] });

            expect(result).toBe(true);
        });

        test("returns false when the condition is not satisfied", () => {
            const result = filterByValues<any>({ roles: { includes: "admin" } }, { roles: ["user"] });

            expect(result).toBe(false);
        });

        test("returns false when the received value is missing", () => {
            const result = filterByValues<any>({ roles: { includes: "admin" } }, {});

            expect(result).toBe(false);
        });
    });

    describe("multiple conditions combined with implicit AND", () => {
        test("returns true when all conditions are satisfied", () => {
            const result = filterByValues<any>(
                { iss: { eq: "https://idp.example.com" }, roles: { includes: "admin" } },
                { iss: "https://idp.example.com", roles: ["user", "admin"] }
            );

            expect(result).toBe(true);
        });

        test("returns false when only the first condition is not satisfied", () => {
            const result = filterByValues<any>(
                { iss: { eq: "https://idp.example.com" }, roles: { includes: "admin" } },
                { iss: "https://evil.example.com", roles: ["user", "admin"] }
            );

            expect(result).toBe(false);
        });

        test("returns false when the first condition is satisfied but a subsequent condition is not", () => {
            const result = filterByValues<any>(
                { iss: { eq: "https://idp.example.com" }, roles: { includes: "admin" } },
                { iss: "https://idp.example.com", roles: ["user"] }
            );

            expect(result).toBe(false);
        });

        test("returns false when a condition listed later is not satisfied, regardless of condition order", () => {
            const result = filterByValues<any>(
                { roles: { includes: "admin" }, iss: { eq: "https://idp.example.com" } },
                { iss: "https://evil.example.com", roles: ["user", "admin"] }
            );

            expect(result).toBe(false);
        });

        test("evaluates every operator on a field combined with implicit AND", () => {
            const result = filterByValues<any>(
                { iss: { eq: "https://idp.example.com", startsWith: "https://" } },
                { iss: "https://idp.example.com" }
            );

            expect(result).toBe(true);

            const result2 = filterByValues<any>(
                { iss: { eq: "https://idp.example.com", startsWith: "http://" } },
                { iss: "https://idp.example.com" }
            );

            expect(result2).toBe(false);
        });
    });

    describe("explicit logical operators", () => {
        test("AND returns true only when every condition is satisfied", () => {
            const result = filterByValues<any>(
                { AND: [{ iss: { eq: "https://idp.example.com" } }, { roles: { includes: "admin" } }] },
                { iss: "https://idp.example.com", roles: ["user", "admin"] }
            );

            expect(result).toBe(true);

            const result2 = filterByValues<any>(
                { AND: [{ iss: { eq: "https://idp.example.com" } }, { roles: { includes: "admin" } }] },
                { iss: "https://idp.example.com", roles: ["user"] }
            );

            expect(result2).toBe(false);
        });

        test("OR returns true when at least one condition is satisfied", () => {
            const result = filterByValues<any>(
                { OR: [{ iss: { eq: "https://idp.example.com" } }, { roles: { includes: "admin" } }] },
                { iss: "https://evil.example.com", roles: ["user", "admin"] }
            );

            expect(result).toBe(true);

            const result2 = filterByValues<any>(
                { OR: [{ iss: { eq: "https://idp.example.com" } }, { roles: { includes: "admin" } }] },
                { iss: "https://evil.example.com", roles: ["user"] }
            );

            expect(result2).toBe(false);
        });

        test("NOT inverts its condition", () => {
            const result = filterByValues<any>(
                { NOT: { iss: { eq: "https://evil.example.com" } } },
                {
                    iss: "https://idp.example.com",
                }
            );

            expect(result).toBe(true);

            const result2 = filterByValues<any>(
                { NOT: { iss: { eq: "https://evil.example.com" } } },
                {
                    iss: "https://evil.example.com",
                }
            );

            expect(result2).toBe(false);
        });
    });

    describe("jwt claims mapping", () => {
        test("maps where field names onto received claim paths", () => {
            const jwtClaims = new Map<string, string>([
                ["audience", "aud"],
                ["nestedClaim", "some.other.claim"],
            ]);

            const result = filterByValues<any>(
                { audience: { includes: "my-service" }, nestedClaim: { eq: "claim" } },
                { aud: ["my-service"], some: { other: { claim: "claim" } } },
                jwtClaims
            );

            expect(result).toBe(true);
        });

        test("returns false when a mapped claim is missing", () => {
            const jwtClaims = new Map<string, string>([["issuer", "iss"]]);

            const result = filterByValues<any>({ issuer: { eq: "https://idp.example.com" } }, {}, jwtClaims);

            expect(result).toBe(false);
        });
    });
});

/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { makeDirectiveNode } from "@graphql-tools/utils";
import type { DirectiveNode } from "graphql";
import { jwtClaim } from "../../../graphql/directives";
import { parseJWTClaimAnnotation } from "./jwt-claim-annotation";

describe("parseJWTClaimAnnotation", () => {
    test("should correctly parse jwtClaim path", () => {
        const directive: DirectiveNode = makeDirectiveNode("jwtClaim", { path: "jwtClaimPath" }, jwtClaim);
        const jwtClaimAnnotation = parseJWTClaimAnnotation(directive);

        expect(jwtClaimAnnotation.path).toBe("jwtClaimPath");
    });
});

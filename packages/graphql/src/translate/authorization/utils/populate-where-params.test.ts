/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Cypher from "@neo4j/cypher-builder";
import { ContextBuilder } from "../../../../tests/utils/builders/context-builder";
import type { Neo4jGraphQLTranslationContext } from "../../../types/neo4j-graphql-translation-context";
import { populateWhereParams } from "./populate-where-params";

describe("populateWhereParams", () => {
    let context: Neo4jGraphQLTranslationContext;
    let jwtParam: Cypher.Param;

    beforeAll(() => {
        const jwt = {
            sub: "1234",
            roles: ["user", "admin"],
            some: {
                other: {
                    claim: "claim",
                },
            },
        };

        jwtParam = new Cypher.Param(jwt);

        context = new ContextBuilder({
            authorization: {
                jwtParam,
                isAuthenticated: true,
                isAuthenticatedParam: new Cypher.Param(true),
            },
        }).instance();
    });

    test("populated simple $jwt with Cypher param", () => {
        const where = {
            id: "$jwt.sub",
        };

        expect(populateWhereParams({ where, context })).toEqual({
            id: jwtParam.property("sub"),
        });
    });

    test("populated object $jwt with Cypher param", () => {
        const where = {
            id: "$jwt.some.other.claim",
        };

        expect(populateWhereParams({ where, context })).toEqual({
            id: jwtParam.property("some", "other", "claim"),
        });
    });

    test("populated nested $jwt with Cypher param", () => {
        const where = {
            user: {
                id: "$jwt.sub",
            },
        };

        expect(populateWhereParams({ where, context })).toEqual({
            user: {
                id: jwtParam.property("sub"),
            },
        });
    });

    test("populated nested and array $jwt with Cypher param", () => {
        const where = {
            AND: [
                {
                    user: {
                        id: "$jwt.sub",
                    },
                },
                {
                    user: {
                        role_IN: "$jwt.roles",
                    },
                },
            ],
        };

        expect(populateWhereParams({ where, context })).toEqual({
            AND: [
                {
                    user: {
                        id: jwtParam.property("sub"),
                    },
                },
                {
                    user: {
                        role_IN: jwtParam.property("roles"),
                    },
                },
            ],
        });
    });

    test("populates deeply nested", () => {
        const where = {
            AND: [
                {
                    AND: [
                        {
                            AND: [
                                {
                                    user: {
                                        id: "$jwt.sub",
                                    },
                                },
                                {
                                    user: {
                                        role_IN: "$jwt.roles",
                                    },
                                },
                            ],
                        },
                        {
                            user: {
                                role_IN: "$jwt.roles",
                            },
                        },
                    ],
                },
                {
                    user: {
                        role_IN: "$jwt.roles",
                    },
                },
            ],
        };

        expect(populateWhereParams({ where, context })).toEqual({
            AND: [
                {
                    AND: [
                        {
                            AND: [
                                {
                                    user: {
                                        id: jwtParam.property("sub"),
                                    },
                                },
                                {
                                    user: {
                                        role_IN: jwtParam.property("roles"),
                                    },
                                },
                            ],
                        },
                        {
                            user: {
                                role_IN: jwtParam.property("roles"),
                            },
                        },
                    ],
                },
                {
                    user: {
                        role_IN: jwtParam.property("roles"),
                    },
                },
            ],
        });
    });
});

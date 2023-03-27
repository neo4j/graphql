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

import Cypher from "@neo4j/cypher-builder";
import { ContextBuilder } from "../../../../tests/utils/builders/context-builder";
import type { Context } from "../../../types";
import { populateWhereParams } from "./populate-where-params";

describe("populateWhereParams", () => {
    let context: Context;
    let authParam: Cypher.Param;

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

        authParam = new Cypher.Param(jwt);
        context = new ContextBuilder({ authParam }).instance();
    });

    test("populated simple $jwt with Cypher param", () => {
        const where = {
            id: "$jwt.sub",
        };

        expect(populateWhereParams({ where, context })).toEqual({
            id: authParam.property("sub"),
        });
    });

    test("populated object $jwt with Cypher param", () => {
        const where = {
            id: "$jwt.some.other.claim",
        };

        expect(populateWhereParams({ where, context })).toEqual({
            id: authParam.property("some.other.claim"),
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
                id: authParam.property("sub"),
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
                        id: authParam.property("sub"),
                    },
                },
                {
                    user: {
                        role_IN: authParam.property("roles"),
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
                                        id: authParam.property("sub"),
                                    },
                                },
                                {
                                    user: {
                                        role_IN: authParam.property("roles"),
                                    },
                                },
                            ],
                        },
                        {
                            user: {
                                role_IN: authParam.property("roles"),
                            },
                        },
                    ],
                },
                {
                    user: {
                        role_IN: authParam.property("roles"),
                    },
                },
            ],
        });
    });
});

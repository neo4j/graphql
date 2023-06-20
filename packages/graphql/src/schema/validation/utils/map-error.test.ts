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

import { astFromArg, astFromDirective } from "@graphql-tools/utils";
import type { GraphQLArgument } from "graphql";
import { GraphQLDirective, GraphQLError, GraphQLInt } from "graphql";
import { mapError } from "./map-error";
import { VALIDATION_ERROR_CODES } from "./validation-error-codes";

describe("mapError", () => {
    const d = new GraphQLDirective({ name: "MyDir", locations: [], args: { intArg: { type: GraphQLInt } } });
    const a = d.args[0] as GraphQLArgument;
    const directiveNode = astFromDirective(d);
    const argumentNode = astFromArg(a);

    describe("DirectiveArgumentOfCorrectType", () => {
        describe("<type> cannot represent non-<type> value", () => {
            test("Int", () => {
                const error = new GraphQLError(
                    'Invalid argument: filter, error: Int cannot represent non-integer value: ""',
                    {
                        nodes: [argumentNode, directiveNode],
                        extensions: { exception: { code: VALIDATION_ERROR_CODES.AUTHORIZATION } },
                    }
                );
                const mappedError = mapError(error);
                expect(mappedError).toHaveProperty("message");
                expect(mappedError.message).toBe(
                    "Invalid argument: filter, error: Int cannot represent non-integer value."
                );
            });
            test("Float", () => {
                const error = new GraphQLError(
                    "Invalid argument: filter, error: Float cannot represent non numeric value: false",
                    {
                        nodes: [argumentNode, directiveNode],
                        extensions: { exception: { code: VALIDATION_ERROR_CODES.AUTHORIZATION } },
                    }
                );
                const mappedError = mapError(error);
                expect(mappedError).toHaveProperty("message");
                expect(mappedError.message).toBe(
                    "Invalid argument: filter, error: Float cannot represent non numeric value."
                );
            });
            test("String", () => {
                const error = new GraphQLError(
                    "Invalid argument: filter, error: String cannot represent non string value: 2",
                    {
                        nodes: [argumentNode, directiveNode],
                        extensions: { exception: { code: VALIDATION_ERROR_CODES.AUTHORIZATION } },
                    }
                );
                const mappedError = mapError(error);
                expect(mappedError).toHaveProperty("message");
                expect(mappedError.message).toBe(
                    "Invalid argument: filter, error: String cannot represent non string value."
                );
            });
            test("Boolean", () => {
                const error = new GraphQLError(
                    "Invalid argument: filter, error: Boolean cannot represent non boolean value: 1",
                    {
                        nodes: [argumentNode, directiveNode],
                        extensions: { exception: { code: VALIDATION_ERROR_CODES.AUTHORIZATION } },
                    }
                );
                const mappedError = mapError(error);
                expect(mappedError).toHaveProperty("message");
                expect(mappedError.message).toBe(
                    "Invalid argument: filter, error: Boolean cannot represent non boolean value."
                );
            });
        });
        test("enum value does not exist in enum", () => {
            const error = new GraphQLError(
                'Invalid argument: filter, error: Value "CREATE" does not exist in "AuthorizationValidateOperation" enum.',
                {
                    nodes: [argumentNode, directiveNode],
                    extensions: { exception: { code: VALIDATION_ERROR_CODES.AUTHORIZATION } },
                }
            );
            const mappedError = mapError(error);
            expect(mappedError).toHaveProperty("message");
            expect(mappedError.message).toBe('Invalid argument: filter, error: Value "CREATE" does not exist in enum.');
        });

        describe("field is not defined by type", () => {
            test("JWTPayloadWhere", () => {
                const error = new GraphQLError(
                    'Invalid argument: filter, error: Field "wrongField" is not defined by type "JWTPayloadWhere". Did you mean "node"?',
                    {
                        nodes: [argumentNode, directiveNode],
                        extensions: { exception: { code: VALIDATION_ERROR_CODES.AUTHORIZATION } },
                    }
                );
                const mappedError = mapError(error);
                expect(mappedError).toHaveProperty("message");
                expect(mappedError.message).toBe(
                    'Invalid argument: filter, error: Field "wrongField" is not defined by type. Did you mean "node"?'
                );
            });
            test("UserWhere", () => {
                const error = new GraphQLError(
                    'Invalid argument: filter, error: Field "wrongField" is not defined by type "UserWhere".',
                    {
                        nodes: [argumentNode, directiveNode],
                        extensions: { exception: { code: VALIDATION_ERROR_CODES.AUTHORIZATION } },
                    }
                );
                const mappedError = mapError(error);
                expect(mappedError).toHaveProperty("message");
                expect(mappedError.message).toBe(
                    'Invalid argument: filter, error: Field "wrongField" is not defined by type.'
                );
            });
            test("UserAuthorizationFilterRule", () => {
                const error = new GraphQLError(
                    'Invalid argument: filter, error: Field "wrongField" is not defined by type "UserAuthorizationFilterRule".',
                    {
                        nodes: [argumentNode, directiveNode],
                        extensions: { exception: { code: VALIDATION_ERROR_CODES.AUTHORIZATION } },
                    }
                );
                const mappedError = mapError(error);
                expect(mappedError).toHaveProperty("message");
                expect(mappedError.message).toBe(
                    'Invalid argument: filter, error: Field "wrongField" is not defined by type.'
                );
            });
            test("UserAuthorizationWhere", () => {
                const error = new GraphQLError(
                    'Invalid argument: filter, error: Field "wrongField" is not defined by type "UserAuthorizationWhere". Did you mean "node"?',
                    {
                        nodes: [argumentNode, directiveNode],
                        extensions: { exception: { code: VALIDATION_ERROR_CODES.AUTHORIZATION } },
                    }
                );
                const mappedError = mapError(error);
                expect(mappedError).toHaveProperty("message");
                expect(mappedError.message).toBe(
                    'Invalid argument: filter, error: Field "wrongField" is not defined by type. Did you mean "node"?'
                );
            });
        });

        describe("field of required type was not provided", () => {
            test("JWTPayloadWhere", () => {
                const error = new GraphQLError(
                    'Invalid argument: filter, error: Field "nested" of required type "JWTPayloadWhere" was not provided.',
                    {
                        nodes: [argumentNode, directiveNode],
                        extensions: { exception: { code: VALIDATION_ERROR_CODES.AUTHORIZATION } },
                    }
                );
                const mappedError = mapError(error);
                expect(mappedError).toHaveProperty("message");
                expect(mappedError.message).toBe(
                    'Invalid argument: filter, error: Field "nested" of required type was not provided.'
                );
            });
            test("UserWhere", () => {
                const error = new GraphQLError(
                    'Invalid argument: filter, error: Field "nested" of required type "UserWhere" was not provided.',
                    {
                        nodes: [argumentNode, directiveNode],
                        extensions: { exception: { code: VALIDATION_ERROR_CODES.AUTHORIZATION } },
                    }
                );
                const mappedError = mapError(error);
                expect(mappedError).toHaveProperty("message");
                expect(mappedError.message).toBe(
                    'Invalid argument: filter, error: Field "nested" of required type was not provided.'
                );
            });
            test("UserAuthorizationFilterRule", () => {
                const error = new GraphQLError(
                    'Invalid argument: filter, error: Field "nested" of required type "UserAuthorizationFilterRule" was not provided.',
                    {
                        nodes: [argumentNode, directiveNode],
                        extensions: { exception: { code: VALIDATION_ERROR_CODES.AUTHORIZATION } },
                    }
                );
                const mappedError = mapError(error);
                expect(mappedError).toHaveProperty("message");
                expect(mappedError.message).toBe(
                    'Invalid argument: filter, error: Field "nested" of required type was not provided.'
                );
            });
            test("UserAuthorizationWhere", () => {
                const error = new GraphQLError(
                    'Invalid argument: filter, error: Field "nested" of required type "UserAuthorizationWhere" was not provided.',
                    {
                        nodes: [argumentNode, directiveNode],
                        extensions: { exception: { code: VALIDATION_ERROR_CODES.AUTHORIZATION } },
                    }
                );
                const mappedError = mapError(error);
                expect(mappedError).toHaveProperty("message");
                expect(mappedError.message).toBe(
                    'Invalid argument: filter, error: Field "nested" of required type was not provided.'
                );
            });
        });

        describe("expected type to be an object", () => {
            test("JWTPayloadWhere", () => {
                const error = new GraphQLError(
                    'Invalid argument: filter, error: Expected type "JWTPayloadWhere" to be an object.',
                    {
                        nodes: [argumentNode, directiveNode],
                        extensions: { exception: { code: VALIDATION_ERROR_CODES.AUTHORIZATION } },
                    }
                );
                const mappedError = mapError(error);
                expect(mappedError).toHaveProperty("message");
                expect(mappedError.message).toBe("Invalid argument: filter, error: Expected type to be an object.");
            });
            test("UserWhere", () => {
                const error = new GraphQLError(
                    'Invalid argument: filter, error: Expected type "UserWhere" to be an object.',
                    {
                        nodes: [argumentNode, directiveNode],
                        extensions: { exception: { code: VALIDATION_ERROR_CODES.AUTHORIZATION } },
                    }
                );
                const mappedError = mapError(error);
                expect(mappedError).toHaveProperty("message");
                expect(mappedError.message).toBe("Invalid argument: filter, error: Expected type to be an object.");
            });
            test("UserAuthorizationFilterRule", () => {
                const error = new GraphQLError(
                    'Invalid argument: filter, error: Expected type "UserAuthorizationFilterRule" to be an object.',
                    {
                        nodes: [argumentNode, directiveNode],
                        extensions: { exception: { code: VALIDATION_ERROR_CODES.AUTHORIZATION } },
                    }
                );
                const mappedError = mapError(error);
                expect(mappedError).toHaveProperty("message");
                expect(mappedError.message).toBe("Invalid argument: filter, error: Expected type to be an object.");
            });
            test("UserAuthorizationWhere", () => {
                const error = new GraphQLError(
                    'Invalid argument: filter, error: Expected type "UserAuthorizationWhere" to be an object.',
                    {
                        nodes: [argumentNode, directiveNode],
                        extensions: { exception: { code: VALIDATION_ERROR_CODES.AUTHORIZATION } },
                    }
                );
                const mappedError = mapError(error);
                expect(mappedError).toHaveProperty("message");
                expect(mappedError.message).toBe("Invalid argument: filter, error: Expected type to be an object.");
            });
        });
    });

    describe("KnownArgumentNamesOnDirectivesRule", () => {
        test("unknown argument on directive", () => {
            const error = new GraphQLError(
                'Unknown argument "wrongFilter" on directive "@UserAuthorization". Did you mean "filter"?',
                {
                    nodes: [argumentNode],
                }
            );
            const mappedError = mapError(error);
            expect(mappedError).toHaveProperty("message");
            expect(mappedError.message).toBe(
                'Unknown argument "wrongFilter" on directive "@authorization". Did you mean "filter"?'
            );
        });
    });

    describe("UniqueDirectivesPerLocationRule", () => {
        test("directive may not be used on INTERFACE", () => {
            const error = new GraphQLError('Directive "@MemberAuthorization" may not be used on INTERFACE.', {
                nodes: [argumentNode],
            });
            const mappedError = mapError(error);
            expect(mappedError).toHaveProperty("message");
            expect(mappedError.message).toBe('Directive "@authorization" may not be used on INTERFACE.');
        });
        test("directive can only be used once at this location", () => {
            const error = new GraphQLError(
                'The directive "@MemberAuthorization" can only be used once at this location',
                {
                    nodes: [argumentNode],
                }
            );
            const mappedError = mapError(error);
            expect(mappedError).toHaveProperty("message");
            expect(mappedError.message).toBe('The directive "@authorization" can only be used once at this location');
        });
    });
});

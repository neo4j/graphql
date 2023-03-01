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
import { ArgumentNode, DirectiveNode, Kind, ObjectFieldNode, ObjectTypeDefinitionNode, ObjectValueNode } from "graphql";
import { Neo4jGraphQLSchemaValidationError } from "../../classes";
import { LOGICAL_OPERATORS } from "../../constants";
import {
    AuthorizationAnnotation,
    AuthorizationFilterOperation,
    AuthorizationFilterRule,
    AuthorizationFilterRuleArguments,
    AuthorizationFilterRules,
    AuthorizationFilterRuleType,
    AuthorizationFilterRuleWhereArguments,
    getDefaultRuleOperations,
} from "../annotation/AuthorizationAnnotation";
import { getTypeNodeMetadata, TypeNodeMetadata, validateField } from "./filter";
import { parseArguments } from "./utils";

export function parseAuthorizationAnnotation(
    directive: DirectiveNode,
    typeDefinition: ObjectTypeDefinitionNode
): AuthorizationAnnotation {
    validateAuthorizationAnnotation(directive, typeDefinition);
    const { filter, filterSubscriptions, validate } = parseArguments(directive) as {
        filter?: Record<string, any>[];
        filterSubscriptions?: Record<string, any>[];
        validate?: { pre: Record<string, any>[]; post: Record<string, any>[] };
    };
    if (!filter && !filterSubscriptions && !validate) {
        throw new Neo4jGraphQLSchemaValidationError("one of filter/ filterSubscriptions/ validate required");
    }

    const filterRules = filter?.map(
        (rule) => new AuthorizationFilterRule({ ...rule, ruleType: AuthorizationFilterRules.filter })
    );
    const filterSubscriptionRules = filterSubscriptions?.map(
        (rule) => new AuthorizationFilterRule({ ...rule, ruleType: AuthorizationFilterRules.filterSubscription })
    );
    const validatePreRules = validate?.pre?.map(
        (rule) => new AuthorizationFilterRule({ ...rule, ruleType: AuthorizationFilterRules.validationPre })
    );
    const validatePostRules = validate?.post?.map(
        (rule) => new AuthorizationFilterRule({ ...rule, ruleType: AuthorizationFilterRules.validationPost })
    );

    return new AuthorizationAnnotation({
        filter: filterRules,
        filterSubscriptions: filterSubscriptionRules,
        validatePre: validatePreRules,
        validatePost: validatePostRules,
    });
}

function validateAuthorizationFilterRule(
    argument: ArgumentNode | ObjectFieldNode,
    typeDefinition: ObjectTypeDefinitionNode,
    ruleType: AuthorizationFilterRuleType
) {
    if (argument?.value.kind !== Kind.LIST) {
        throw new Neo4jGraphQLSchemaValidationError(`${argument.name.value} should be a List`);
    }
    if (argument?.value.values.find((v) => v.kind !== Kind.OBJECT)) {
        throw new Neo4jGraphQLSchemaValidationError(`${argument.name.value} rules should be objects`);
    }

    argument?.value.values.forEach((v) => {
        const value = v as ObjectValueNode;
        const operations = value.fields.find((f) => f.name.value === AuthorizationFilterRuleArguments.operations);
        if (operations) {
            if (operations.value.kind !== Kind.LIST) {
                throw new Neo4jGraphQLSchemaValidationError(
                    `${AuthorizationFilterRuleArguments.operations} should be a List`
                );
            }
            const possibleValues = getDefaultRuleOperations(ruleType);
            if (possibleValues) {
                operations.value.values.forEach((v) => {
                    if (v.kind !== Kind.ENUM) {
                        throw new Neo4jGraphQLSchemaValidationError(
                            `${AuthorizationFilterRuleArguments.operations} should be a List of values from the Enum`
                        );
                    }
                    if (!possibleValues.includes(v.value as AuthorizationFilterOperation)) {
                        throw new Neo4jGraphQLSchemaValidationError(`${v.value} operation is not allowed`);
                    }
                });
            }
        }
        const requireAuthentication = value.fields.find(
            (f) => f.name.value === AuthorizationFilterRuleArguments.requireAuthentication
        );
        if (requireAuthentication && requireAuthentication?.value.kind !== Kind.BOOLEAN) {
            throw new Neo4jGraphQLSchemaValidationError(
                `${AuthorizationFilterRuleArguments.requireAuthentication} should be a Boolean`
            );
        }
        const where = value.fields.find((f) => f.name.value === AuthorizationFilterRuleArguments.where);
        if (where) {
            if (where.value.kind !== Kind.OBJECT) {
                throw new Neo4jGraphQLSchemaValidationError(
                    `${AuthorizationFilterRuleArguments.where} should be an object`
                );
            }
            const nodeWhere = where.value.fields.find(
                (f) => f.name.value === AuthorizationFilterRuleWhereArguments.node
            );
            const jwtWhere = where.value.fields.find(
                (f) => f.name.value === AuthorizationFilterRuleWhereArguments.jwtPayload
            );
            if (!nodeWhere && !jwtWhere) {
                throw new Neo4jGraphQLSchemaValidationError(
                    `valid options in ${AuthorizationFilterRuleArguments.where} are: ${Object.keys(
                        AuthorizationFilterRuleWhereArguments
                    ).join(", ")}`
                );
            }
            if (nodeWhere) {
                // ... validate fields
                const typeFields = (typeDefinition.fields || []).reduce((acc, f) => {
                    acc[f.name.value] = getTypeNodeMetadata(f.type);
                    return acc;
                }, {}) as Record<string, TypeNodeMetadata>;

                const fieldValue = nodeWhere.value;
                if (fieldValue.kind !== Kind.OBJECT) {
                    throw new Neo4jGraphQLSchemaValidationError(`${nodeWhere.name.value} should be an object`);
                }

                if (
                    fieldValue.fields.length > 1 &&
                    fieldValue.fields.find((f) => (LOGICAL_OPERATORS as ReadonlyArray<unknown>).includes(f.name.value))
                ) {
                    throw new Neo4jGraphQLSchemaValidationError(`logical operators cannot be combined`);
                }
                fieldValue.fields.forEach((field) => validateField(field, nodeWhere, typeFields));
            }
        }
    });
}

function validateAuthorizationAnnotation(directive: DirectiveNode, typeDefinition: ObjectTypeDefinitionNode) {
    const dirArgs = directive.arguments;
    const filterBeforeValidation = dirArgs?.find((arg) => arg.name.value === "filter");
    if (filterBeforeValidation) {
        validateAuthorizationFilterRule(filterBeforeValidation, typeDefinition, AuthorizationFilterRules.filter);
    }
    const validateBeforeValidation = dirArgs?.find((arg) => arg.name.value === "validate");
    if (validateBeforeValidation) {
        if (validateBeforeValidation?.value.kind !== Kind.OBJECT) {
            throw new Neo4jGraphQLSchemaValidationError("validate should be an Object");
        }
        const validatePreFieldsBeforeValidation = validateBeforeValidation?.value.fields.find(
            (f) => f.name.value === "pre"
        );
        const validatePostFieldsBeforeValidation = validateBeforeValidation?.value.fields.find(
            (f) => f.name.value === "post"
        );
        if (!validatePreFieldsBeforeValidation && !validatePostFieldsBeforeValidation) {
            throw new Neo4jGraphQLSchemaValidationError("validate should contain `pre` or `post`");
        }
        if (validateBeforeValidation?.value.fields.find((f) => f.name.value !== "post" && f.name.value !== "pre")) {
            throw new Neo4jGraphQLSchemaValidationError("validate should only contain `pre` or `post`");
        }
        validatePreFieldsBeforeValidation &&
            validateAuthorizationFilterRule(
                validatePreFieldsBeforeValidation,
                typeDefinition,
                AuthorizationFilterRules.validationPre
            );
        validatePreFieldsBeforeValidation &&
            validateAuthorizationFilterRule(
                validatePreFieldsBeforeValidation,
                typeDefinition,
                AuthorizationFilterRules.validationPost
            );
    }
    const filterSubscriptionsBeforeValidation = dirArgs?.find((arg) => arg.name.value === "filterSubscriptions");
    if (filterSubscriptionsBeforeValidation) {
        validateAuthorizationFilterRule(
            filterSubscriptionsBeforeValidation,
            typeDefinition,
            AuthorizationFilterRules.filterSubscription
        );
    }
}

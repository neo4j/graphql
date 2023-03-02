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
import {
    ArgumentNode,
    BooleanValueNode,
    DirectiveNode,
    EnumValueNode,
    Kind,
    ListValueNode,
    ObjectFieldNode,
    ObjectTypeDefinitionNode,
    ObjectValueNode,
    ValueNode,
} from "graphql";
import { Neo4jGraphQLSchemaValidationError } from "../../classes";
import { LOGICAL_OPERATORS } from "../../constants";
import {
    AuthorizationAnnotation,
    AuthorizationAnnotationArguments,
    AuthorizationFilterOperation,
    AuthorizationFilterRule,
    AuthorizationFilterRuleArguments,
    AuthorizationFilterRules,
    AuthorizationFilterRuleType,
    AuthorizationFilterRuleWhereArguments,
    AuthorizationValidateFilterArguments,
    getDefaultRuleOperations,
} from "../annotation/AuthorizationAnnotation";
import { getTypeNodeMetadata, TypeNodeMetadata, validateField } from "./filter";
import { parseArguments } from "./utils";

export function parseAuthorizationAnnotation(
    directive: DirectiveNode,
    typeDefinition: ObjectTypeDefinitionNode
): AuthorizationAnnotation {
    validateAuthorizationAnnotation(directive, typeDefinition);
    const { filter, filterSubscriptions, validate, ...unrecognizedArguments } = parseArguments(directive) as {
        filter?: Record<string, any>[];
        filterSubscriptions?: Record<string, any>[];
        validate?: { pre: Record<string, any>[]; post: Record<string, any>[] };
    };
    if (!filter && !filterSubscriptions && !validate) {
        throw new Neo4jGraphQLSchemaValidationError(
            `@authorization requires at least one of ${Object.values(AuthorizationAnnotationArguments).join(
                ", "
            )} arguments`
        );
    }
    if (Object.keys(unrecognizedArguments).length) {
        throw new Neo4jGraphQLSchemaValidationError(
            `@authorization unrecognized arguments: ${Object.keys(unrecognizedArguments).join(", ")}`
        );
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

function validateAuthorizationAnnotation(directive: DirectiveNode, typeDefinition: ObjectTypeDefinitionNode) {
    const dirArgs = directive.arguments;
    if (!dirArgs) {
        throw new Neo4jGraphQLSchemaValidationError(
            `@authorization requires at least one of ${Object.values(AuthorizationAnnotationArguments).join(
                ", "
            )} arguments`
        );
    }
    const filterBeforeValidation = dirArgs.find((arg) => arg.name.value === AuthorizationAnnotationArguments.filter);
    if (filterBeforeValidation) {
        validateAuthorizationFilterRule(filterBeforeValidation, typeDefinition, AuthorizationFilterRules.filter);
    }
    const validateBeforeValidation = dirArgs.find(
        (arg) => arg.name.value === AuthorizationAnnotationArguments.validate
    );
    if (validateBeforeValidation) {
        if (
            !validateValueIsObjectKind(
                validateBeforeValidation.value,
                `${AuthorizationAnnotationArguments.validate} should be of type Object`
            )
        ) {
            return;
        }
        const validatePreFieldsBeforeValidation = validateBeforeValidation.value.fields.find(
            (f) => f.name.value === AuthorizationValidateFilterArguments.pre
        );
        const validatePostFieldsBeforeValidation = validateBeforeValidation.value.fields.find(
            (f) => f.name.value === AuthorizationValidateFilterArguments.post
        );
        if (!validatePreFieldsBeforeValidation && !validatePostFieldsBeforeValidation) {
            throw new Neo4jGraphQLSchemaValidationError(
                `${AuthorizationAnnotationArguments.validate} should contain one of ${Object.values(
                    AuthorizationValidateFilterArguments
                ).join(", ")}`
            );
        }
        const unknownArgument = validateBeforeValidation.value.fields.find(
            (f) =>
                f.name.value !== AuthorizationValidateFilterArguments.pre &&
                f.name.value !== AuthorizationValidateFilterArguments.post
        );
        if (unknownArgument) {
            throw new Neo4jGraphQLSchemaValidationError(
                `${AuthorizationAnnotationArguments.validate} unknown argument ${unknownArgument}`
            );
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
    const filterSubscriptionsBeforeValidation = dirArgs.find(
        (arg) => arg.name.value === AuthorizationAnnotationArguments.filterSubscriptions
    );
    if (filterSubscriptionsBeforeValidation) {
        validateAuthorizationFilterRule(
            filterSubscriptionsBeforeValidation,
            typeDefinition,
            AuthorizationFilterRules.filterSubscription
        );
    }
}

const ruleFieldsAccumulator: {
    operations: ObjectFieldNode | undefined;
    requireAuthentication: ObjectFieldNode | undefined;
    where: ObjectFieldNode | undefined;
} = {
    operations: undefined,
    requireAuthentication: undefined,
    where: undefined,
};
function validateAuthorizationFilterRule(
    argument: ArgumentNode | ObjectFieldNode,
    typeDefinition: ObjectTypeDefinitionNode,
    ruleType: AuthorizationFilterRuleType
) {
    const argumentValue = argument.value;
    if (!validateValueIsListKind(argumentValue, `${argument.name.value} should be a List`)) {
        return;
    }
    argumentValue.values.forEach((ruleArgument) => {
        if (!validateValueIsObjectKind(ruleArgument, `${argument.name.value} rules should be of type Object`)) {
            return;
        }
        const ruleFields = ruleArgument.fields.reduce((acc, f) => {
            if (f.name.value === AuthorizationFilterRuleArguments.operations) {
                acc.operations = f;
                return acc;
            }
            if (f.name.value === AuthorizationFilterRuleArguments.requireAuthentication) {
                acc.requireAuthentication = f;
                return acc;
            }
            if (f.name.value === AuthorizationFilterRuleArguments.where) {
                acc.where = f;
                return acc;
            }
            throw new Neo4jGraphQLSchemaValidationError(`@authorization unknown argument ${f.name.value}`);
        }, ruleFieldsAccumulator);
        if (!Object.keys(ruleFields).length) {
            throw new Neo4jGraphQLSchemaValidationError(
                `@authorization requires one of ${Object.values(AuthorizationFilterRuleArguments).join(", ")} arguments`
            );
        }
        const { operations, requireAuthentication, where } = ruleFields;
        if (operations) {
            validateOperationsArgument(operations, getDefaultRuleOperations(ruleType));
        }
        if (
            requireAuthentication &&
            !validateValueIsBooleanKind(
                requireAuthentication.value,
                `${AuthorizationFilterRuleArguments.requireAuthentication} should be of type Boolean`
            )
        ) {
            return;
        }
        if (where) {
            const typeFields = (typeDefinition.fields || []).reduce((acc, f) => {
                acc[f.name.value] = getTypeNodeMetadata(f.type);
                return acc;
            }, {}) as Record<string, TypeNodeMetadata>;
            validateWhereArgument(where, typeFields);
        }
    });
}

function validateOperationsArgument(
    operations: ObjectFieldNode,
    possibleValues: AuthorizationFilterOperation[] | undefined
) {
    const operationsFieldValue = operations.value;
    if (
        !validateValueIsListKind(
            operationsFieldValue,
            `${AuthorizationFilterRuleArguments.operations} should be a List`
        ) ||
        !possibleValues
    ) {
        return;
    }
    const operationsListValues = operationsFieldValue.values;
    operationsListValues.forEach((operationsListValue) => {
        if (
            !validateValueIsEnumKind(
                operationsListValue,
                `${AuthorizationFilterRuleArguments.operations} List values should be of type Enum value`
            )
        ) {
            return;
        }
        if (!possibleValues.includes(operationsListValue.value as AuthorizationFilterOperation)) {
            throw new Neo4jGraphQLSchemaValidationError(`${operationsListValue.value} operation is not allowed`);
        }
    });
}

function validateWhereArgument(where: ObjectFieldNode, typeFields: Record<string, TypeNodeMetadata>) {
    const whereFieldValue = where.value;
    if (
        !validateValueIsObjectKind(
            whereFieldValue,
            `${AuthorizationFilterRuleArguments.where} should be of type Object`
        )
    ) {
        return;
    }
    const nodeWhere = whereFieldValue.fields.find((f) => f.name.value === AuthorizationFilterRuleWhereArguments.node);
    const jwtWhere = whereFieldValue.fields.find(
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
        const fieldValue = nodeWhere.value;
        if (!validateValueIsObjectKind(fieldValue, `${nodeWhere.name.value} should be of type Object`)) {
            return;
        }
        if (
            fieldValue.fields.length > 1 &&
            fieldValue.fields.find((f) => (LOGICAL_OPERATORS as ReadonlyArray<unknown>).includes(f.name.value))
        ) {
            throw new Neo4jGraphQLSchemaValidationError(`logical operators cannot be combined`);
        }
        fieldValue.fields.forEach((field) => validateField(field, nodeWhere, typeFields));
    }
    if (jwtWhere) {
        // TODO: implement me
    }
}

function validateValueIsListKind(value: ValueNode, errorMessage: string): value is ListValueNode {
    if (value.kind !== Kind.LIST) {
        throw new Neo4jGraphQLSchemaValidationError(errorMessage);
    }
    return true;
}
function validateValueIsObjectKind(value: ValueNode, errorMessage: string): value is ObjectValueNode {
    if (value.kind !== Kind.OBJECT) {
        throw new Neo4jGraphQLSchemaValidationError(errorMessage);
    }
    return true;
}
function validateValueIsEnumKind(value: ValueNode, errorMessage: string): value is EnumValueNode {
    if (value.kind !== Kind.ENUM) {
        throw new Neo4jGraphQLSchemaValidationError(errorMessage);
    }
    return true;
}
function validateValueIsBooleanKind(value: ValueNode, errorMessage: string): value is BooleanValueNode {
    if (value.kind !== Kind.BOOLEAN) {
        throw new Neo4jGraphQLSchemaValidationError(errorMessage);
    }
    return true;
}

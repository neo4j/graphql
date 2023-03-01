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
    DirectiveNode,
    DocumentNode,
    FieldDefinitionNode,
    Kind,
    ListValueNode,
    NamedTypeNode,
    NonNullTypeNode,
    ObjectFieldNode,
    ObjectTypeDefinitionNode,
    ObjectValueNode,
    StringValueNode,
    TypeNode,
    UnionTypeDefinitionNode,
    ValueNode,
} from "graphql";
import { eq } from "semver";
import { LOGICAL_OPERATORS, SCALAR_TYPES } from "../constants";
import { getDefinitionNodes } from "../schema/get-definition-nodes";
import getFieldTypeMeta from "../schema/get-field-type-meta";
import { filterTruthy } from "../utils/utils";
import type { Annotation } from "./annotation/Annotation";
import {
    AuthorizationAnnotation,
    AuthorizationFilterOperation,
    AuthorizationFilterRule,
    AuthorizationFilterRuleArguments,
    AuthorizationFilterRules,
    AuthorizationFilterRuleType,
    AuthorizationFilterRuleWhereArguments,
    getDefaultRuleOperations,
} from "./annotation/AuthorizationAnnotation";
import { CypherAnnotation } from "./annotation/CypherAnnotation";
import { Attribute } from "./attribute/Attribute";
import { CompositeEntity } from "./entity/CompositeEntity";
import { ConcreteEntity } from "./entity/ConcreteEntity";
import { Neo4jGraphQLSchemaModel } from "./Neo4jGraphQLSchemaModel";

export function generateModel(document: DocumentNode): Neo4jGraphQLSchemaModel {
    const definitionNodes = getDefinitionNodes(document);

    //  Q: where to set interface fields?

    // const interfaceTypes = definitionNodes.interfaceTypes.map((entity) => ({
    //     name: entity.name.value,
    //     fields: entity.fields,
    // }));

    // init interface to typennames map
    const interfaceToImplementingTypeNamesMap = definitionNodes.interfaceTypes.reduce((acc, entity) => {
        const interfaceTypeName = entity.name.value;
        acc.set(interfaceTypeName, []);
        return acc;
    }, new Map<string, string[]>());

    // hydrate interface to typennames map
    definitionNodes.objectTypes.forEach((el) => {
        if (!el.interfaces) {
            return;
        }
        const objectTypeName = el.name.value;
        el.interfaces?.forEach((i) => {
            const interfaceTypeName = i.name.value;
            const before = interfaceToImplementingTypeNamesMap.get(interfaceTypeName);
            if (!before) {
                throw new Error(`Could not find composite entity with name ${interfaceTypeName}`);
            }
            interfaceToImplementingTypeNamesMap.set(interfaceTypeName, before.concat(objectTypeName));
        });
    });

    const concreteEntities = definitionNodes.objectTypes.map(generateConcreteEntity);
    const concreteEntitiesMap = concreteEntities.reduce((acc, entity) => {
        if (acc.has(entity.name)) {
            throw new Error(`Duplicate node ${entity.name}`);
        }
        acc.set(entity.name, entity);
        return acc;
    }, new Map<string, ConcreteEntity>());

    const interfaceEntities = Array.from(interfaceToImplementingTypeNamesMap.entries()).map(
        ([name, concreteEntities]) => {
            return generateCompositeEntity(name, concreteEntities, concreteEntitiesMap);
        }
    );
    const unionEntities = definitionNodes.unionTypes.map((entity) => {
        return generateCompositeEntity(
            entity.name.value,
            entity.types?.map((t) => t.name.value) || [],
            concreteEntitiesMap
        );
    });

    return new Neo4jGraphQLSchemaModel({
        compositeEntities: [...unionEntities, ...interfaceEntities],
        concreteEntities,
    });
}

function generateCompositeEntity(
    entityDefinitionName: string,
    entityImplementingTypeNames: string[],
    concreteEntities: Map<string, ConcreteEntity>
): CompositeEntity {
    const compositeFields = entityImplementingTypeNames.map((type) => {
        const concreteEntity = concreteEntities.get(type);
        if (!concreteEntity) {
            throw new Error(`Could not find concrete entity with name ${type}`);
        }
        return concreteEntity;
    });

    if (!compositeFields.length) {
        throw new Error(`Composite entity ${entityDefinitionName} has no concrete entities`);
    }
    // TODO: add annotations
    return new CompositeEntity({
        name: entityDefinitionName,
        concreteEntities: compositeFields,
    });
}

function generateConcreteEntity(definition: ObjectTypeDefinitionNode): ConcreteEntity {
    const fields = (definition.fields || []).map((fieldDefinition) => generateField(fieldDefinition, definition));
    const directives = (definition.directives || []).reduce((acc, directive) => {
        acc.set(directive.name.value, parseArguments(directive));
        return acc;
    }, new Map<string, Record<string, unknown>>());
    const labels = getLabels(definition, directives.get("node") || {});
    // TODO: add inheritedAnnotations from interfaces
    // const inheritedAnnotations = definition.interfaces?.map(i => i.)

    return new ConcreteEntity({
        name: definition.name.value,
        labels,
        attributes: filterTruthy(fields),
        annotations: createEntityAnnotation(definition.directives || [], definition),
    });
}

function getLabels(definition: ObjectTypeDefinitionNode, nodeDirectiveArguments: Record<string, unknown>): string[] {
    if ((nodeDirectiveArguments.labels as string[] | undefined)?.length) {
        return nodeDirectiveArguments.labels as string[];
    }
    return [definition.name.value];
}

function generateField(field: FieldDefinitionNode, typeDefinition: ObjectTypeDefinitionNode): Attribute | undefined {
    const typeMeta = getFieldTypeMeta(field.type); // TODO: without originalType
    if (SCALAR_TYPES.includes(typeMeta.name)) {
        const annotations = createFieldAnnotations(field.directives || [], typeDefinition);
        return new Attribute({
            name: field.name.value,
            annotations,
        });
    }
}

function createFieldAnnotations(
    directives: readonly DirectiveNode[],
    typeDefinition: ObjectTypeDefinitionNode
): Annotation[] {
    return filterTruthy(
        directives.map((directive) => {
            switch (directive.name.value) {
                case "cypher":
                    return parseCypherAnnotation(directive);
                case "authorization":
                    return parseAuthorizationAnnotation(directive, typeDefinition);
                default:
                    return undefined;
            }
        })
    );
}

function createEntityAnnotation(
    directives: readonly DirectiveNode[],
    typeDefinition: ObjectTypeDefinitionNode
): Annotation[] {
    return filterTruthy(
        directives.map((directive) => {
            switch (directive.name.value) {
                case "authorization":
                    return parseAuthorizationAnnotation(directive, typeDefinition);
                default:
                    return undefined;
            }
        })
    );
}

// ============= validation helpers
const NUMBER_KEY_OPERATORS = [...LOGICAL_OPERATORS, "equals", "in", "lt", "lte", "gt", "gte"] as const;
const STRING_KEY_OPERATORS = [
    ...LOGICAL_OPERATORS,
    "equals",
    "in",
    "matches",
    "contains",
    "startsWith",
    "endsWith",
] as const;
const LIST_KEY_OPERATORS = [...LOGICAL_OPERATORS, "includes", "equals"] as const;

export type NumberWhereOperator = typeof NUMBER_KEY_OPERATORS[number];
export type StringWhereOperator = typeof STRING_KEY_OPERATORS[number];
export type ListWhereOperator = typeof LIST_KEY_OPERATORS[number];
export type LogicalWhereOperator = typeof LOGICAL_OPERATORS[number];

const LOGICAL_WHERE_OPERATOR_ENTRIES = [
    ["OR", Kind.LIST],
    ["NOT", Kind.OBJECT],
    ["AND", Kind.LIST],
] as Array<[LogicalWhereOperator, GraphQLValueKind]>;

// TODO: variables?
type GraphQLValueKind =
    | Kind.STRING
    | Kind.INT
    | Kind.FLOAT
    | Kind.BOOLEAN
    | Kind.ENUM
    | Kind.NULL
    | Kind.LIST
    | Kind.OBJECT;

const FloatKindWhereMap = new Map<NumberWhereOperator, GraphQLValueKind>([
    ...LOGICAL_WHERE_OPERATOR_ENTRIES,
    ["equals", Kind.FLOAT],
    ["in", Kind.LIST],
    ["lt", Kind.FLOAT],
    ["lte", Kind.FLOAT],
    ["gt", Kind.FLOAT],
    ["gte", Kind.FLOAT],
]);

const IntKindWhereMap = new Map<NumberWhereOperator, GraphQLValueKind>([
    ...LOGICAL_WHERE_OPERATOR_ENTRIES,
    ["equals", Kind.INT],
    ["in", Kind.LIST],
    ["lt", Kind.INT],
    ["lte", Kind.INT],
    ["gt", Kind.INT],
    ["gte", Kind.INT],
]);

const StringKindWhereMap = new Map<StringWhereOperator, GraphQLValueKind>([
    ...LOGICAL_WHERE_OPERATOR_ENTRIES,
    ["equals", Kind.STRING],
    ["in", Kind.LIST],
    ["matches", Kind.STRING],
    ["contains", Kind.STRING],
    ["startsWith", Kind.STRING],
    ["endsWith", Kind.STRING],
]);

const getListKindWhereMap = (kind: GraphQLValueKind) =>
    new Map<ListWhereOperator, GraphQLValueKind>([
        ...LOGICAL_WHERE_OPERATOR_ENTRIES,
        ["includes", kind],
        ["equals", Kind.LIST],
    ]);

function validateListWhere(whereField: ObjectFieldNode) {
    const operatorName = whereField.name.value;
    const operatorKind = getListKindWhereMap(whereField.value.kind as GraphQLValueKind).get(
        operatorName as ListWhereOperator
    );
    if (!operatorKind) {
        throw new Error(`${operatorName} is not supported on List fields`);
    }
    const doValueTypesMatch = whereField.value.kind === operatorKind;
    if (!doValueTypesMatch) {
        throw new Error(`unexpected type for ${operatorName}`);
    }
    if ((LOGICAL_OPERATORS as ReadonlyArray<unknown>).includes(operatorName)) {
        if (operatorName === "NOT") {
            (whereField.value as ObjectValueNode).fields.forEach(validateListWhere);
        } else {
            (whereField.value as ListValueNode).values.map((v) =>
                (v as ObjectValueNode).fields.forEach(validateListWhere)
            );
        }
    }
    return undefined;
}

function validateIntField(whereField: ObjectFieldNode) {
    const operatorName = whereField.name.value;
    const operatorKind = IntKindWhereMap.get(operatorName as NumberWhereOperator);
    if (!operatorKind) {
        throw new Error(`${operatorName} is not supported on Int fields`);
    }
    const doValueTypesMatch = whereField.value.kind === operatorKind;
    if (!doValueTypesMatch) {
        throw new Error(`unexpected type for ${operatorName}`);
    }
    if ((LOGICAL_OPERATORS as ReadonlyArray<unknown>).includes(operatorName)) {
        if (operatorName === "NOT") {
            (whereField.value as ObjectValueNode).fields.forEach(validateIntField);
        } else {
            (whereField.value as ListValueNode).values.map((v) =>
                (v as ObjectValueNode).fields.forEach(validateIntField)
            );
        }
    }
}

function validateFloatField(whereField: ObjectFieldNode) {
    const operatorName = whereField.name.value;
    const operatorKind = FloatKindWhereMap.get(operatorName as NumberWhereOperator);
    if (!operatorKind) {
        throw new Error(`${operatorName} is not supported on Float fields`);
    }
    const doValueTypesMatch = whereField.value.kind === operatorKind;
    if (!doValueTypesMatch) {
        throw new Error(`unexpected type for ${operatorName}`);
    }
    if ((LOGICAL_OPERATORS as ReadonlyArray<unknown>).includes(operatorName)) {
        if (operatorName === "NOT") {
            (whereField.value as ObjectValueNode).fields.forEach(validateFloatField);
        } else {
            (whereField.value as ListValueNode).values.map((v) =>
                (v as ObjectValueNode).fields.forEach(validateFloatField)
            );
        }
    }
}

function validateStringField(whereField: ObjectFieldNode) {
    const operatorName = whereField.name.value;
    const operatorKind = StringKindWhereMap.get(operatorName as StringWhereOperator);
    if (!operatorKind) {
        throw new Error(`${operatorName} is not supported on String fields`);
    }
    const doValueTypesMatch = whereField.value.kind === operatorKind;
    if (!doValueTypesMatch) {
        throw new Error(`unexpected type for ${operatorName}`);
    }
    if ((LOGICAL_OPERATORS as ReadonlyArray<unknown>).includes(operatorName)) {
        if (operatorName === "NOT") {
            (whereField.value as ObjectValueNode).fields.forEach(validateStringField);
        } else {
            (whereField.value as ListValueNode).values.map((v) =>
                (v as ObjectValueNode).fields.forEach(validateStringField)
            );
        }
    }
}

function validateNumberWhere(whereField: ObjectFieldNode, graphQLFieldType: GraphQLFieldType) {
    if (whereField.kind !== Kind.OBJECT_FIELD) {
        throw new Error("String filter should be of type Object");
    }
    if (graphQLFieldType.isList) {
        validateListWhere(whereField);
    }
    if (graphQLFieldType.type === "Float") {
        (whereField.value as ObjectValueNode).fields.forEach(validateFloatField);
    }
    if (graphQLFieldType.type === "Int") {
        (whereField.value as ObjectValueNode).fields.forEach(validateIntField);
    }
}

function validateStringWhere(whereField: ObjectFieldNode, graphQLFieldType: GraphQLFieldType) {
    if (whereField.kind !== Kind.OBJECT_FIELD) {
        throw new Error("String filter should be of type Object");
    }
    (whereField.value as ObjectValueNode).fields.forEach(validateStringField);
    if (graphQLFieldType.isList) {
        validateListWhere(whereField);
    }
}

// TODO:
// Maybe booleans value should not be part of the generic operators refactor
function validateBooleanWhere(whereField: ObjectFieldNode, graphQLFieldType: GraphQLFieldType) {
    if (graphQLFieldType.isList) {
        throw new Error(
            `Field ${whereField.name.value} is not supported, the library does not support array filters for type Boolean`
        );
    }
}

// TODO:
function validateObjectWhere(whereField: ObjectFieldNode, graphQLFieldType: GraphQLFieldType) {
    if (whereField.kind !== Kind.OBJECT_FIELD) {
        throw new Error("String filter should be of type Object");
    }
    if (graphQLFieldType.isList) {
        // 1..n relationship filters
    }
    // 1..1 relationship filter
}

function validateWhereField(whereField: ObjectFieldNode, graphQLFieldType: GraphQLFieldType) {
    switch (graphQLFieldType.type) {
        case "Int":
        case "Float":
            validateNumberWhere(whereField, graphQLFieldType);
            break;
        case "ID":
        case "String":
            validateStringWhere(whereField, graphQLFieldType);
            break;
        case "Boolean":
            validateBooleanWhere(whereField, graphQLFieldType);
            break;
        default:
            // TODO: This could be or an Enum type or an Object type
            validateObjectWhere(whereField, graphQLFieldType);
            break;
    }
}

function validateAllFields(typeFields: Record<string, GraphQLFieldType>, field: ObjectFieldNode) {
    const fieldValue = field.value;
    console.log(">", JSON.stringify(field, null, 2));
    if (fieldValue.kind !== Kind.OBJECT) {
        throw new Error(`${field.name.value} should be an object`);
    }

    if (
        fieldValue.fields.length > 1 &&
        fieldValue.fields.find((f) => (LOGICAL_OPERATORS as ReadonlyArray<unknown>).includes(f.name.value))
    ) {
        throw new Error(`logical operators cannot be combined`);
    }

    // console.log(JSON.stringify(fieldValue.fields, null, 2));

    fieldValue.fields.forEach((innerField) => {
        const isLogicalOperator = (LOGICAL_OPERATORS as ReadonlyArray<unknown>).includes(innerField.name.value);
        const ifTypeField = typeFields[innerField.name.value];

        if (!isLogicalOperator && !ifTypeField) {
            throw new Error(`unknown field ${innerField.name.value} in ${field.name.value}`);
        }
        if (isLogicalOperator) {
            if (innerField.name.value === "NOT") {
                validateAllFields(typeFields, innerField);
            } else {
                if (innerField.value.kind !== Kind.LIST) {
                    throw new Error(`${innerField.name.value} should be of type List`);
                }
                innerField.value.values
                    .map((v) => (v as ObjectValueNode).fields)
                    .flat()
                    .forEach((listInnerField) => validateAllFields(typeFields, listInnerField));
            }
        } else {
            validateWhereField(innerField, typeFields[innerField.name.value]);
        }
    });
}

function validateAuthorizationFilterRule(
    argument: ArgumentNode | ObjectFieldNode,
    typeDefinition: ObjectTypeDefinitionNode,
    ruleType: AuthorizationFilterRuleType
) {
    if (argument?.value.kind !== Kind.LIST) {
        throw new Error(`${argument.name.value} should be a List`);
    }
    if (argument?.value.values.find((v) => v.kind !== Kind.OBJECT)) {
        throw new Error(`${argument.name.value} rules should be objects`);
    }

    argument?.value.values.forEach((v) => {
        const value = v as ObjectValueNode;
        // console.log("value", JSON.stringify(value, null, 2));
        const operations = value.fields.find((f) => f.name.value === AuthorizationFilterRuleArguments.operations);
        // console.log("op", JSON.stringify(operations, null, 2));
        if (operations) {
            if (operations.value.kind !== Kind.LIST) {
                throw new Error("operations should be a List");
            }
            const possibleValues = getDefaultRuleOperations(ruleType);
            if (possibleValues) {
                operations.value.values.forEach((v) => {
                    if (v.kind !== Kind.ENUM) {
                        throw new Error("operations should be a List of values from the Enum");
                    }
                    if (!possibleValues.includes(v.value as AuthorizationFilterOperation)) {
                        throw new Error(`${v.value} operation is not allowed`);
                    }
                });
            }
        }
        const requireAuthentication = value.fields.find(
            (f) => f.name.value === AuthorizationFilterRuleArguments.requireAuthentication
        );
        if (requireAuthentication && requireAuthentication?.value.kind !== Kind.BOOLEAN) {
            throw new Error("requireAuthentication should be a Boolean");
        }
        const where = value.fields.find((f) => f.name.value === AuthorizationFilterRuleArguments.where);
        if (where) {
            if (where.value.kind !== Kind.OBJECT) {
                throw new Error("where should be an object");
            }
            const nodeWhere = where.value.fields.find(
                (f) => f.name.value === AuthorizationFilterRuleWhereArguments.node
            );
            const jwtWhere = where.value.fields.find(
                (f) => f.name.value === AuthorizationFilterRuleWhereArguments.jwtPayload
            );
            if (!nodeWhere && !jwtWhere) {
                throw new Error("where should contain `node` or `jwtPayload`");
            }
            if (nodeWhere) {
                // ... validate fields
                const typeFields = (typeDefinition.fields || []).reduce((acc, f) => {
                    acc[f.name.value] = getGraphQLFieldTypeFromTypeNode(f.type);
                    return acc;
                }, {}) as Record<string, GraphQLFieldType>;
                validateAllFields(typeFields, nodeWhere);
            }
        }
    });
}

interface GraphQLFieldType {
    type: string;
    isNullable: boolean;
    isList: boolean;
}

function getGraphQLFieldTypeFromTypeNode(type: TypeNode): GraphQLFieldType {
    switch (type.kind) {
        case Kind.NAMED_TYPE:
            return {
                type: type.name.value,
                isNullable: true,
                isList: false,
            };
        case Kind.LIST_TYPE:
            return {
                type: getGraphQLFieldTypeFromTypeNode(type.type).type,
                isNullable: true,
                isList: true,
            };
        case Kind.NON_NULL_TYPE: {
            const nestedType = getGraphQLFieldTypeFromTypeNode(type.type);
            return {
                type: nestedType.type,
                isNullable: false,
                isList: nestedType.isList,
            };
        }
    }
}

// ============ real authorization stuff from this point

function validateAuthorizationAnnotation(directive: DirectiveNode, typeDefinition: ObjectTypeDefinitionNode) {
    const dirArgs = directive.arguments;
    const filterBeforeValidation = dirArgs?.find((arg) => arg.name.value === "filter");
    if (filterBeforeValidation) {
        validateAuthorizationFilterRule(filterBeforeValidation, typeDefinition, AuthorizationFilterRules.filter);
    }
    const validateBeforeValidation = dirArgs?.find((arg) => arg.name.value === "validate");
    if (validateBeforeValidation) {
        if (validateBeforeValidation?.value.kind !== Kind.OBJECT) {
            throw new Error("validate should be an Object");
        }
        const validatePreFieldsBeforeValidation = validateBeforeValidation?.value.fields.find(
            (f) => f.name.value === "pre"
        );
        const validatePostFieldsBeforeValidation = validateBeforeValidation?.value.fields.find(
            (f) => f.name.value === "post"
        );
        if (!validatePreFieldsBeforeValidation && !validatePostFieldsBeforeValidation) {
            throw new Error("validate should contain `pre` or `post`");
        }
        if (validateBeforeValidation?.value.fields.find((f) => f.name.value !== "post" && f.name.value !== "pre")) {
            throw new Error("validate should only contain `pre` or `post`");
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

function parseAuthorizationAnnotation(
    directive: DirectiveNode,
    typeDefinition: ObjectTypeDefinitionNode
): AuthorizationAnnotation {
    validateAuthorizationAnnotation(directive, typeDefinition);
    const { filter, filterSubscriptions, validate } = parseArguments(directive) as {
        filter?: Record<string, any>[];
        filterSubscriptions?: Record<string, any>[];
        validate?: { pre: Record<string, any>[]; post: Record<string, any>[] };
    };
    // TODO: validate further than  Record<string, any>
    if (!filter && !filterSubscriptions && !validate) {
        throw new Error("one of filter/ filterSubscriptions/ validate required");
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

function parseCypherAnnotation(directive: DirectiveNode): CypherAnnotation {
    const { statement } = parseArguments(directive);
    if (!statement || typeof statement !== "string") {
        throw new Error("@cypher statement required");
    }
    return new CypherAnnotation({
        statement: statement,
    });
}

function parseArguments(directive: DirectiveNode): Record<string, unknown> {
    return (directive.arguments || [])?.reduce((acc, argument) => {
        acc[argument.name.value] = getArgumentValueByType(argument.value);
        return acc;
    }, {});
}

function getArgumentValueByType(argumentValue: ValueNode): unknown {
    switch (argumentValue.kind) {
        case Kind.STRING:
        case Kind.INT:
        case Kind.FLOAT:
        case Kind.BOOLEAN:
        case Kind.ENUM:
            return argumentValue.value;
        case Kind.NULL:
            return null;
        case Kind.LIST:
            return argumentValue.values.map((v) => getArgumentValueByType(v));
        case Kind.OBJECT: {
            return argumentValue.fields.reduce((acc, field) => {
                acc[field.name.value] = getArgumentValueByType(field.value);
                return acc;
            }, {});
        }
    }
}

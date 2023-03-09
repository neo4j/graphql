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

import { mergeSchemas } from "@graphql-tools/schema";
import type { Maybe } from "@graphql-tools/utils";
import {
    buildASTSchema,
    buildSchema,
    ConstDirectiveNode,
    DefinitionNode,
    DirectiveLocation,
    DocumentNode,
    ExecutableDefinitionsRule,
    execute,
    extendSchema,
    FieldsOnCorrectTypeRule,
    FragmentsOnCompositeTypesRule,
    GraphQLBoolean,
    GraphQLDirective,
    GraphQLEnumType,
    GraphQLError,
    GraphQLInputObjectType,
    GraphQLList,
    GraphQLNamedType,
    GraphQLNonNull,
    GraphQLSchema,
    GraphQLString,
    InputObjectTypeDefinitionNode,
    Kind,
    KnownArgumentNamesRule,
    KnownDirectivesRule,
    KnownFragmentNamesRule,
    KnownTypeNamesRule,
    LoneAnonymousOperationRule,
    NoFragmentCyclesRule,
    NoUndefinedVariablesRule,
    NoUnusedFragmentsRule,
    NoUnusedVariablesRule,
    ObjectTypeDefinitionNode,
    OverlappingFieldsCanBeMergedRule,
    parse,
    PossibleFragmentSpreadsRule,
    printSchema,
    ProvidedRequiredArgumentsRule,
    ScalarLeafsRule,
    SingleFieldSubscriptionsRule,
    typeFromAST,
    TypeInfo,
    UniqueArgumentNamesRule,
    UniqueDirectivesPerLocationRule,
    UniqueFragmentNamesRule,
    UniqueInputFieldNamesRule,
    UniqueOperationNamesRule,
    UniqueVariableNamesRule,
    validate,
    validateSchema,
    ValuesOfCorrectTypeRule,
    VariablesAreInputTypesRule,
    VariablesInAllowedPositionRule,
    visit,
    visitInParallel,
} from "graphql";
import { specifiedRules, specifiedSDLRules } from "graphql/validation/specifiedRules";
import {
    ASTValidationContext,
    SDLValidationContext,
    SDLValidationRule,
    ValidationContext,
    ValidationRule,
} from "graphql/validation/ValidationContext";

const directives: GraphQLDirective[] = [];
const types: GraphQLNamedType[] = [];

function makeAuthorizationTypesForTypename(typename: string, augmentendSchema: GraphQLSchema) {
    const type = augmentendSchema.getType(`${typename}Where`);

    const authorizationWhere = new GraphQLInputObjectType({
        name: `${typename}AuthorizationWhere`,
        fields() {
            return {
                AND: {
                    type: new GraphQLList(authorizationWhere),
                },
                OR: {
                    type: new GraphQLList(authorizationWhere),
                },
                NOT: {
                    type: authorizationWhere,
                },
                node: {
                    type: type as GraphQLInputObjectType,
                },
            };
        },
    });

    const authorizationFilterRule = new GraphQLInputObjectType({
        name: `${typename}AuthorizationFilterRule`,
        fields() {
            return {
                // operations: {
                //     type: new GraphQLEnumType(authorizationWhere),
                // },
                requireAuthentication: {
                    type: GraphQLBoolean,
                    // defaultValue: true,
                },
                where: {
                    type: authorizationWhere,
                },
            };
        },
    });

    const authorizationValidateRule = new GraphQLInputObjectType({
        name: `${typename}AuthorizationValidateRule`,
        fields() {
            return {
                // before: {
                //     type: new GraphQLEnumType(authorizationWhere),
                // },
                // after: {
                //     type: new GraphQLEnumType(authorizationWhere),
                // },
                requireAuthentication: {
                    type: GraphQLBoolean,
                    // defaultValue: true,
                },
                where: {
                    type: authorizationWhere,
                },
            };
        },
    });
    const authorizationDirective = new GraphQLDirective({
        name: `${typename}Authorization`,
        locations: [DirectiveLocation.FIELD_DEFINITION, DirectiveLocation.OBJECT, DirectiveLocation.INTERFACE],
        args: {
            filter: {
                description: "The name of the Neo4j property",
                type: new GraphQLNonNull(new GraphQLList(authorizationFilterRule)),
            },
            validate: {
                description: "validate",
                type: new GraphQLList(authorizationValidateRule),
            },
        },
    });
    types.push(authorizationWhere);
    types.push(authorizationFilterRule);
    types.push(authorizationValidateRule);
    directives.push(authorizationDirective);
}
/**
 *  userDocument: DocumentNode
 *  augmentedDocument: DocumentNode
 *  augmentedSchema: GraphlQLSchema
 *  schemaToExtend: GraphQLSchema
 *  validationSchema: GraphQLSchema (merge betweem schemaToExtend and augmentedSchema)
 *  validationDocument: DocumentNode
 *  finalDocument: DocumentNode
 *  */

function getUserAuthDefinition(userDocument, augmentedDefinition) {
    const authDirectivePredicate = (directive) => directive.name.value === "authorization";
    return userDocument.definitions.find(
        (userDefinition) =>
            userDefinition.kind === Kind.OBJECT_TYPE_DEFINITION &&
            augmentedDefinition.name.value === userDefinition.name.value &&
            userDefinition.directives?.find(authDirectivePredicate)
    ) as ObjectTypeDefinitionNode;
}
export function makeValidationSchema(userDocument: DocumentNode, augmentedDocument: DocumentNode) {
    const augmentendSchema = buildASTSchema(augmentedDocument, { assumeValid: true });

    augmentedDocument.definitions.forEach((definition) => {
        switch (definition.kind) {
            case Kind.OBJECT_TYPE_DEFINITION: {
                const typeName = definition.name.value;
                const authDirective = getUserAuthDefinition(userDocument, definition);
                if (authDirective) {
                    makeAuthorizationTypesForTypename(typeName, augmentendSchema);
                }
            }
            // TODO: implement these as well
            // case Kind.FIELD_DEFINITION:
            // case Kind.INTERFACE_TYPE_DEFINITION:
        }
    });

    const schemaToExtend = new GraphQLSchema({
        directives,
        types,
    });
    const validationSchema = mergeSchemas({
        schemas: [augmentendSchema, schemaToExtend],
        assumeValidSDL: true,
    });
    const validationDocument = parse(printSchema(validationSchema)); // find a better way to obtain a DocumentNode from a GraphQLSchema
    const finalDocument: DocumentNode = {
        ...validationDocument,
        definitions: validationDocument.definitions.reduce((acc, definition: DefinitionNode) => {
            switch (definition.kind) {
                case Kind.OBJECT_TYPE_DEFINITION: {
                    const userDocumentObjectType = getUserAuthDefinition(userDocument, definition);
                    if (userDocumentObjectType) {
                        const userAuthUsage = userDocumentObjectType.directives?.find(
                            (directive) => directive.name.value === "authorization"
                        ) as ConstDirectiveNode;
                        const newAuthUsage: ConstDirectiveNode = {
                            ...userAuthUsage,
                            name: {
                                kind: Kind.NAME,
                                value: `${userDocumentObjectType.name.value}Authorization`,
                            },
                        };
                        acc.push({
                            ...definition,
                            directives: [newAuthUsage],
                        });
                        return acc;
                    }
                    acc.push(definition);
                    return acc;
                }
                // TODO: implement these as well
                // case Kind.FIELD_DEFINITION:
                // case Kind.INTERFACE_TYPE_DEFINITION:
                default:
                    acc.push(definition);
                    return acc;
            }
        }, [] as DefinitionNode[]),
    };

    const errors = validateSDL(finalDocument, validationSchema);
    console.log(`Errors: ${errors}`);
}

function validateSDL(
    documentAST: DocumentNode,
    schema: GraphQLSchema,
    rules: ReadonlyArray<SDLValidationRule> = specifiedSDLRules
): ReadonlyArray<GraphQLError> {
    const errors: Array<GraphQLError> = [];
    const context = new SDLValidationContext(documentAST, null, (error) => {
        errors.push(error);
    });
    const validationContext = new ValidationContext(schema, documentAST, new TypeInfo(schema), (error) => {
        errors.push(error);
    });
    const sdlVisitors = rules.map((rule) => rule(context));
    /* const astVisitors = specifiedRules.map(rule => rule(validationContext)); Non SDL Rules..*/
    /* const myListOfRules = 
    [
        ExecutableDefinitionsRule,
        UniqueOperationNamesRule,
        LoneAnonymousOperationRule,
        SingleFieldSubscriptionsRule,
        KnownTypeNamesRule,
        FragmentsOnCompositeTypesRule,
        VariablesAreInputTypesRule,
        ScalarLeafsRule,
        FieldsOnCorrectTypeRule,
        UniqueFragmentNamesRule,
        KnownFragmentNamesRule,
        NoUnusedFragmentsRule,
        PossibleFragmentSpreadsRule,
        NoFragmentCyclesRule,
        UniqueVariableNamesRule,
        NoUndefinedVariablesRule,
        NoUnusedVariablesRule,
        KnownDirectivesRule,
        UniqueDirectivesPerLocationRule,
        KnownArgumentNamesRule,
        UniqueArgumentNamesRule,
        ValuesOfCorrectTypeRule,
        ProvidedRequiredArgumentsRule,
        VariablesInAllowedPositionRule,
        OverlappingFieldsCanBeMergedRule,
        UniqueInputFieldNamesRule,
      ];
 */
    const myListOfRules = [KnownDirectivesRule];
    const myCustomRulesVisitors = myListOfRules.map((rule) => rule(validationContext));
    const visitors = [...sdlVisitors, ...myCustomRulesVisitors];
    visit(documentAST, visitInParallel(visitors));
    return errors;
}

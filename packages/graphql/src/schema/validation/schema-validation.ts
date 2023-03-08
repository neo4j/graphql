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
    DefinitionNode,
    DirectiveLocation,
    DocumentNode,
    execute,
    extendSchema,
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
    ObjectTypeDefinitionNode,
    parse,
    printSchema,
    typeFromAST,
    validate,
    validateSchema,
    visit,
    visitInParallel,
} from "graphql";
import { specifiedRules, specifiedSDLRules } from "graphql/validation/specifiedRules";
import { SDLValidationContext, SDLValidationRule, ValidationContext, ValidationRule } from "graphql/validation/ValidationContext";

const directives: GraphQLDirective[] = [];
const types: GraphQLNamedType[] = [];

export function makeValidationSchema(userDocument: DocumentNode, augmentedDocument: DocumentNode) {
    // const validateBeforeTC = composer.createEnumTC(
    //     `enum AuthorizationValidateBefore { READ, CREATE, UPDATE, DELETE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP }`
    // );
    // const validateAfterTC = composer.createEnumTC(
    //     `enum AuthorizationValidateAfter { CREATE, UPDATE, DELETE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP }`
    // );
    // const filterTC = composer.createEnumTC(
    //     `enum AuthorizationFilterOperation { READ, UPDATE, DELETE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP }`
    // );
    const augmentendSchema = buildASTSchema(augmentedDocument, { assumeValid: true });
    const userSchema = buildASTSchema(userDocument, { assumeValid: true });
    const authedTypeNames: string[] = [];
    const enhancedDefinitions = augmentedDocument.definitions.reduce((acc, definition) => {
        switch (definition.kind) {
            case Kind.OBJECT_TYPE_DEFINITION: {
                const typeName = definition.name.value;
                const authDirectivePredicate = (directive) => directive.name.value === "authorization";
                const authDirective = userSchema.getType(typeName)?.astNode?.directives?.find(authDirectivePredicate);
                if (!authDirective) {
                    acc.push(definition);
                    return acc;
                }
                //makeAuthorizationTypesForTypename(typeName, augmentendSchema);
                authedTypeNames.push(typeName);
                /*       acc.push({
                    ...definition,
                    directives: [
                        // TODO: augmentedSchema does not remove the @authorization
                        {
                            ...authDirective,
                            name: { value: `${typeName}Authorization`, kind: authDirective.name.kind },
                        },
                    ],
                }); */
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
    }, [] as DefinitionNode[]);

    authedTypeNames.forEach((typeName) => makeAuthorizationTypesForTypename(typeName, augmentendSchema));
    const enhancedAugmentedDocument: DocumentNode = { ...augmentedDocument, definitions: enhancedDefinitions };
    const enhancedAugmentedSchema = buildASTSchema(enhancedAugmentedDocument, { assumeValid: true });
    const schemaToExtend = new GraphQLSchema({
        directives,
        types,
    });
    const validatationSchema = mergeSchemas({
        schemas: [enhancedAugmentedSchema, schemaToExtend],
        assumeValidSDL: true,
    });
    // console.log(">type?validation>", validatationSchema.getType("Post"));

    // console.log("validate start", printSchema(validatationSchema));
    // const errors = validate(validatationSchema, userDocument);
    //const errors = validate(validatationSchema, parse(`{ posts { author { name } } }`));
    const newDocument = parse(printSchema(validatationSchema));
    const authedDefinitions = authedTypeNames.map((type) => {
        const authType = newDocument.definitions.find(
            (definition) => definition.kind === Kind.OBJECT_TYPE_DEFINITION && definition.name.value === type
        ) as ObjectTypeDefinitionNode;
        const authDirective = newDocument.definitions.find(
            (definition) =>
                definition.kind === Kind.DIRECTIVE_DEFINITION && definition.name.value === `${type}Authorization`
        );
        const authUsage = {
            ...authDirective,
            kind: Kind.DIRECTIVE,
        }
        const directives = authType.directives ? [...authType.directives, authUsage] : [authUsage];
        return {
            ...authType,
            directives,
        };
    });
    const definitionsWithoutAuthedNodes = newDocument.definitions.filter(
        (definition) =>
            definition.kind !== Kind.OBJECT_TYPE_DEFINITION ||
            (definition.kind === Kind.OBJECT_TYPE_DEFINITION && !authedTypeNames.includes(definition.name.value))
    );

    const finalDocument = {
        ...newDocument,
        definitions: [...definitionsWithoutAuthedNodes, ...authedDefinitions],
    } as DocumentNode;
    
    const errors2 = validateSDL(finalDocument);

    const errors = validateSchema(validatationSchema);
    //console.log("validate end", errors);
    console.log(`New error: ${errors2}`);
}

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
    /*    const definitions = [
        authorizationDirective,
        authorizationWhere,
        authorizationFilterRule,
        authorizationValidateRule,
    ];
    return definitions.map((definition) => definition.astNode); */
}

function validateSDL(
    documentAST: DocumentNode,
    schemaToExtend?: Maybe<GraphQLSchema>,
    rules: ReadonlyArray<SDLValidationRule> = specifiedSDLRules
): ReadonlyArray<GraphQLError> {
    const errors: Array<GraphQLError> = [];
    const context = new SDLValidationContext(documentAST, schemaToExtend, (error) => {
        errors.push(error);
    });

    const visitors = rules.map((rule) => rule(context));
    visit(documentAST, visitInParallel(visitors));
    return errors;
}

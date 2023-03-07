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
    GraphQLInputObjectType,
    GraphQLList,
    GraphQLNamedType,
    GraphQLNonNull,
    GraphQLSchema,
    GraphQLString,
    InputObjectTypeDefinitionNode,
    Kind,
    parse,
    printSchema,
    typeFromAST,
    validate,
    validateSchema,
} from "graphql";

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
                makeAuthorizationTypesForTypename(typeName, augmentendSchema);

                acc.push({
                    ...definition,
                    directives: [
                        // TODO: augmentedSchema does not remove the @authorization
                        {
                            ...authDirective,
                            name: { value: `${typeName}Authorization`, kind: authDirective.name.kind },
                        },
                    ],
                });
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
    const enhancedAugmentedDocument: DocumentNode = { ...augmentedDocument, definitions: enhancedDefinitions };
    const enhancedAugmentedSchema = buildASTSchema(enhancedAugmentedDocument, { assumeValid: true });

    const schemaToExtend = new GraphQLSchema({
        directives,
        types,
    });
    const validatationSchema = mergeSchemas({
        schemas: [enhancedAugmentedSchema, schemaToExtend],
    });
    // console.log(">type?validation>", validatationSchema.getType("Post"));

    console.log("validate start", printSchema(validatationSchema));
    // const errors = validate(validatationSchema, userDocument);
    const errors = validate(validatationSchema, parse(`{ posts { author { name } } }`));
    // const errors = validateSchema(validatationSchema);
    console.log("validate end", errors);
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
    types.push(authorizationWhere);
    /*
WE HAVE:
export interface InputObjectTypeDefinitionNode {
  readonly kind: Kind.INPUT_OBJECT_TYPE_DEFINITION;
  readonly loc?: Location;
  readonly description?: StringValueNode;
  readonly name: NameNode;
  readonly directives?: ReadonlyArray<ConstDirectiveNode>;
  readonly fields?: ReadonlyArray<InputValueDefinitionNode>;
}

WE WANT: 
export declare class GraphQLInputObjectType {
  name: string;
  description: Maybe<string>;
  extensions: Readonly<GraphQLInputObjectTypeExtensions>;
  astNode: Maybe<InputObjectTypeDefinitionNode>;
  extensionASTNodes: ReadonlyArray<InputObjectTypeExtensionNode>;
  private _fields;
  constructor(config: Readonly<GraphQLInputObjectTypeConfig>);
  get [Symbol.toStringTag](): string;
  getFields(): GraphQLInputFieldMap;
  toConfig(): GraphQLInputObjectTypeNormalizedConfig;
  toString(): string;
  toJSON(): string;
}
export interface GraphQLInputObjectTypeConfig {
  name: string;
  description?: Maybe<string>;
  fields: ThunkObjMap<GraphQLInputFieldConfig>;
  extensions?: Maybe<Readonly<GraphQLInputObjectTypeExtensions>>;
  astNode?: Maybe<InputObjectTypeDefinitionNode>;
  extensionASTNodes?: Maybe<ReadonlyArray<InputObjectTypeExtensionNode>>;
}
export interface GraphQLInputFieldConfig {
  description?: Maybe<string>;
  type: GraphQLInputType;
  defaultValue?: unknown;
  deprecationReason?: Maybe<string>;
  extensions?: Maybe<Readonly<GraphQLInputFieldExtensions>>;
  astNode?: Maybe<InputValueDefinitionNode>;
}
*/

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
    types.push(authorizationFilterRule);

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
    types.push(authorizationValidateRule);

    const authorizationDirective = new GraphQLDirective({
        name: `${typename}Authorization`,
        locations: [DirectiveLocation.FIELD_DEFINITION, DirectiveLocation.OBJECT, DirectiveLocation.INTERFACE],
        args: {
            filter: {
                description: "The name of the Neo4j property",
                type: new GraphQLList(authorizationFilterRule),
            },
            validate: {
                description: "validate",
                type: new GraphQLList(authorizationValidateRule),
            },
        },
    });
    directives.push(authorizationDirective);
}

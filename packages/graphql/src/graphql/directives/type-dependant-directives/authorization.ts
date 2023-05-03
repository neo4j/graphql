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

import { astFromDirective, astFromEnumType, astFromInputObjectType } from "@graphql-tools/utils";
import type {
    TypeDefinitionNode,
    DirectiveDefinitionNode,
    ObjectTypeDefinitionNode,
    EnumTypeDefinitionNode,
    InputObjectTypeDefinitionNode,
} from "graphql";
import {
    GraphQLEnumType,
    GraphQLSchema,
    GraphQLDirective,
    GraphQLInputObjectType,
    GraphQLList,
    GraphQLBoolean,
    DirectiveLocation,
} from "graphql";
import { SchemaComposer } from "graphql-compose";
import getObjFieldMeta from "../../../schema/get-obj-field-meta";
import getWhereFields from "../../../schema/get-where-fields";
import type { BaseField, TypeMeta } from "../../../types";

const AUTHORIZATION_VALIDATE_STAGE = new GraphQLEnumType({
    name: "AuthorizationValidateStage",
    values: { BEFORE: { value: "BEFORE" }, AFTER: { value: "AFTER" } },
});

const AUTHORIZATION_VALIDATE_OPERATION = new GraphQLEnumType({
    name: "AuthorizationValidateOperation",
    values: {
        CREATE: { value: "CREATE" },
        READ: { value: "READ" },
        UPDATE: { value: "UPDATE" },
        DELETE: { value: "DELETE" },
        CREATE_RELATIONSHIP: { value: "CREATE_RELATIONSHIP" },
        DELETE_RELATIONSHIP: { value: "DELETE_RELATIONSHIP" },
    },
});

function createAuthorizationWhere(typeDefinitionName: string, schema: GraphQLSchema): GraphQLInputObjectType {
    /**
     * Both inputWhere and JWTPayloadWhere can be undefined,
     * JWTPayload can be not defined by the User in the user document,
     * and unused interface will not generate the {typeDefinitionName}Where making the inputWhere undefined
     * */
    const inputWhere = schema.getType(`${typeDefinitionName}Where`) as GraphQLInputObjectType | undefined;
    const authorizationWhere = new GraphQLInputObjectType({
        name: `${typeDefinitionName}AuthorizationWhere`,
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
                ...(inputWhere
                    ? {
                          node: {
                              type: inputWhere,
                          },
                      }
                    : {}),
                jwtPayload: {
                    type: new GraphQLInputObjectType({ name: "JWTPayloadWhere", fields: {} }),
                },
            };
        },
    });
    return authorizationWhere;
}

function createAuthorizationFilterRule(
    typeDefinitionName: string,
    inputWhere: GraphQLInputObjectType
): GraphQLInputObjectType {
    return new GraphQLInputObjectType({
        name: `${typeDefinitionName}AuthorizationFilterRule`,
        fields() {
            return {
                operations: {
                    type: new GraphQLList(AUTHORIZATION_VALIDATE_OPERATION),
                    defaultValue: ["READ", "UPDATE", "DELETE", "CREATE_RELATIONSHIP", "DELETE_RELATIONSHIP"],
                },
                requireAuthentication: {
                    type: GraphQLBoolean,
                    defaultValue: true,
                },
                where: {
                    type: inputWhere,
                },
            };
        },
    });
}

function createAuthorizationValidateRule(
    typeDefinitionName: string,
    inputWhere: GraphQLInputObjectType
): GraphQLInputObjectType {
    return new GraphQLInputObjectType({
        name: `${typeDefinitionName}AuthorizationValidateRule`,
        fields() {
            return {
                operations: {
                    type: new GraphQLList(AUTHORIZATION_VALIDATE_OPERATION),
                    defaultValue: ["READ", "CREATE", "UPDATE", "DELETE", "CREATE_RELATIONSHIP", "DELETE_RELATIONSHIP"],
                },
                when: {
                    type: new GraphQLList(AUTHORIZATION_VALIDATE_STAGE),
                    defaultValue: ["BEFORE", "AFTER"],
                },
                requireAuthentication: {
                    type: GraphQLBoolean,
                    defaultValue: true,
                },
                where: {
                    type: inputWhere,
                },
            };
        },
    });
}

function createAuthorization(
    typeDefinitionName: string,
    filterRule: GraphQLInputObjectType,
    validateRule: GraphQLInputObjectType
): GraphQLDirective {
    return new GraphQLDirective({
        name: `${typeDefinitionName}Authorization`,
        locations: [DirectiveLocation.OBJECT, DirectiveLocation.FIELD_DEFINITION, DirectiveLocation.INTERFACE],
        args: {
            filter: {
                description: "filter",
                type: new GraphQLList(filterRule),
            },
            validate: {
                description: "validate",
                type: new GraphQLList(validateRule),
            },
        },
    });
}

function createJWTPayloadWhere(JWTPayloadDefinition?: ObjectTypeDefinitionNode): GraphQLInputObjectType {
    let fields;
    if (JWTPayloadDefinition) {
        fields = getObjFieldMeta({
            obj: JWTPayloadDefinition,
            objects: [],
            interfaces: [],
            unions: [],
            scalars: [],
            enums: [],
            validateResolvers: false,
        });
        // TODO: should this exist when JwtPayload not defined?
        const standardClaims = createJWTStandardFields();
        fields.scalarFields.push(...standardClaims);
    } else {
        fields = {
            scalarFields: [],
            enumFields: [],
            primitiveFields: [],
            temporalFields: [],
            pointFields: [],
        };
    }

    const inputFieldsType = getWhereFields({ typeName: "JWTPayload", fields });
    const composer = new SchemaComposer();
    const inputTC = composer.createInputTC({
        name: "JWTPayloadWhere",
        fields: inputFieldsType,
    });
    return inputTC.getType();
}

function createJWTStandardFields(): BaseField[] {
    const stringMeta: TypeMeta = {
        name: "String",
        array: false,
        required: false,
        pretty: "String",
        input: {
            where: { type: "String", pretty: "String" },
            create: {
                type: "String",
                pretty: `String`,
            },
            update: {
                type: "String",
                pretty: "String",
            },
        },
    };
    const stringListMeta: TypeMeta = {
        name: "String",
        array: true,
        required: false,
        pretty: "[String!]",
        input: {
            where: { type: "String", pretty: "[String!]" },
            create: {
                type: "String",
                pretty: `[String!]`,
            },
            update: {
                type: "String",
                pretty: "[String!]",
            },
        },
    };

    const issField: BaseField = {
        fieldName: "iss",
        description:
            "A case-sensitive string containing a StringOrURI value that identifies the principal that issued the JWT.",
        typeMeta: stringMeta,
        otherDirectives: [],
        arguments: [],
    };
    const subField: BaseField = {
        fieldName: "sub",
        description:
            "A case-sensitive string containing a StringOrURI value that identifies the principal that is the subject of the JWT.",
        typeMeta: stringMeta,
        otherDirectives: [],
        arguments: [],
    };
    const expField: BaseField = {
        fieldName: "exp",
        description: "Identifies the expiration time on or after which the JWT must not be accepted for processing.",
        typeMeta: stringMeta,
        otherDirectives: [],
        arguments: [],
    };
    const audField: BaseField = {
        fieldName: "aud",
        description:
            "An array of case-sensitive strings, each containing a StringOrURI value that identifies the recipients that can process the JWT.",
        typeMeta: stringListMeta,
        otherDirectives: [],
        arguments: [],
    };
    return [issField, subField, expField, audField];
}

export function createAuthorizationDefinitions(
    typeDefinitionName: string,
    schema: GraphQLSchema
): (TypeDefinitionNode | DirectiveDefinitionNode)[] {
    const authorizationWhere = createAuthorizationWhere(typeDefinitionName, schema);
    const authorizationFilterRule = createAuthorizationFilterRule(typeDefinitionName, authorizationWhere);
    const authorizationValidateRule = createAuthorizationValidateRule(typeDefinitionName, authorizationWhere);
    const authorization = createAuthorization(typeDefinitionName, authorizationFilterRule, authorizationValidateRule);

    const authorizationSchema = new GraphQLSchema({
        directives: [authorization],
        types: [authorizationWhere, authorizationFilterRule, authorizationValidateRule],
    });
    const authorizationWhereAST = astFromInputObjectType(authorizationWhere, authorizationSchema);
    const authorizationFilterRuleAST = astFromInputObjectType(authorizationFilterRule, authorizationSchema);
    const authorizationValidateRuleAST = astFromInputObjectType(authorizationValidateRule, authorizationSchema);
    const authorizationAST = astFromDirective(authorization);
    return [authorizationWhereAST, authorizationFilterRuleAST, authorizationValidateRuleAST, authorizationAST];
}

export function getStaticAuthorizationDefinitions(
    JWTPayloadDefinition?: ObjectTypeDefinitionNode
): Array<InputObjectTypeDefinitionNode | EnumTypeDefinitionNode> {
    const schema = new GraphQLSchema({});
    const authorizationValidateStage = astFromEnumType(AUTHORIZATION_VALIDATE_STAGE, schema);
    const authorizationValidateOperation = astFromEnumType(AUTHORIZATION_VALIDATE_OPERATION, schema);
    const ASTs: Array<InputObjectTypeDefinitionNode | EnumTypeDefinitionNode> = [
        authorizationValidateStage,
        authorizationValidateOperation,
    ];

    const JWTPayloadWere = createJWTPayloadWhere(JWTPayloadDefinition);
    const JWTPayloadWereAST = astFromInputObjectType(JWTPayloadWere, schema);
    ASTs.push(JWTPayloadWereAST);
    return ASTs;
}

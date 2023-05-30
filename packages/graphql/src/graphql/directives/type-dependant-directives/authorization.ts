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
import getWhereFields from "../../../schema/get-where-fields";
import { getJwtFields } from "./jwt-payload";

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

const AUTHORIZATION_FILTER_OPERATION = new GraphQLEnumType({
    name: "AuthorizationFilterOperation",
    values: {
        READ: { value: "READ" },
        UPDATE: { value: "UPDATE" },
        DELETE: { value: "DELETE" },
        CREATE_RELATIONSHIP: { value: "CREATE_RELATIONSHIP" },
        DELETE_RELATIONSHIP: { value: "DELETE_RELATIONSHIP" },
    },
});

function createAuthorizationWhere(
    typeDefinitionName: string,
    schema: GraphQLSchema,
    jwtPayloadWhere: GraphQLInputObjectType
): GraphQLInputObjectType {
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
                    type: jwtPayloadWhere,
                },
            };
        },
    });
    return authorizationWhere;
}

function createAuthorizationSubscriptionWhere(
    typeDefinitionName: string,
    schema: GraphQLSchema,
    jwtPayloadWhere: GraphQLInputObjectType
): GraphQLInputObjectType {
    /**
     * Both inputWhere and JWTPayloadWhere can be undefined,
     * JWTPayload can be not defined by the User in the user document,
     * and unused interface will not generate the {typeDefinitionName}Where making the inputWhere undefined
     * */
    const nodeWhere = schema.getType(`${typeDefinitionName}SubscriptionWhere`) as GraphQLInputObjectType | undefined;
    const relationshipWhere = schema.getType(`${typeDefinitionName}RelationshipsSubscriptionWhere`) as
        | GraphQLInputObjectType
        | undefined;
    const authorizationSubscriptionWhere = new GraphQLInputObjectType({
        name: `${typeDefinitionName}AuthorizationSubscriptionWhere`,
        fields() {
            return {
                AND: {
                    type: new GraphQLList(authorizationSubscriptionWhere),
                },
                OR: {
                    type: new GraphQLList(authorizationSubscriptionWhere),
                },
                NOT: {
                    type: authorizationSubscriptionWhere,
                },
                ...(nodeWhere
                    ? {
                          node: {
                              type: nodeWhere,
                          },
                      }
                    : {}),
                ...(relationshipWhere
                    ? {
                          relationship: {
                              type: relationshipWhere,
                          },
                      }
                    : {}),
                jwtPayload: {
                    type: jwtPayloadWhere,
                },
            };
        },
    });
    return authorizationSubscriptionWhere;
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
                    type: new GraphQLList(AUTHORIZATION_FILTER_OPERATION),
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

function createAuthorizationFilterSubscriptionsRule(
    typeDefinitionName: string,
    inputWhere: GraphQLInputObjectType
): GraphQLInputObjectType {
    return new GraphQLInputObjectType({
        name: `${typeDefinitionName}AuthorizationFilterSubscriptionsRule`,
        fields() {
            return {
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

function createAuthorization({
    typeDefinitionName,
    filterRule,
    filterSubscriptionsRule,
    validateRule,
}: {
    typeDefinitionName: string;
    filterRule: GraphQLInputObjectType;
    filterSubscriptionsRule: GraphQLInputObjectType;
    validateRule: GraphQLInputObjectType;
}): GraphQLDirective {
    return new GraphQLDirective({
        name: `${typeDefinitionName}Authorization`,
        locations: [DirectiveLocation.OBJECT, DirectiveLocation.FIELD_DEFINITION, DirectiveLocation.INTERFACE],
        args: {
            filter: {
                description: "filter",
                type: new GraphQLList(filterRule),
            },
            filterSubscriptions: {
                description: "filterSubscriptions",
                type: new GraphQLList(filterSubscriptionsRule),
            },
            validate: {
                description: "validate",
                type: new GraphQLList(validateRule),
            },
        },
    });
}

function createJWTPayloadWhere(
    schema: GraphQLSchema,
    JWTPayloadDefinition?: ObjectTypeDefinitionNode
): GraphQLInputObjectType {
    const inputFieldsType = getWhereFields({
        typeName: "JWTPayload",
        fields: getJwtFields(schema, JWTPayloadDefinition),
    });
    const composer = new SchemaComposer();
    const inputTC = composer.createInputTC({
        name: "JWTPayloadWhere",
        fields: inputFieldsType,
    });
    return inputTC.getType();
}

export function createAuthorizationDefinitions(
    typeDefinitionName: string,
    schema: GraphQLSchema
): (TypeDefinitionNode | DirectiveDefinitionNode)[] {
    const jwtPayloadWhere = new GraphQLInputObjectType({ name: "JWTPayloadWhere", fields: {} });

    const authorizationWhere = createAuthorizationWhere(typeDefinitionName, schema, jwtPayloadWhere);
    const authorizationFilterRule = createAuthorizationFilterRule(typeDefinitionName, authorizationWhere);
    const authorizationValidateRule = createAuthorizationValidateRule(typeDefinitionName, authorizationWhere);

    const authorizationSubscriptionWhere = createAuthorizationSubscriptionWhere(
        typeDefinitionName,
        schema,
        jwtPayloadWhere
    );
    const authorizationFilterSubscriptionsRule = createAuthorizationFilterSubscriptionsRule(
        typeDefinitionName,
        authorizationSubscriptionWhere
    );

    const authorization = createAuthorization({
        typeDefinitionName,
        filterRule: authorizationFilterRule,
        filterSubscriptionsRule: authorizationFilterSubscriptionsRule,
        validateRule: authorizationValidateRule,
    });

    const authorizationSchema = new GraphQLSchema({
        directives: [authorization],
        types: [authorizationWhere, authorizationFilterRule, authorizationValidateRule],
    });

    const authorizationWhereAST = astFromInputObjectType(authorizationWhere, authorizationSchema);
    const authorizationFilterRuleAST = astFromInputObjectType(authorizationFilterRule, authorizationSchema);
    const authorizationValidateRuleAST = astFromInputObjectType(authorizationValidateRule, authorizationSchema);

    const authorizationSubscriptionWhereAST = astFromInputObjectType(
        authorizationSubscriptionWhere,
        authorizationSchema
    );
    const authorizationFilterSubscriptionsRuleAST = astFromInputObjectType(
        authorizationFilterSubscriptionsRule,
        authorizationSchema
    );

    const authorizationAST = astFromDirective(authorization);
    return [
        authorizationWhereAST,
        authorizationFilterRuleAST,
        authorizationValidateRuleAST,
        authorizationSubscriptionWhereAST,
        authorizationFilterSubscriptionsRuleAST,
        authorizationAST,
    ];
}

export function getStaticAuthorizationDefinitions(
    JWTPayloadDefinition?: ObjectTypeDefinitionNode
): Array<InputObjectTypeDefinitionNode | EnumTypeDefinitionNode> {
    const schema = new GraphQLSchema({});
    const authorizationValidateStage = astFromEnumType(AUTHORIZATION_VALIDATE_STAGE, schema);
    const authorizationValidateOperation = astFromEnumType(AUTHORIZATION_VALIDATE_OPERATION, schema);
    const authorizationFilterOperation = astFromEnumType(AUTHORIZATION_FILTER_OPERATION, schema);
    const ASTs: Array<InputObjectTypeDefinitionNode | EnumTypeDefinitionNode> = [
        authorizationValidateStage,
        authorizationValidateOperation,
        authorizationFilterOperation,
    ];

    const JWTPayloadWere = createJWTPayloadWhere(schema, JWTPayloadDefinition);
    const JWTPayloadWereAST = astFromInputObjectType(JWTPayloadWere, schema);
    ASTs.push(JWTPayloadWereAST);
    return ASTs;
}

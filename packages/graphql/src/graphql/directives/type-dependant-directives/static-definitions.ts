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

import { astFromEnumType, astFromInputObjectType } from "@graphql-tools/utils";
import type {
    ObjectTypeDefinitionNode,
    EnumTypeDefinitionNode,
    InputObjectTypeDefinitionNode,
    GraphQLInputObjectType,
} from "graphql";
import { GraphQLEnumType, GraphQLSchema } from "graphql";
import { SchemaComposer } from "graphql-compose";
import getWhereFields from "../../../schema/get-where-fields";
import { getJwtFields } from "./jwt-payload";

export const AUTHORIZATION_VALIDATE_STAGE = new GraphQLEnumType({
    name: "AuthorizationValidateStage",
    values: { BEFORE: { value: "BEFORE" }, AFTER: { value: "AFTER" } },
});

export const AUTHORIZATION_VALIDATE_OPERATION = new GraphQLEnumType({
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

export const AUTHORIZATION_FILTER_OPERATION = new GraphQLEnumType({
    name: "AuthorizationFilterOperation",
    values: {
        READ: { value: "READ" },
        UPDATE: { value: "UPDATE" },
        DELETE: { value: "DELETE" },
        CREATE_RELATIONSHIP: { value: "CREATE_RELATIONSHIP" },
        DELETE_RELATIONSHIP: { value: "DELETE_RELATIONSHIP" },
    },
});

export const AUTHENTICATION_OPERATION = new GraphQLEnumType({
    name: "AuthenticationOperation",
    values: {
        CREATE: { value: "CREATE" },
        READ: { value: "READ" },
        UPDATE: { value: "UPDATE" },
        DELETE: { value: "DELETE" },
        CREATE_RELATIONSHIP: { value: "CREATE_RELATIONSHIP" },
        DELETE_RELATIONSHIP: { value: "DELETE_RELATIONSHIP" },
        SUBSCRIBE: { value: "SUBSCRIBE" },
    },
});

export function getStaticAuthorizationDefinitions(
    JWTPayloadDefinition?: ObjectTypeDefinitionNode
): Array<InputObjectTypeDefinitionNode | EnumTypeDefinitionNode> {
    const schema = new GraphQLSchema({});
    const authorizationValidateStage = astFromEnumType(AUTHORIZATION_VALIDATE_STAGE, schema);
    const authorizationValidateOperation = astFromEnumType(AUTHORIZATION_VALIDATE_OPERATION, schema);
    const authorizationFilterOperation = astFromEnumType(AUTHORIZATION_FILTER_OPERATION, schema);
    const authenticationOperation = astFromEnumType(AUTHENTICATION_OPERATION, schema);
    const ASTs: Array<InputObjectTypeDefinitionNode | EnumTypeDefinitionNode> = [
        authorizationValidateStage,
        authorizationValidateOperation,
        authorizationFilterOperation,
        authenticationOperation,
    ];

    const JWTPayloadWhere = createJWTPayloadWhere(schema, JWTPayloadDefinition);
    const JWTPayloadWhereAST = astFromInputObjectType(JWTPayloadWhere, schema);
    ASTs.push(JWTPayloadWhereAST);
    return ASTs;
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

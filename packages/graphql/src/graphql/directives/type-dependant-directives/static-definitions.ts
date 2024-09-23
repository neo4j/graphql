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
    DocumentNode,
    EnumTypeDefinitionNode,
    GraphQLInputObjectType,
    InputObjectTypeDefinitionNode,
    ObjectTypeDefinitionNode,
} from "graphql";
import { GraphQLEnumType, GraphQLSchema } from "graphql";
import { SchemaComposer } from "graphql-compose";
import { AttributeAdapter } from "../../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { DefinitionCollection } from "../../../schema-model/parser/definition-collection";
import { getDefinitionCollection } from "../../../schema-model/parser/definition-collection";
import { parseAttribute } from "../../../schema-model/parser/parse-attribute";
import { addLogicalOperatorsToWhereInputType } from "../../../schema/generation/where-input";
import { getWhereFieldsForAttributes } from "../../../schema/get-where-fields";
import { getStandardJwtDefinition } from "./jwt-payload";

export const AUTHORIZATION_VALIDATE_STAGE = new GraphQLEnumType({
    name: "AuthorizationValidateStage",
    values: { BEFORE: { value: "BEFORE" }, AFTER: { value: "AFTER" } },
});

export const AUTHORIZATION_VALIDATE_OPERATION = new GraphQLEnumType({
    name: "AuthorizationValidateOperation",
    values: {
        CREATE: { value: "CREATE" },
        READ: { value: "READ" },
        AGGREGATE: { value: "AGGREGATE" },
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
        AGGREGATE: { value: "AGGREGATE" },
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
        AGGREGATE: { value: "AGGREGATE" },
        UPDATE: { value: "UPDATE" },
        DELETE: { value: "DELETE" },
        CREATE_RELATIONSHIP: { value: "CREATE_RELATIONSHIP" },
        DELETE_RELATIONSHIP: { value: "DELETE_RELATIONSHIP" },
        SUBSCRIBE: { value: "SUBSCRIBE" },
    },
});

export const SUBSCRIPTIONS_AUTHORIZATION_FILTER_EVENT = new GraphQLEnumType({
    name: "SubscriptionsAuthorizationFilterEvent",
    values: {
        CREATED: { value: "CREATED" },
        UPDATED: { value: "UPDATED" },
        DELETED: { value: "DELETED" },
        RELATIONSHIP_CREATED: { value: "RELATIONSHIP_CREATED" },
        RELATIONSHIP_DELETED: { value: "RELATIONSHIP_DELETED" },
    },
});

export function getStaticAuthorizationDefinitions(
    userDocument: DocumentNode,
    JWTPayloadDefinition?: ObjectTypeDefinitionNode
): Array<InputObjectTypeDefinitionNode | EnumTypeDefinitionNode> {
    const schema = new GraphQLSchema({});
    const authorizationValidateStage = astFromEnumType(AUTHORIZATION_VALIDATE_STAGE, schema);
    const authorizationValidateOperation = astFromEnumType(AUTHORIZATION_VALIDATE_OPERATION, schema);
    const authorizationFilterOperation = astFromEnumType(AUTHORIZATION_FILTER_OPERATION, schema);
    const authenticationOperation = astFromEnumType(AUTHENTICATION_OPERATION, schema);
    const subscriptionsAuthorizationFilterOperation = astFromEnumType(SUBSCRIPTIONS_AUTHORIZATION_FILTER_EVENT, schema);
    const ASTs: Array<InputObjectTypeDefinitionNode | EnumTypeDefinitionNode> = [
        authorizationValidateStage,
        authorizationValidateOperation,
        authorizationFilterOperation,
        authenticationOperation,
        subscriptionsAuthorizationFilterOperation,
    ];

    const JWTPayloadWhere = createJWTPayloadWhere(userDocument, schema, JWTPayloadDefinition);
    const JWTPayloadWhereAST = astFromInputObjectType(JWTPayloadWhere, schema);
    ASTs.push(JWTPayloadWhereAST);
    return ASTs;
}

function createJWTPayloadWhere(
    userDocument: DocumentNode,
    schema: GraphQLSchema,
    JWTPayloadDefinition?: ObjectTypeDefinitionNode
): GraphQLInputObjectType {
    // TODO: We would like not to have to do this getDefinitionCollection again as it is a heavy operation
    // We should find a way to get the definitionCollection from the generated model
    // Or we should find a way to use parseAttribute without a DefinitionCollection
    const definitionCollection: DefinitionCollection = getDefinitionCollection(userDocument);

    const jwtStandardTypeDefinitionFields = getStandardJwtDefinition(schema).fields || [];
    const jwtPayloadDefinitionFields = JWTPayloadDefinition?.fields || [];

    const jwtFieldAttributeAdapters = [...jwtStandardTypeDefinitionFields, ...jwtPayloadDefinitionFields].map(
        (field) => new AttributeAdapter(parseAttribute(field, definitionCollection))
    );

    const inputFieldsType = getWhereFieldsForAttributes({
        attributes: jwtFieldAttributeAdapters,
        userDefinedFieldDirectives: undefined,
        features: undefined,
    });

    const composer = new SchemaComposer();
    const inputTC = composer.createInputTC({
        name: "JWTPayloadWhere",
        fields: inputFieldsType,
    });

    addLogicalOperatorsToWhereInputType(inputTC);

    return inputTC.getType();
}

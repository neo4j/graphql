import { astFromEnumType, astFromInputObjectType } from "@graphql-tools/utils";
import type {
    DocumentNode,
    EnumTypeDefinitionNode,
    GraphQLInputObjectType,
    InputObjectTypeDefinitionNode,
    ObjectTypeDefinitionNode,
} from "graphql";
import { GraphQLSchema } from "graphql";
import { SchemaComposer } from "graphql-compose";
import { AttributeAdapter } from "../../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { DefinitionCollection } from "../../../schema-model/parser/definition-collection";
import { getDefinitionCollection } from "../../../schema-model/parser/definition-collection";
import { parseAttribute } from "../../../schema-model/parser/parse-attribute";
import { addLogicalOperatorsToWhereInputType } from "../../../schema/generation/where-input";
import { getWhereFieldsForAttributes } from "../../../schema/get-where-fields";
import { getStandardJwtDefinition } from "./jwt-payload";
import {
    AUTHENTICATION_OPERATION,
    AUTHORIZATION_FILTER_OPERATION,
    AUTHORIZATION_VALIDATE_OPERATION,
    AUTHORIZATION_VALIDATE_STAGE,
    SUBSCRIPTIONS_AUTHORIZATION_FILTER_EVENT,
} from "./static-definitions";

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

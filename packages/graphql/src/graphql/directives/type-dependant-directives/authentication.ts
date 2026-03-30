/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { astFromDirective } from "@graphql-tools/utils";
import type { DirectiveDefinitionNode } from "graphql";
import { DirectiveLocation, GraphQLDirective, GraphQLInputObjectType, GraphQLList, GraphQLString } from "graphql";
import { AUTHENTICATION_OPERATION } from "./static-definitions";

const authenticationDefaultOperations = [
    "READ",
    "AGGREGATE",
    "CREATE",
    "UPDATE",
    "DELETE",
    "CREATE_RELATIONSHIP",
    "DELETE_RELATIONSHIP",
    "SUBSCRIBE",
];
function createAuthentication(jwtPayloadWhere: GraphQLInputObjectType): GraphQLDirective {
    return new GraphQLDirective({
        name: "authentication",
        locations: [DirectiveLocation.OBJECT, DirectiveLocation.FIELD_DEFINITION, DirectiveLocation.SCHEMA],
        args: {
            operations: {
                description: "operations",
                type: new GraphQLList(AUTHENTICATION_OPERATION),
                defaultValue: authenticationDefaultOperations,
            },
            jwt: {
                type: jwtPayloadWhere,
            },
        },
    });
}

export function createAuthenticationDirectiveDefinition(): DirectiveDefinitionNode {
    const jwtPayloadWhere = new GraphQLInputObjectType({ name: "JWTPayloadWhere", fields: {} });
    const authentication = createAuthentication(jwtPayloadWhere);
    const authenticationAST = astFromDirective(authentication);
    return authenticationAST;
}

export const authenticationDirectiveScaffold = new GraphQLDirective({
    name: "authentication",
    description: "This is a simpler version of the authentication directive to be used in the validate-document step.",
    locations: [DirectiveLocation.OBJECT, DirectiveLocation.FIELD_DEFINITION, DirectiveLocation.SCHEMA],
    args: {
        operations: {
            description: "operations",
            type: new GraphQLList(GraphQLString),
        },
        jwt: {
            type: GraphQLString,
        },
    },
});

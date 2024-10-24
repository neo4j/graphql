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

import { astFromDirective, astFromInputObjectType } from "@graphql-tools/utils";
import type { DirectiveDefinitionNode, TypeDefinitionNode } from "graphql";
import {
    DirectiveLocation,
    GraphQLBoolean,
    GraphQLDirective,
    GraphQLInputObjectType,
    GraphQLList,
    GraphQLNonNull,
    GraphQLSchema,
    GraphQLString,
} from "graphql";
import { SUBSCRIPTIONS_AUTHORIZATION_FILTER_EVENT } from "./static-definitions";

function createSubscriptionsAuthorizationWhere(
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
    const subscriptionsAuthorizationWhere = new GraphQLInputObjectType({
        name: `${typeDefinitionName}SubscriptionsAuthorizationWhere`,
        fields() {
            return {
                AND: {
                    type: new GraphQLList(subscriptionsAuthorizationWhere),
                },
                OR: {
                    type: new GraphQLList(subscriptionsAuthorizationWhere),
                },
                NOT: {
                    type: subscriptionsAuthorizationWhere,
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
                jwt: {
                    type: jwtPayloadWhere,
                },
            };
        },
    });
    return subscriptionsAuthorizationWhere;
}

function createSubscriptionsAuthorizationFilterRule(
    typeDefinitionName: string,
    inputWhere: GraphQLInputObjectType
): GraphQLInputObjectType {
    return new GraphQLInputObjectType({
        name: `${typeDefinitionName}SubscriptionsAuthorizationFilterRule`,
        fields() {
            return {
                events: {
                    type: new GraphQLList(SUBSCRIPTIONS_AUTHORIZATION_FILTER_EVENT),
                    defaultValue: ["CREATED", "UPDATED", "DELETED"],
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

function createSubscriptionsAuthorization({
    typeDefinitionName,
    filterRule,
}: {
    typeDefinitionName: string;
    filterRule: GraphQLInputObjectType;
}): GraphQLDirective {
    return new GraphQLDirective({
        name: `${typeDefinitionName}SubscriptionsAuthorization`,
        locations: [DirectiveLocation.OBJECT, DirectiveLocation.FIELD_DEFINITION],
        args: {
            filter: {
                description: "filter",
                type: new GraphQLNonNull(new GraphQLList(filterRule)),
            },
        },
    });
}

export function createSubscriptionsAuthorizationDefinitions(
    typeDefinitionName: string,
    schema: GraphQLSchema
): (TypeDefinitionNode | DirectiveDefinitionNode)[] {
    const jwtPayloadWhere = new GraphQLInputObjectType({ name: "JWTPayloadWhere", fields: {} });

    const subscriptionsAuthorizationWhere = createSubscriptionsAuthorizationWhere(
        typeDefinitionName,
        schema,
        jwtPayloadWhere
    );
    const subscriptionsAuthorizationFilterRule = createSubscriptionsAuthorizationFilterRule(
        typeDefinitionName,
        subscriptionsAuthorizationWhere
    );

    const subscriptionsAuthorization = createSubscriptionsAuthorization({
        typeDefinitionName,
        filterRule: subscriptionsAuthorizationFilterRule,
    });

    const subscriptionsAuthorizationSchema = new GraphQLSchema({
        directives: [subscriptionsAuthorization],
        types: [subscriptionsAuthorizationWhere, subscriptionsAuthorizationFilterRule],
    });

    const subscriptionsAuthorizationWhereAST = astFromInputObjectType(
        subscriptionsAuthorizationWhere,
        subscriptionsAuthorizationSchema
    );
    const subscriptionsAuthorizationFilterRuleAST = astFromInputObjectType(
        subscriptionsAuthorizationFilterRule,
        subscriptionsAuthorizationSchema
    );

    const subscriptionsAuthorizationAST = astFromDirective(subscriptionsAuthorization);
    return [subscriptionsAuthorizationWhereAST, subscriptionsAuthorizationFilterRuleAST, subscriptionsAuthorizationAST];
}

export const subscriptionsAuthorizationDirectiveScaffold = new GraphQLDirective({
    name: `subscriptionsAuthorization`,
    description:
        "This is a simpler version of the subscriptionsAuthorization directive to be used in the validate-document step.",
    locations: [DirectiveLocation.OBJECT, DirectiveLocation.FIELD_DEFINITION],
    args: {
        filter: {
            description: "filter",
            type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
        },
    },
});

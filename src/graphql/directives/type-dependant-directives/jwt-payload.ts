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

import { astFromObjectType } from "@graphql-tools/utils";
import type { GraphQLSchema, ObjectTypeDefinitionNode } from "graphql";
import { GraphQLInt, GraphQLList, GraphQLObjectType, GraphQLString } from "graphql";

export function getStandardJwtDefinition(schema: GraphQLSchema): ObjectTypeDefinitionNode {
    const jwtStandardType = new GraphQLObjectType({
        name: "JWTStandard",
        fields: {
            iss: {
                type: GraphQLString,
                description:
                    "A case-sensitive string containing a StringOrURI value that identifies the principal that issued the JWT.",
            },
            sub: {
                type: GraphQLString,
                description:
                    "A case-sensitive string containing a StringOrURI value that identifies the principal that is the subject of the JWT.",
            },
            aud: {
                type: new GraphQLList(GraphQLString),
                description:
                    "An array of case-sensitive strings, each containing a StringOrURI value that identifies the recipients that can process the JWT.",
            },
            exp: {
                type: GraphQLInt,
                description:
                    "Identifies the expiration time on or after which the JWT must not be accepted for processing.",
            },
            nbf: {
                type: GraphQLInt,
                description: "Identifies the time before which the JWT must not be accepted for processing.",
            },
            iat: {
                type: GraphQLInt,
                description: "Identifies the time at which the JWT was issued, to determine the age of the JWT.",
            },
            jti: {
                type: GraphQLString,
                description: "Uniquely identifies the JWT, to prevent the JWT from being replayed.",
            },
        },
    });
    return astFromObjectType(jwtStandardType, schema);
}

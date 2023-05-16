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

import { DirectiveLocation, GraphQLDirective, GraphQLEnumType, GraphQLList } from "graphql";

export const AuthenticationOperationEnum = new GraphQLEnumType({
    name: "AuthenticationOperation",
    values: {
        CREATE: { value: "CREATE" },
        READ: { value: "READ" },
        UPDATE: { value: "UPDATE" },
        DELETE: { value: "DELETE" },
        CREATE_RELATIONSHIP: { value: "CREATE_RELATIONSHIP" },
        DELETE_RELATIONSHIP: { value: "DELETE_RELATIONSHIP" },
    },
});

export const authentication = new GraphQLDirective({
    name: "authentication",
    description: "Enable authentication for the entity to which it is applied.",
    locations: [DirectiveLocation.OBJECT, DirectiveLocation.FIELD_DEFINITION],
    args: {
        operations: {
            type: new GraphQLList(AuthenticationOperationEnum),
            defaultValue: ["READ", "CREATE", "UPDATE", "DELETE", "CREATE_RELATIONSHIP", "DELETE_RELATIONSHIP"],
        },
    },
});

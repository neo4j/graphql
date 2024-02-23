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

import { DirectiveLocation, GraphQLBoolean, GraphQLDirective, GraphQLList, GraphQLNonNull } from "graphql";
import { RelationshipNestedOperationsOption } from "../../constants";
import { RelationshipNestedOperationsEnum } from "./arguments/enums/RelationshipNestedOperations";

export const defaultNestedOperations = [
    RelationshipNestedOperationsOption.CREATE,
    RelationshipNestedOperationsOption.UPDATE,
    RelationshipNestedOperationsOption.DELETE,
    RelationshipNestedOperationsOption.CONNECT,
    RelationshipNestedOperationsOption.DISCONNECT,
    RelationshipNestedOperationsOption.CONNECT_OR_CREATE,
];

export const declareRelationshipDirective = new GraphQLDirective({
    name: "declareRelationship",
    description:
        "Instructs @neo4j/graphql that any type that implements this interface must annotate this field with the `@relationship` directive. Allows for nested reading operations in the Interface top level query and opens up the ability to create and connect on this field.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
    args: {
        nestedOperations: {
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(RelationshipNestedOperationsEnum))),
            defaultValue: defaultNestedOperations,
            description: "Prevent all but these operations from being generated for this relationship",
        },
        aggregate: {
            type: GraphQLBoolean,
            defaultValue: true,
            description: "Prevent aggregation for this relationship",
        },
    },
});

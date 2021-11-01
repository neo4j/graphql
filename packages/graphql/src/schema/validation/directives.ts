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

import {
    GraphQLDirective,
    DirectiveLocation,
    GraphQLString,
    GraphQLNonNull,
    GraphQLList,
    GraphQLBoolean,
} from "graphql";
import { ExcludeOperationEnum, RelationshipDirectionEnum, TimestampOperationEnum } from "./enums";
import { ScalarType } from "./scalars";

export const aliasDirective = new GraphQLDirective({
    name: "alias",
    description: "Instructs @neo4j/graphql to map a GraphQL field to a Neo4j node or relationship property.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
    args: {
        property: {
            description: "The name of the Neo4j property",
            type: new GraphQLNonNull(GraphQLString),
        },
    },
});

export const coalesceDirective = new GraphQLDirective({
    name: "coalesce",
    description:
        "Instructs @neo4j/graphql to wrap the property in a coalesce() function during queries, using the single value specified.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
    args: {
        value: {
            description:
                "The value to use in the coalesce() function. Must be a scalar type and must match the type of the field with which this directive decorates.",
            type: new GraphQLNonNull(ScalarType),
        },
    },
});

export const cypherDirective = new GraphQLDirective({
    name: "cypher",
    description:
        "Instructs @neo4j/graphql to run the specified Cypher statement in order to resolve the value of the field to which the directive is applied.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
    args: {
        statement: {
            description:
                "The Cypher statement to run which returns a value of the same type composition as the field definition on which the directive is applied.",
            type: new GraphQLNonNull(GraphQLString),
        },
    },
});

export const defaultDirective = new GraphQLDirective({
    name: "default",
    description:
        "Instructs @neo4j/graphql to set the specified value as the default value in the CreateInput type for the object type in which this directive is used.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
    args: {
        value: {
            description:
                "The default value to use. Must be a scalar type and must match the type of the field with which this directive decorates.",
            type: new GraphQLNonNull(ScalarType),
        },
    },
});

export const excludeDirective = new GraphQLDirective({
    name: "exclude",
    description:
        "Instructs @neo4j/graphql to exclude the specified operations from query and mutation generation. If used without an argument, no queries or mutations will be generated for this type.",
    locations: [DirectiveLocation.INTERFACE, DirectiveLocation.OBJECT],
    args: {
        operations: {
            defaultValue: ExcludeOperationEnum.getValues().map((v) => v.value),
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(ExcludeOperationEnum))),
        },
    },
});

export const idDirective = new GraphQLDirective({
    name: "id",
    description:
        "Indicates that the field is the unique identifier for the object type, and additionally enables the autogeneration of IDs.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
    args: {
        autogenerate: {
            defaultValue: false,
            type: new GraphQLNonNull(GraphQLBoolean),
        },
    },
});

export const ignoreDirective = new GraphQLDirective({
    name: "ignore",
    description:
        "Instructs @neo4j/graphql to completely ignore a field definition, assuming that it will be fully accounted for by custom resolvers.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
});

export const nodeDirective = new GraphQLDirective({
    name: "node",
    description: "Informs @neo4j/graphql of node metadata",
    locations: [DirectiveLocation.OBJECT],
    args: {
        label: {
            description: "Map the GraphQL type to a custom Neo4j node label",
            type: GraphQLString,
        },
        additionalLabels: {
            description: "Map the GraphQL type to match additional Neo4j node labels",
            type: GraphQLList(new GraphQLNonNull(GraphQLString)),
        },
        plural: {
            description: "Defines a custom plural for the Node API",
            type: GraphQLString,
        },
    },
});

export const privateDirective = new GraphQLDirective({
    name: "private",
    description: "Instructs @neo4j/graphql to only expose a field through the Neo4j GraphQL OGM.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
});

export const readonlyDirective = new GraphQLDirective({
    name: "readonly",
    description:
        "Instructs @neo4j/graphql to only include a field in generated input type for creating, and in the object type within which the directive is applied.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
});

export const relationshipDirective = new GraphQLDirective({
    name: "relationship",
    description:
        "Instructs @neo4j/graphql to treat this field as a relationship. Opens up the ability to create and connect on this field.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
    args: {
        type: {
            type: new GraphQLNonNull(GraphQLString),
        },
        direction: {
            type: new GraphQLNonNull(RelationshipDirectionEnum),
        },
        properties: {
            type: GraphQLString,
            description: "The name of the interface containing the properties for this relationship.",
        },
    },
});

export const relationshipPropertiesDirective = new GraphQLDirective({
    name: "relationshipProperties",
    description: "Syntactic sugar to help differentiate between interfaces for relationship properties, and otherwise.",
    locations: [DirectiveLocation.INTERFACE],
});

export const timestampDirective = new GraphQLDirective({
    name: "timestamp",
    description:
        "Instructs @neo4j/graphql to generate timestamps on particular events, which will be available as the value of the specified field.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
    args: {
        operations: {
            description: "Which events to generate timestamps on. Defaults to both create and update.",
            defaultValue: TimestampOperationEnum.getValues().map((v) => v.value),
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(TimestampOperationEnum))),
        },
    },
});

export const writeonlyDirective = new GraphQLDirective({
    name: "writeonly",
    description:
        "Instructs @neo4j/graphql to only include a field in the generated input types for the object type within which the directive is applied, but exclude it from the object type itself.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
});

export const fulltextDirective = new GraphQLDirective({
    name: "fulltext",
    description:
        "Informs @neo4j/graphql that there should be a fulltext index in the database, allows users to search by the index in the generated schema.",
    args: {
        name: {
            type: new GraphQLNonNull(GraphQLString),
        },
        fields: {
            type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
        },
        defaultThreshold: {
            type: GraphQLString,
        },
    },
    locations: [DirectiveLocation.OBJECT],
});

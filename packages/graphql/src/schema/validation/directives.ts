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
    GraphQLInputObjectType,
    GraphQLInt,
} from "graphql";
import { RelationshipQueryDirectionOption } from "../../constants";
import {
    CallbackOperationEnum,
    ExcludeOperationEnum,
    RelationshipDirectionEnum,
    RelationshipQueryDirectionEnum,
    TimestampOperationEnum,
} from "./enums";
import { ScalarOrEnumType } from "./scalars";

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

export const callbackDirective = new GraphQLDirective({
    name: "callback",
    description:
        "Instructs @neo4j/graphql to invoke the specified callback function when updating or creating the properties on a node or relationship.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
    args: {
        operations: {
            description: "Which events to invoke the callback on.",
            defaultValue: CallbackOperationEnum.getValues().map((v) => v.value),
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(CallbackOperationEnum))),
        },
        name: {
            description: "The name of the callback function.",
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
            type: new GraphQLNonNull(ScalarOrEnumType),
        },
    },
});

export const computedDirective = new GraphQLDirective({
    name: "computed",
    description:
        "Informs @neo4j/graphql that a field will be resolved by a custom resolver, and allows specification of any field dependencies.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
    args: {
        from: {
            description: "Fields that the custom resolver will depend on.",
            type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
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
            type: new GraphQLNonNull(ScalarOrEnumType),
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

export const fulltextDirective = new GraphQLDirective({
    name: "fulltext",
    description:
        "Informs @neo4j/graphql that there should be a fulltext index in the database, allows users to search by the index in the generated schema.",
    args: {
        indexes: {
            type: new GraphQLNonNull(
                new GraphQLList(
                    new GraphQLInputObjectType({
                        name: "FullTextInput",
                        fields: {
                            name: {
                                type: new GraphQLNonNull(GraphQLString),
                            },
                            fields: {
                                type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
                            },
                        },
                    })
                )
            ),
        },
    },
    locations: [DirectiveLocation.OBJECT],
});

export const idDirective = new GraphQLDirective({
    name: "id",
    description:
        "Indicates that the field is an identifier for the object type. By default; autogenerated, and has a unique node property constraint in the database.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
    args: {
        autogenerate: {
            defaultValue: false,
            type: new GraphQLNonNull(GraphQLBoolean),
        },
        unique: {
            defaultValue: true,
            type: new GraphQLNonNull(GraphQLBoolean),
        },
    },
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
            type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
        },
        plural: {
            description: "Allows for the specification of the plural of the type name.",
            type: GraphQLString,
        },
    },
});

export const privateDirective = new GraphQLDirective({
    name: "private",
    description: "Instructs @neo4j/graphql to only expose a field through the Neo4j GraphQL OGM.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
});

export const queryOptions = new GraphQLDirective({
    name: "queryOptions",
    description: "Instructs @neo4j/graphql to inject default values into a query such as a default limit.",
    args: {
        limit: {
            description: "Limit options.",
            type: new GraphQLInputObjectType({
                name: "LimitInput",
                fields: {
                    default: {
                        description: "If no limit argument is supplied on query will fallback to this value.",
                        type: GraphQLInt,
                    },
                    max: {
                        description: "Maximum limit to be used for queries.",
                        type: GraphQLInt,
                    },
                },
            }),
        },
    },
    locations: [DirectiveLocation.OBJECT],
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
        queryDirection: {
            type: RelationshipQueryDirectionEnum,
            defaultValue: RelationshipQueryDirectionOption.DEFAULT_DIRECTED,
            description: "Valid and default directions for this relationship.",
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

export const uniqueDirective = new GraphQLDirective({
    name: "unique",
    description:
        "Informs @neo4j/graphql that there should be a uniqueness constraint in the database for the decorated field.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
    args: {
        constraintName: {
            description:
                "The name which should be used for this constraint. By default; type name, followed by an underscore, followed by the field name.",
            type: GraphQLString,
        },
    },
});

export const writeonlyDirective = new GraphQLDirective({
    name: "writeonly",
    description:
        "Instructs @neo4j/graphql to only include a field in the generated input types for the object type within which the directive is applied, but exclude it from the object type itself.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
});

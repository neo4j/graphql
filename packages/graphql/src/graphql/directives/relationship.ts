/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import {
    DirectiveLocation,
    GraphQLBoolean,
    GraphQLDirective,
    GraphQLList,
    GraphQLNonNull,
    GraphQLString,
} from "graphql";
import { RelationshipNestedOperationsOption, RelationshipQueryDirectionOption } from "../../constants";
import { RelationshipDirectionEnum } from "./arguments/enums/RelationshipDirection";
import { RelationshipNestedOperationsEnum } from "./arguments/enums/RelationshipNestedOperations";
import { RelationshipQueryDirectionEnum } from "./arguments/enums/RelationshipQueryDirection";

const defaultNestedOperations = [
    RelationshipNestedOperationsOption.CREATE,
    RelationshipNestedOperationsOption.UPDATE,
    RelationshipNestedOperationsOption.DELETE,
    RelationshipNestedOperationsOption.CONNECT,
    RelationshipNestedOperationsOption.DISCONNECT,
];

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
            defaultValue: RelationshipQueryDirectionOption.DIRECTED,
            description: "Directions to query this relationship.",
        },
        direction: {
            type: new GraphQLNonNull(RelationshipDirectionEnum),
        },
        properties: {
            type: GraphQLString,
            description: "The name of the interface containing the properties for this relationship.",
        },
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

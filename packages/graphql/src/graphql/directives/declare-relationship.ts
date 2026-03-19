/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { DirectiveLocation, GraphQLBoolean, GraphQLDirective, GraphQLList, GraphQLNonNull } from "graphql";
import { RelationshipNestedOperationsOption } from "../../constants";
import { RelationshipNestedOperationsEnum } from "./arguments/enums/RelationshipNestedOperations";

const defaultNestedOperations = [
    RelationshipNestedOperationsOption.CREATE,
    RelationshipNestedOperationsOption.UPDATE,
    RelationshipNestedOperationsOption.DELETE,
    RelationshipNestedOperationsOption.CONNECT,
    RelationshipNestedOperationsOption.DISCONNECT,
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

/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { DirectiveLocation, GraphQLDirective, GraphQLEnumType, GraphQLList, GraphQLNonNull } from "graphql";

export enum MutationOperations {
    CREATE = "CREATE",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
}

const MUTATION_FIELDS = new GraphQLEnumType({
    name: "MutationFields",
    values: {
        [MutationOperations.CREATE]: { value: MutationOperations.CREATE },
        [MutationOperations.UPDATE]: { value: MutationOperations.UPDATE },
        [MutationOperations.DELETE]: { value: MutationOperations.DELETE },
    },
});

export const mutationDirective = new GraphQLDirective({
    name: "mutation",
    description: "Instructs @neo4j/graphql to exclude create, delete or update operations from the mutation root type.",
    args: {
        operations: {
            description: "Describe operations available for this type",
            type: new GraphQLNonNull(new GraphQLList(MUTATION_FIELDS)),
            defaultValue: [MutationOperations.CREATE, MutationOperations.UPDATE, MutationOperations.DELETE],
        },
    },
    locations: [DirectiveLocation.OBJECT, DirectiveLocation.SCHEMA],
});

/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { GraphQLScalarType } from "graphql";
import { GraphQLInputObjectType, GraphQLInt, GraphQLList, GraphQLNonNull } from "graphql";

export function listMutation(inputObject: GraphQLInputObjectType | GraphQLScalarType): GraphQLInputObjectType {
    return new GraphQLInputObjectType({
        name: `List${inputObject.name}Mutations`,
        description: `Mutations for a list for ${inputObject.name}`,
        fields: {
            set: { type: new GraphQLList(new GraphQLNonNull(inputObject)) },
            push: { type: new GraphQLList(new GraphQLNonNull(inputObject)) },
            pop: { type: GraphQLInt },
        },
    });
}

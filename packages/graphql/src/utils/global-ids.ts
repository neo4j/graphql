/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */
import { GraphQLID } from "graphql";
import { base64, unbase64 } from "graphql-relay/utils/base64";

interface DecodedGlobalId {
    typeName: string;
    field: string;
    id: string | number;
}

export function toGlobalId({ typeName, field, id }: DecodedGlobalId): string {
    return base64([typeName, field, GraphQLID.serialize(id)].join(":"));
}

export function fromGlobalId(id: string, isInt?: boolean): DecodedGlobalId {
    const unbasedGlobalId = unbase64(id);
    const [typeName, field, ...rest] = unbasedGlobalId.split(":") as [string, string, string, ...string[]];

    return {
        typeName,
        field,
        id: isInt ? parseInt(rest[0], 10) : rest.join(":"),
    };
}

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
import { GraphQLID } from "graphql";
import { base64, unbase64 } from "graphql-relay/utils/base64";

export interface DecodedGlobalId {
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

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

import type { GraphQLResolveInfo } from "graphql";
import type { ConcreteEntity } from "../../schema-model/entity/ConcreteEntity";
import type { ConnectionQueryArgs } from "../../types";
import { toGlobalId } from "../../utils/global-ids";

/** Maps the database id field to globalId */
export function generateGlobalIdFieldResolver({ entity }: { entity: ConcreteEntity }) {
    return function resolve(source, _args: ConnectionQueryArgs, _ctx, _info: GraphQLResolveInfo) {
        const globalAttribute = entity.globalIdField;
        if (!globalAttribute) {
            throw new Error("Global Id Field not found");
        }

        const field = globalAttribute.name;
        const value = source[field] as string | number;

        const globalId = toGlobalId({
            typeName: entity.name,
            field,
            id: value,
        });
        return globalId;
    };
}

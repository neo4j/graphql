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

import type { UnionTypeDefinitionNode } from "graphql";
import type { Node } from "../classes";
import { Union } from "../classes/Union";

type Unions = {
    unions: Union[];
};

function getUnions(unionTypes: UnionTypeDefinitionNode[], options: { nodes: Node[] }): Unions {
    const result = { unions: [] } as Unions;

    return unionTypes.reduce((unions, type) => {
        const members: Node[] = [];

        (type.types || []).forEach((t) => {
            const member = options.nodes.find((n) => n.name === t.name.value);
            if (!member) {
                throw new Error(`Union type with name ${type.name.value} cannot find node with name ${t.name.value}`);
            }

            members.push(member);
        });

        unions.unions.push(
            new Union({
                name: type.name.value,
                description: type.description?.value,
                members,
            })
        );

        return unions;
    }, result);
}

export default getUnions;

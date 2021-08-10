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
import { execute } from "../../utils";
import { translateCount } from "../../translate";
import { Node } from "../../classes";
import { Context } from "../../types";

export default function countResolver({ node }: { node: Node }) {
    async function resolve(_root: any, _args: any, _context: unknown) {
        const context = _context as Context;
        const [cypher, params] = translateCount({ context, node });

        const result = await execute({
            cypher,
            params,
            defaultAccessMode: "READ",
            context,
            raw: true,
        });

        return result.records[0]._fields[0].toNumber();
    }

    return {
        type: `Int!`,
        resolve,
        args: { where: `${node.name}Where` },
    };
}

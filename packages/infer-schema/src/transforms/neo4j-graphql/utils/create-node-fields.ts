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

import Debug from "debug";
import Property from "../../../classes/Property";
import { NodeField } from "../NodeField";
import { DEBUG_INFER_SCHEMA } from "../../../constants";
import mapNeo4jToGraphQLType from "./map-neo4j-to-graphql-type";

const debug = Debug(DEBUG_INFER_SCHEMA);

export default function createNodeFields(propertyRows: Property[], elementType: string): NodeField[] {
    const out: NodeField[] = [];
    propertyRows.forEach((propertyRow) => {
        if (!propertyRow.types) {
            if (debug.enabled) {
                debug("%s", `No properties on ${elementType}. Skipping generation.`);
            }
            return;
        }
        if (propertyRow.types.length > 1) {
            if (debug.enabled) {
                debug(
                    "%s",
                    `Ambiguous types on ${elementType}.${propertyRow.name}. Fix the inconsistencies for this property to be included`
                );
            }
            return;
        }
        out.push(new NodeField(propertyRow.name, mapNeo4jToGraphQLType(propertyRow.types, propertyRow.mandatory)));
    });
    return out;
}

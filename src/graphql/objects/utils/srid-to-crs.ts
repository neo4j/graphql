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

import { integer } from "neo4j-driver";
import { isIntegerable } from "../../../schema/resolvers/field/numerical";

export function sridToCrs(srid: unknown): string {
    if (!isIntegerable(srid)) {
        return "";
    }

    const integerSrid = integer.toNumber(srid);

    switch (integerSrid) {
        case 4326:
            return "wgs-84";
        case 4979:
            return "wgs-84-3d";
        case 7203:
            return "cartesian";
        case 9157:
            return "cartesian-3d";
        default:
            return "";
    }
}

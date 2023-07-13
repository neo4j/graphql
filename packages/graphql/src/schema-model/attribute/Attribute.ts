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

import { Neo4jGraphQLSchemaValidationError } from "../../classes/Error";
import type { Annotation, Annotations } from "../annotation/Annotation";
import { annotationToKey } from "../annotation/Annotation";
import type { AttributeType } from "./AbstractAttribute";
import { AbstractAttribute } from "./AbstractAttribute";

// At this moment Attribute is a dummy class, most of the logic is shared logic between Attribute and AttributeModels defined in the AbstractAttribute class
export class Attribute extends AbstractAttribute {

    constructor({ name, annotations = [], type }: { name: string; annotations: Annotation[]; type: AttributeType }) {
        super({ name, type, annotations });
    }

    public clone(): Attribute {
        return new Attribute({
            name: this.name,
            annotations: Object.values(this.annotations),
            type: this.type,
        });
    }

}

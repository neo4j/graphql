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

import { RelationshipQueryDirectionOption } from "../../../src/constants";
import { defaultNestedOperations } from "../../../src/graphql/directives/relationship";
import type { RelationField } from "../../../src/types";
import { Builder } from "./builder";

export class RelationFieldBuilder extends Builder<RelationField, RelationField> {
    constructor(newOptions: Partial<RelationField> = {}) {
        super({
            direction: "OUT",
            type: "",
            fieldName: "",
            typeMeta: {
                name: "",
                required: false,
                pretty: "",
                input: {} as any,
            },
            selectableOptions: {
                onRead: true,
                onAggregate: true,
            },
            settableOptions: {
                onCreate: true,
                onUpdate: true,
            },
            otherDirectives: [],
            arguments: [],
            inherited: false,
            queryDirection: RelationshipQueryDirectionOption.DEFAULT_DIRECTED,
            nestedOperations: defaultNestedOperations,
            aggregate: true,
            ...newOptions,
        });
    }

    public with(newOptions: Partial<RelationField>): RelationFieldBuilder {
        this.options = { ...this.options, ...newOptions };
        return this;
    }

    public instance(): RelationField {
        return this.options;
    }
}

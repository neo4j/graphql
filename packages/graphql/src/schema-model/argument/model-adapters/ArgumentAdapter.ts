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

import type { AttributeType } from "../../attribute/AttributeType";
import { ListType } from "../../attribute/AttributeType";
import { AttributeTypeHelper } from "../../attribute/AttributeTypeHelper";
import type { Argument } from "../Argument";

// TODO: this file has a lot in common with AttributeAdapter
// if going to use this, design a solution to avoid this code duplication

export class ArgumentAdapter {
    public name: string;
    public type: AttributeType;
    public description?: string;
    public defaultValue?: string;
    public typeHelper: AttributeTypeHelper;
    private assertionOptions: {
        includeLists: boolean;
    };
    constructor(argument: Argument) {
        this.name = argument.name;
        this.type = argument.type;
        this.defaultValue = argument.defaultValue;
        this.description = argument.description;
        this.assertionOptions = {
            includeLists: true,
        };

        this.typeHelper = new AttributeTypeHelper(argument.type);
    }

    // Duplicate from AttributeAdapter
    getTypePrettyName(): string {
        if (!this.typeHelper.isList()) {
            return `${this.getTypeName()}${this.typeHelper.isRequired() ? "!" : ""}`;
        }
        const listType = this.type as ListType;
        if (listType.ofType instanceof ListType) {
            // matrix case
            return `[[${this.getTypeName()}${this.typeHelper.isListElementRequired() ? "!" : ""}]]${
                this.typeHelper.isRequired() ? "!" : ""
            }`;
        }
        return `[${this.getTypeName()}${this.typeHelper.isListElementRequired() ? "!" : ""}]${
            this.typeHelper.isRequired() ? "!" : ""
        }`;
    }

    getTypeName(): string {
        if (!this.typeHelper.isList()) {
            return this.type.name;
        }
        const listType = this.type as ListType;
        if (listType.ofType instanceof ListType) {
            // matrix case
            return listType.ofType.ofType.name;
        }
        return listType.ofType.name;
    }
}

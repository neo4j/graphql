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

import { plural } from "../../../schema-model/utils/string-manipulation";
import { upperFirst } from "../../../utils/upper-first";
import { EntityTypeNames } from "./EntityTypeNames";

/** Top level node typenames */
export class TopLevelEntityTypeNames extends EntityTypeNames {
    /** Top Level Query field */
    public get queryField(): string {
        return plural(this.entityName);
    }

    public get connectionOperation(): string {
        return `${this.entityName}Operation`;
    }

    public get operationWhere(): string {
        return `${this.entityName}OperationWhere`;
    }

    public get connection(): string {
        return `${this.entityName}Connection`;
    }

    public get connectionSort(): string {
        return `${this.entityName}ConnectionSort`;
    }

    public get edge(): string {
        return `${this.entityName}Edge`;
    }

    public get edgeSort(): string {
        return `${this.entityName}EdgeSort`;
    }

    public get edgeWhere(): string {
        return `${this.entityName}EdgeWhere`;
    }

    public get nodeWhere(): string {
        return `${this.entityName}Where`;
    }

    public get nodeSort(): string {
        return `${this.entityName}Sort`;
    }

    public get node(): string {
        return this.entityName;
    }

    /** Top Level Create field */
    public get createField(): string {
        return `create${upperFirst(plural(this.entityName))}`;
    }

    public get createNode(): string {
        return `${upperFirst(this.entityName)}CreateNode`;
    }

    public get createInput(): string {
        return `${upperFirst(this.entityName)}CreateInput`;
    }

    public get createResponse(): string {
        return `${upperFirst(this.entityName)}CreateResponse`;
    }

    public get createInfo(): string {
        return `${upperFirst(this.entityName)}CreateInfo`;
    }

    /** Top Level Delete field */
    public get deleteField(): string {
        return `delete${upperFirst(plural(this.entityName))}`;
    }

    public get deleteResponse(): string {
        return `${upperFirst(this.entityName)}DeleteResponse`;
    }

    public get deleteInfo(): string {
        return `${upperFirst(this.entityName)}DeleteInfo`;
    }
}

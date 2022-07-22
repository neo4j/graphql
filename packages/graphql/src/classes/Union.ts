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

import camelcase from "camelcase";
import pluralize from "pluralize";
import { AbstractGraphElement, AbstractGraphElementConstructor } from "./AbstractGraphElement";
import type Node from "./Node";

export interface UnionConstructor extends AbstractGraphElementConstructor {
    members: Node[];
}

export type RootTypeFieldNames = {
    read: string;
};

export class Union extends AbstractGraphElement {
    private members: Node[];
    public plural: string;

    constructor(input: UnionConstructor) {
        super({ name: input.name, description: input.description });

        this.members = input.members;
        this.plural = this.generatePlural();
    }

    public get rootTypeFieldNames(): RootTypeFieldNames {
        return {
            read: this.plural,
        };
    }

    public get whereTypeMeta() {
        return {
            name: `${this.name}TopLevelWhere`,
            fields: this.members.reduce((res, member) => {
                return {
                    ...res,
                    [member.name]: `${member.name}Where`,
                };
            }, {}),
        };
    }

    private generatePlural(): string {
        const name = this.name;

        const plural = pluralize(camelcase(name));

        return `${this.leadingUnderscores(name)}${plural}`;
    }

    private leadingUnderscores(name: string): string {
        const re = /^(_+).+/;
        const match = re.exec(name);
        return match?.[1] || "";
    }
}

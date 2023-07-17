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

import { generate } from "randomstring";
import camelcase from "camelcase";
import pluralize from "pluralize";

export class UniqueType {
    public readonly name: string;

    constructor(baseName: string) {
        this.name = `${generate({
            length: 8,
            charset: "alphabetic",
            readable: true,
        })}${baseName}`;
    }

    public get plural(): string {
        return pluralize(camelcase(this.name));
    }

    public get singular(): string {
        const singular = camelcase(this.name);

        return `${this.leadingUnderscores(this.name)}${singular}`;
    }

    public toString(): string {
        return this.name;
    }

    private leadingUnderscores(name: string): string {
        const re = /^(_+).+/;
        const match = re.exec(name);
        return match?.[1] || "";
    }
}

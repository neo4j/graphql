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

// This file should only be used for tests. As randomstring is a devDependecy
// eslint-disable-next-line import/no-extraneous-dependencies
import { generate } from "randomstring";
import pluralize from "pluralize";
import camelcase from "camelcase";
import { upperFirst } from "../../src/utils/upper-first";

type UniqueTypeOperations = {
    create: string;
    update: string;
    delete: string;
    aggregate: string;
    connection: string;
    subscribe: {
        created: string;
        updated: string;
        deleted: string;
        payload: {
            created: string;
            updated: string;
            deleted: string
        }
    };
};

type UniqueTypeFieldNames = {
    subscriptions: {
        created: string;
        updated: string;
        deleted: string;
    };
};

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

    public get operations(): UniqueTypeOperations {
        const pascalCasePlural = upperFirst(this.plural);
        const singular = camelcase(this.name);
        const pascalCaseSingular=upperFirst(singular)

        return {
            create: `create${pascalCasePlural}`,
            update: `update${pascalCasePlural}`,
            delete: `delete${pascalCasePlural}`,
            aggregate: `${this.plural}Aggregate`,
            connection: `${this.plural}Connection`,
            subscribe: {
                created: `${singular}Created`,
                updated: `${singular}Updated`,
                deleted: `${singular}Deleted`,
                payload: {
                    created: `created${pascalCaseSingular}`,
                    updated: `updated${pascalCaseSingular}`,
                    deleted: `deleted${pascalCaseSingular}`,
                }
            },
        };
    }

    public get fieldNames(): UniqueTypeFieldNames {
        const singular = upperFirst(camelcase(this.name));

        return {
            subscriptions: {
                created: `created${singular}`,
                updated: `updated${singular}`,
                deleted: `deleted${singular}`,
            },
        };
    }

    public toString(): string {
        return this.name;
    }
}

export function generateUniqueType(baseName: string): UniqueType {
    return new UniqueType(baseName);
}

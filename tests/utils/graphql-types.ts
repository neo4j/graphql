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
import { generate } from "randomstring";
import { leadingUnderscores } from "../../src/utils/leading-underscore";
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
        relationship_created: string;
        relationship_deleted: string;
        payload: {
            created: string;
            updated: string;
            deleted: string;
            relationship_created: string;
            relationship_deleted: string;
        };
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

    public get singular(): string {
        const singular = camelcase(this.name);

        return `${leadingUnderscores(this.name)}${singular}`;
    }

    public get operations(): UniqueTypeOperations {
        const pascalCasePlural = upperFirst(this.plural);
        const singular = camelcase(this.name);
        const pascalCaseSingular = upperFirst(singular);

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
                relationship_created: `${singular}RelationshipCreated`,
                relationship_deleted: `${singular}RelationshipDeleted`,
                payload: {
                    created: `created${pascalCaseSingular}`,
                    updated: `updated${pascalCaseSingular}`,
                    deleted: `deleted${pascalCaseSingular}`,
                    relationship_created: `${singular}`,
                    relationship_deleted: `${singular}`,
                },
            },
        };
    }

    public toString(): string {
        return this.name;
    }
}

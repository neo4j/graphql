/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
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
    aggregate: string; // TODO: remove
    connection: string;
    subscribe: {
        created: string;
        updated: string;
        deleted: string;
        payload: {
            created: string;
            updated: string;
            deleted: string;
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
                payload: {
                    created: `created${pascalCaseSingular}`,
                    updated: `updated${pascalCaseSingular}`,
                    deleted: `deleted${pascalCaseSingular}`,
                },
            },
        };
    }

    public toString(): string {
        return this.name;
    }
}

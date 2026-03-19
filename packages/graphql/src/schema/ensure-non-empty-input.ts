/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { InputTypeComposer, SchemaComposer } from "graphql-compose";
import { isString } from "../utils/utils";

export function ensureNonEmptyInput(composer: SchemaComposer, nameOrInput: string | InputTypeComposer<any>): void {
    const input = isString(nameOrInput) ? composer.getITC(nameOrInput) : nameOrInput;

    if (input.getFieldNames().length === 0) {
        const faqURL = `https://neo4j.com/docs/graphql-manual/current/troubleshooting/faqs/`;
        input.addFields({
            _emptyInput: {
                type: "Boolean",
                description:
                    `Appears because this input type would be empty otherwise because this type is ` +
                    `composed of just generated and/or relationship properties. See ${faqURL}`,
            },
        });
    }
}

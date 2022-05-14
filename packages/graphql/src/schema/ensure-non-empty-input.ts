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

import { InputTypeComposer, SchemaComposer } from "graphql-compose";
import { isString } from "../utils/utils";

export function ensureNonEmptyInput(composer: SchemaComposer, nameOrInput: string | InputTypeComposer<any>) {
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

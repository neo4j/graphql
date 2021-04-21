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

import { DefinitionNode, DocumentNode, print } from "graphql";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { SchemaComposer, printDirective, printEnum, printScalar } from "graphql-compose";
import * as scalars from "../scalars";
import { ScalarType } from "./scalars";
import * as enums from "./enums";
import * as directives from "./directives";

function filterDocument(document: DocumentNode) {
    return {
        ...document,
        definitions: document.definitions.reduce((res: DefinitionNode[], def) => {
            if (def.kind !== "ObjectTypeDefinition" && def.kind !== "InterfaceTypeDefinition") {
                return [...res, def];
            }

            return [
                ...res,
                {
                    ...def,
                    directives: def.directives?.filter((x) => !["auth"].includes(x.name.value)),
                    fields: def.fields?.map((f) => ({
                        ...f,
                        directives: f.directives?.filter((x) => !["auth"].includes(x.name.value)),
                    })),
                },
            ];
        }, []),
    };
}

function validateSchema(document: DocumentNode): void {
    const composer = new SchemaComposer();
    const doc = print(filterDocument(document));

    composer.addTypeDefs(printScalar(ScalarType));
    Object.values(scalars).forEach((scalar) => {
        composer.addTypeDefs(printScalar(scalar));
    });

    Object.values(enums).forEach((e) => {
        composer.addTypeDefs(printEnum(e));
    });

    Object.values(directives).forEach((directive) => {
        composer.addTypeDefs(printDirective(directive));
    });

    composer.addTypeDefs(doc);

    // this is fake
    composer.Query.addFields({
        fake: {
            type: "Boolean",
            resolve: () => false,
        },
    });

    // add directives to new document
    // add fake query to document to make it a valid schema

    makeExecutableSchema({
        typeDefs: composer.toSDL(),
        resolvers: composer.getResolveMethods(),
    });
}

export default validateSchema;

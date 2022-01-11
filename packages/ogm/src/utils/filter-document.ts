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

import { DefinitionNode, DocumentNode, FieldDefinitionNode } from "graphql";
import { Neo4jGraphQLConstructor } from "@neo4j/graphql";
import { mergeTypeDefs } from "@graphql-tools/merge";

const excludedDirectives = ["auth", "exclude", "private", "readonly", "writeonly"];

function filterDocument(typeDefs: Neo4jGraphQLConstructor["typeDefs"]): DocumentNode {
    const merged = mergeTypeDefs(Array.isArray(typeDefs) ? (typeDefs as string[]) : [typeDefs as string]);

    return {
        ...merged,
        definitions: merged.definitions.reduce((res: DefinitionNode[], def) => {
            if (def.kind !== "ObjectTypeDefinition" && def.kind !== "InterfaceTypeDefinition") {
                return [...res, def];
            }

            if (["Query", "Subscription", "Mutation"].includes(def.name.value)) {
                return [...res, def];
            }

            return [
                ...res,
                {
                    ...def,
                    directives: def.directives?.filter((x) => !excludedDirectives.includes(x.name.value)),
                    fields: def.fields?.reduce(
                        (r: FieldDefinitionNode[], f) => [
                            ...r,
                            {
                                ...f,
                                directives: f.directives?.filter((x) => !excludedDirectives.includes(x.name.value)),
                            },
                        ],
                        []
                    ),
                },
            ];
        }, []),
    };
}

export default filterDocument;

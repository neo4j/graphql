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

import {
    Kind,
    type DefinitionNode,
    type DocumentNode,
    type FieldDefinitionNode,
} from "graphql";
import type { Neo4jGraphQLConstructor } from "@neo4j/graphql";
import { mergeTypeDefs } from "@graphql-tools/merge";

const excludedDirectives = [
    "auth",
    "authentication",
    "authorization",
    "subscriptionsAuthorization",
    "exclude",
    "private",
    "readonly",
    "writeonly",
    "query",
    "mutation",
    "subscription",
    "filterable",
    "selectable",
    "settable",
];

function filterDocument(typeDefs: Neo4jGraphQLConstructor["typeDefs"]): DocumentNode {
    // hack to keep aggregation enabled for OGM
    const schemaExtension = `
    extend schema @query(read: true, aggregate: true) 
        @mutation(operations: [CREATE, UPDATE, DELETE]) 
        @subscription(operations: [CREATE, UPDATE, DELETE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP])`;
    const merged = mergeTypeDefs(
        Array.isArray(typeDefs) ? (typeDefs as string[]).concat(schemaExtension) : [typeDefs as string, schemaExtension]
    );

    return {
        ...merged,
        definitions: merged.definitions.reduce((res: DefinitionNode[], def) => {
            if (def.kind !== Kind.OBJECT_TYPE_DEFINITION && def.kind !== Kind.INTERFACE_TYPE_DEFINITION) {
                return [...res, def];
            }

            if (["Query", "Subscription", "Mutation"].includes(def.name.value)) {
                return [...res, def];
            }
            // this is the relationship aggregate argument used to enable aggregation for OGM whatever the user provides it or not
            const relationshipAggregateArgument = {
                kind: Kind.ARGUMENT,
                name: {
                    kind: Kind.NAME,
                    value: "aggregate",
                },
                value: {
                    kind: Kind.BOOLEAN,
                    value: true,
                },
            };

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
                                directives: f.directives
                                    ?.filter((x) => !excludedDirectives.includes(x.name.value))
                                    .map((x) => {
                                        if (x.name.value === "relationship") {
                                            const args = (x.arguments ? x.arguments?.filter(
                                                (arg) => arg.name.value !== "aggregate"
                                            ) : []) as any[]; // cast to any as this type is changing between GraphQL versions
                                            args?.push(relationshipAggregateArgument);
                                            return {
                                                ...x,
                                                arguments: args,
                                            };
                                        }
                                        return x;
                                    }),
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

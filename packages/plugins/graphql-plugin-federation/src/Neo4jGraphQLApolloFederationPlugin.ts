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

import { mergeTypeDefs } from "@graphql-tools/merge";
import type { IResolvers, TypeSource } from "@graphql-tools/utils";
import { OGM } from "@neo4j/graphql-ogm";
import type { SchemaDefinition } from "@neo4j/graphql/src";
import { ConstDirectiveNode, Kind } from "graphql";

type FederationDirective =
    | "@key"
    | "@shareable"
    | "@inaccessible"
    | "@override"
    | "@external"
    | "@provides"
    | "@requires"
    | "@tag";

const isFederationDirective = (directive: string): directive is FederationDirective =>
    ["@key", "@shareable", "@inaccessible", "@override", "@external", "@provides", "@requires", "@tag"].includes(
        directive
    );

export class Neo4jGraphQLApolloFederationPlugin {
    private importArgument: Map<
        FederationDirective,
        FederationDirective | string | `federation__${FederationDirective}`
    >;
    private ogm: OGM;

    constructor(typeDefs: TypeSource) {
        this.importArgument = new Map([
            ["@key", "@federation__key"],
            ["@shareable", "@federation__shareable"],
            ["@inaccessible", "@federation__inaccessible"],
            ["@override", "@federation__override"],
            ["@external", "@federation__external"],
            ["@provides", "@federation__provides"],
            ["@requires", "@federation__requires"],
            ["@tag", "@federation__tag"],
        ]);
        this.ogm = new OGM({ typeDefs });
    }

    public init(): Promise<void> {
        return this.ogm.init();
    }

    public augmentSchemaDefinition(typeDefs: TypeSource): SchemaDefinition {
        const resolvers = this.getReferenceResolvers(typeDefs);

        return { typeDefs, resolvers };
    }

    private getReferenceResolvers(typeDefs: TypeSource): IResolvers {
        const resolverMap: IResolvers = {};

        const document = mergeTypeDefs(typeDefs);

        document.definitions.forEach((def) => {
            if (def.kind === Kind.OBJECT_TYPE_DEFINITION) {
                resolverMap[def.name.value] = {
                    __resolveReference: this.getReferenceResolver(def.name.value),
                };
            }
        });

        return resolverMap;
    }

    private getReferenceResolver(typename: string): (reference, context) => Promise<unknown> {
        const __resolveReference = (reference, context): Promise<unknown> => {
            const model = this.ogm.model(typename);
            return model.find({ where: reference, context });
        };
        return __resolveReference;
    }

    private findFederationLinkDirective(typeDefs: TypeSource): ConstDirectiveNode | undefined {
        const document = mergeTypeDefs(typeDefs);

        for (const definition of document.definitions) {
            if (definition.kind === Kind.SCHEMA_DEFINITION || definition.kind === Kind.SCHEMA_EXTENSION) {
                if (definition.directives) {
                    for (const directive of definition.directives) {
                        if (directive.name.value === "link") {
                            if (directive.arguments) {
                                for (const argument of directive.arguments) {
                                    if (argument.name.value === "url") {
                                        if (argument.value.kind === Kind.STRING) {
                                            if (argument.value.value === "https://specs.apollo.dev/federation/v2.0") {
                                                return directive;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    private parseLinkImportArgument(directive: ConstDirectiveNode): void {
        const importArgument = directive.arguments?.find((arg) => arg.name.value === "import");

        if (importArgument) {
            if (importArgument.value.kind === Kind.LIST) {
                for (const value of importArgument.value.values) {
                    if (value.kind === Kind.STRING) {
                        if (!isFederationDirective(value.value)) {
                            throw new Error(`Encountered unknown Apollo Federation directive ${value.value}`);
                        }

                        this.importArgument.set(value.value, value.value);
                    }

                    if (value.kind === Kind.OBJECT) {
                        const name = value.fields.find((f) => f.name.value === "name");
                        const as = value.fields.find((f) => f.name.value === "as");

                        if (name?.value.kind === Kind.STRING) {
                            if (!isFederationDirective(name.value.value)) {
                                throw new Error(`Encountered unknown Apollo Federation directive ${name.value.value}`);
                            }

                            if (as?.value.kind !== Kind.STRING) {
                                throw new Error(`Alias for directive ${name.value.value} is not of type string`);
                            }

                            this.importArgument.set(name.value.value, as.value.value);
                        }
                    }
                }
            }
        }
    }
}

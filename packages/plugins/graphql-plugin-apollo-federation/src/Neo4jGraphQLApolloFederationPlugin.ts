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

import { buildSubgraphSchema } from "@apollo/subgraph";
import { mergeTypeDefs } from "@graphql-tools/merge";
import type { IExecutableSchemaDefinition } from "@graphql-tools/schema";
import { IResolvers, makeDirectiveNode, TypeSource } from "@graphql-tools/utils";
import { OGM } from "@neo4j/graphql-ogm";
import type { SchemaDefinition, Neo4jGraphQLConstructor } from "@neo4j/graphql";
import { ConstDirectiveNode, DefinitionNode, DocumentNode, FieldDefinitionNode, GraphQLSchema, Kind } from "graphql";
import type * as neo4j from "neo4j-driver";

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

    constructor(typeDefs: TypeSource, driver: neo4j.Driver, database?: string) {
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

        const linkDirective = this.findFederationLinkDirective(typeDefs);
        if (!linkDirective) {
            throw new Error(`typeDefs must contain \`@link\` schema extension to be used with Apollo Federation`);
        }
        this.parseLinkImportArgument(linkDirective);

        const filteredTypeDefs = this.filterFederationDirectives(typeDefs);

        const ogmOptions: Record<string, any> = { typeDefs: filteredTypeDefs, driver };
        if (database) {
            ogmOptions.config = {
                driverConfig: {
                    database,
                },
            };
        }

        this.ogm = new OGM(ogmOptions as Neo4jGraphQLConstructor);
    }

    public init(): Promise<void> {
        return this.ogm.init();
    }

    public augmentSchemaDefinition(typeDefs: TypeSource): IExecutableSchemaDefinition {
        const resolvers = this.getReferenceResolvers(typeDefs);

        return { typeDefs, resolvers };
    }

    public augmentGeneratedSchemaDefinition(typeDefs: DocumentNode): DocumentNode {
        const definitions: DefinitionNode[] = [];

        const shareable = makeDirectiveNode(
            (this.importArgument.get("@shareable") as string).replace("@", ""),
            {}
        ) as ConstDirectiveNode;

        // This is a really filthy hack to apply @shareable
        for (const definition of typeDefs.definitions) {
            if (definition.kind === Kind.OBJECT_TYPE_DEFINITION) {
                if (
                    [
                        "CreateInfo",
                        "DeleteInfo",
                        "PageInfo",
                        "UpdateInfo",
                        "StringAggregateSelectionNullable",
                        "StringAggregateSelectionNonNullable",
                        "IDAggregateSelectionNonNullable",
                        "Query",
                        "Mutation",
                    ].includes(definition.name.value) ||
                    definition.name.value.endsWith("MutationResponse") ||
                    definition.name.value.endsWith("Connection") ||
                    definition.name.value.endsWith("AggregateSelection") ||
                    definition.name.value.endsWith("Edge")
                ) {
                    if (definition.directives) {
                        definitions.push({
                            ...definition,
                            directives: [...definition.directives, shareable],
                        });
                    } else {
                        definitions.push({
                            ...definition,
                            directives: [shareable],
                        });
                    }
                } else {
                    definitions.push(definition);
                }
            } else {
                definitions.push(definition);
            }
        }

        return {
            ...typeDefs,
            definitions,
        };
    }

    public buildSubgraphSchema({ typeDefs, resolvers }: SchemaDefinition): GraphQLSchema {
        return buildSubgraphSchema({ typeDefs, resolvers: resolvers as Record<string, any> });
    }

    private getReferenceResolvers(typeDefs: TypeSource): IResolvers {
        const resolverMap: IResolvers = {};

        const document = mergeTypeDefs(typeDefs);

        document.definitions.forEach((def) => {
            if (def.kind === Kind.OBJECT_TYPE_DEFINITION) {
                resolverMap[def.name.value] = {
                    __resolveReference: this.getReferenceResolver(),
                };
            }
        });

        return resolverMap;
    }

    private getReferenceResolver(): (reference, context) => Promise<unknown | undefined> {
        const __resolveReference = async (reference, context): Promise<unknown> => {
            const { __typename, ...where } = reference;
            const model = this.ogm.model(__typename);
            const records = await model.find({ where, context });
            if (records[0]) {
                return records[0];
            }
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

    private filterFederationDirectives(typeDefs: TypeSource): DocumentNode {
        const document = mergeTypeDefs(typeDefs);
        const federationDirectives = Array.from(this.importArgument.values());

        const definitions: DefinitionNode[] = [];

        for (const definition of document.definitions) {
            if (definition.kind === Kind.SCHEMA_DEFINITION || definition.kind === Kind.SCHEMA_EXTENSION) {
                continue;
            } else if (
                definition.kind === Kind.OBJECT_TYPE_DEFINITION ||
                definition.kind === Kind.OBJECT_TYPE_EXTENSION ||
                definition.kind === Kind.INTERFACE_TYPE_DEFINITION ||
                definition.kind === Kind.INTERFACE_TYPE_EXTENSION
            ) {
                if (definition.directives) {
                    if (definition.fields) {
                        const fields: FieldDefinitionNode[] = [];

                        for (const field of definition.fields) {
                            if (field.directives) {
                                fields.push({
                                    ...field,
                                    directives: field.directives.filter((directive) =>
                                        federationDirectives.includes(directive.name.value)
                                    ),
                                });
                            } else {
                                fields.push(field);
                            }
                        }

                        definitions.push({
                            ...definition,
                            directives: definition.directives.filter((directive) =>
                                federationDirectives.includes(directive.name.value)
                            ),
                            fields,
                        });
                    } else {
                        definitions.push({
                            ...definition,
                            directives: definition.directives.filter((directive) =>
                                federationDirectives.includes(directive.name.value)
                            ),
                        });
                    }
                } else {
                    definitions.push(definition);
                }
            } else {
                // TODO: scalars, enums, enum values, unions
                definitions.push(definition);
            }
        }

        return {
            ...document,
            definitions,
        };
    }
}

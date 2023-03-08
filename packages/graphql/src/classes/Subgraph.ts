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
import type { IResolvers, TypeSource } from "@graphql-tools/utils";
import {
    ConstDirectiveNode,
    DocumentNode,
    GraphQLDirective,
    GraphQLNamedType,
    GraphQLResolveInfo,
    Kind,
    parse,
    print,
    SchemaExtensionNode,
} from "graphql";
import type * as neo4j from "neo4j-driver";
import { translateResolveReference } from "../translate/translate-resolve-reference";
import type { Context, Node } from "../types";
import { execute } from "../utils";
import getNeo4jResolveTree from "../utils/get-neo4j-resolve-tree";
import { Executor } from "./Executor";

// TODO fetch the directive names from the spec
const federationDirectiveNames = [
    "key",
    "extends",
    "shareable",
    "inaccessible",
    "override",
    "external",
    "provides",
    "requires",
    "tag",
    "composeDirective",
    "interfaceObject",
] as const;

type FederationDirectiveName = (typeof federationDirectiveNames)[number];

type FullyQualifiedFederationDirectiveName = `federation__${FederationDirectiveName}`;

const isFederationDirectiveName = (name): name is FederationDirectiveName => federationDirectiveNames.includes(name);

export class Subgraph {
    private importArgument: Map<
        FederationDirectiveName,
        FederationDirectiveName | FullyQualifiedFederationDirectiveName | string
    >;
    private typeDefs: TypeSource;
    private linkExtension: SchemaExtensionNode;

    constructor(typeDefs: TypeSource) {
        this.typeDefs = typeDefs;

        this.importArgument = new Map([
            ["key", "federation__key"],
            ["extends", "federation__extends"],
            ["shareable", "federation__shareable"],
            ["inaccessible", "federation__inaccessible"],
            ["override", "federation__override"],
            ["external", "federation__external"],
            ["provides", "federation__provides"],
            ["requires", "federation__requires"],
            ["tag", "federation__tag"],
            ["composeDirective", "federation__composeDirective"],
            ["interfaceObject", "federation__interfaceObject"],
        ]);

        const linkMeta = this.findFederationLinkMeta(typeDefs);
        if (!linkMeta) {
            throw new Error(`typeDefs must contain \`@link\` schema extension to be used with Apollo Federation`);
        }
        const { extension, directive: linkDirective } = linkMeta;

        this.linkExtension = extension;

        this.parseLinkImportArgument(linkDirective);
    }

    public getFullyQualifiedDirectiveName(name: FederationDirectiveName): string {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return this.importArgument.get(name)!;
    }

    public buildSchema({ typeDefs, resolvers }: { typeDefs: DocumentNode; resolvers: Record<string, any> }) {
        return buildSubgraphSchema({
            typeDefs,
            resolvers,
        });
    }

    public getReferenceResolvers(nodes: Node[], driver: neo4j.Driver): IResolvers {
        const resolverMap: IResolvers = {};

        const document = mergeTypeDefs(this.typeDefs);

        document.definitions.forEach((def) => {
            if (def.kind === Kind.OBJECT_TYPE_DEFINITION) {
                resolverMap[def.name.value] = {
                    __resolveReference: this.getReferenceResolver(nodes, driver),
                };
            }
        });

        return resolverMap;
    }

    private getReferenceResolver(nodes: Node[], driver: neo4j.Driver): (reference, context, info) => Promise<unknown> {
        const __resolveReference = async (reference, _context, info: GraphQLResolveInfo): Promise<unknown> => {
            const { __typename } = reference;

            const node = nodes.find((n) => n.name === __typename);

            if (!node) {
                throw new Error("Unable to find matching node");
            }

            const executor = new Executor({ executionContext: driver });

            const context = _context as Context;
            context.resolveTree = getNeo4jResolveTree(info);
            context.executor = executor;
            context.nodes = nodes;

            const { cypher, params } = translateResolveReference({ context, node, reference });

            const executeResult = await execute({
                cypher,
                params,
                defaultAccessMode: "READ",
                context,
            });

            return executeResult.records[0].this;
        };
        return __resolveReference;
    }

    public getValidationDefinitions(): {
        directives: Array<GraphQLDirective>;
        types: Array<GraphQLNamedType>;
    } {
        // Remove any operations from the extension - we only care for the `@link` directive
        const emptyExtension: SchemaExtensionNode = {
            ...this.linkExtension,
            operationTypes: [],
        };

        const document = parse(print(emptyExtension));

        const schema = buildSubgraphSchema({ typeDefs: document });

        const config = schema.toConfig();

        const directives = config.directives;
        const types = config.types;

        const enums = types.filter((t) => t.astNode?.kind === Kind.ENUM_TYPE_DEFINITION);
        const scalars = types.filter((t) => t.astNode?.kind === Kind.SCALAR_TYPE_DEFINITION);

        return {
            directives: [...directives],
            types: [...enums, ...scalars],
        };
    }

    private findFederationLinkMeta(
        typeDefs: TypeSource
    ): { extension: SchemaExtensionNode; directive: ConstDirectiveNode } | undefined {
        const document = mergeTypeDefs(typeDefs);

        for (const definition of document.definitions) {
            if (definition.kind === Kind.SCHEMA_EXTENSION && definition.directives) {
                for (const directive of definition.directives) {
                    if (directive.name.value === "link" && directive.arguments) {
                        for (const argument of directive.arguments) {
                            if (argument.name.value === "url" && argument.value.kind === Kind.STRING) {
                                const url = argument.value.value;
                                if (url.startsWith("https://specs.apollo.dev/federation/v2")) {
                                    return { extension: definition, directive };
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    private trimDirectiveName(name: string): string {
        return name.replace("@", "");
    }

    private parseLinkImportArgument(directive: ConstDirectiveNode): void {
        const argument = directive.arguments?.find((arg) => arg.name.value === "import");

        if (argument) {
            if (argument.value.kind === Kind.LIST) {
                for (const value of argument.value.values) {
                    if (value.kind === Kind.STRING) {
                        const trimmedName = this.trimDirectiveName(value.value);

                        if (!isFederationDirectiveName(trimmedName)) {
                            throw new Error(`Encountered unknown Apollo Federation directive ${value.value}`);
                        }

                        this.importArgument.set(trimmedName, trimmedName);
                    }

                    if (value.kind === Kind.OBJECT) {
                        const name = value.fields.find((f) => f.name.value === "name");
                        const as = value.fields.find((f) => f.name.value === "as");

                        if (name?.value.kind === Kind.STRING) {
                            const trimmedName = this.trimDirectiveName(name.value.value);

                            if (!isFederationDirectiveName(trimmedName)) {
                                throw new Error(`Encountered unknown Apollo Federation directive ${name.value.value}`);
                            }

                            if (as?.value.kind !== Kind.STRING) {
                                throw new Error(`Alias for directive ${name.value.value} is not of type string`);
                            }

                            this.importArgument.set(trimmedName, this.trimDirectiveName(as.value.value));
                        }
                    }
                }
            }
        }
    }
}

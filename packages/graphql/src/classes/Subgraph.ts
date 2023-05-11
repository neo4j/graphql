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
import type {
    ConstDirectiveNode,
    DocumentNode,
    GraphQLDirective,
    GraphQLNamedType,
    GraphQLResolveInfo,
    SchemaExtensionNode,
} from "graphql";
import { Kind, parse, print } from "graphql";
import type { Neo4jGraphQLSchemaModel } from "../schema-model/Neo4jGraphQLSchemaModel";
import { translateResolveReference } from "../translate/translate-resolve-reference";
import type { Context, Node } from "../types";
import { execute } from "../utils";
import getNeo4jResolveTree from "../utils/get-neo4j-resolve-tree";

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
];

type FederationDirectiveName = (typeof federationDirectiveNames)[number];

type FullyQualifiedFederationDirectiveName = `federation__${FederationDirectiveName}`;

type ReferenceResolver = (reference, context: Context, info: GraphQLResolveInfo) => Promise<unknown>;

const isFederationDirectiveName = (name: string): name is FederationDirectiveName =>
    federationDirectiveNames.includes(name);

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

    public getReferenceResolvers(nodes: Node[], schemaModel: Neo4jGraphQLSchemaModel): IResolvers {
        const resolverMap: IResolvers = {};

        const document = mergeTypeDefs(this.typeDefs);

        document.definitions.forEach((def) => {
            if (def.kind === Kind.OBJECT_TYPE_DEFINITION) {
                const entity = schemaModel.getEntity(def.name.value);

                if (schemaModel.isConcreteEntity(entity)) {
                    const keyAnnotation = entity.annotations.key;

                    // If there is a @key directive with `resolvable` set to false, then do not add __resolveReference
                    if (keyAnnotation && keyAnnotation.resolvable === false) {
                        return;
                    }
                }

                resolverMap[def.name.value] = {
                    __resolveReference: this.getReferenceResolver(nodes),
                };
            }
        });

        return resolverMap;
    }

    private getReferenceResolver(nodes: Node[]): ReferenceResolver {
        const __resolveReference = async (reference, context: Context, info: GraphQLResolveInfo): Promise<unknown> => {
            const { __typename } = reference;

            const node = nodes.find((n) => n.name === __typename);

            if (!node) {
                throw new Error("Unable to find matching node");
            }

            context.resolveTree = getNeo4jResolveTree(info);

            const { cypher, params } = translateResolveReference({ context, node, reference });

            const executeResult = await execute({
                cypher,
                params,
                defaultAccessMode: "READ",
                context,
            });

            return executeResult.records[0]?.this;
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

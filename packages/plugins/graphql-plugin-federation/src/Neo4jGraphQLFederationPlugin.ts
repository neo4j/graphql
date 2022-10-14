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
import type { GraphQLResolverMap, GraphQLSchemaModule } from "@apollo/subgraph/dist/schema-helper";
import { mergeTypeDefs } from "@graphql-tools/merge";
import { getResolversFromSchema, IResolvers, printSchemaWithDirectives, TypeSource } from "@graphql-tools/utils";
import { OGM } from "@neo4j/graphql-ogm";
import type { OGMConstructor } from "@neo4j/graphql-ogm/dist/classes/OGM";
import { concatAST, DocumentNode, GraphQLSchema, Kind, print } from "graphql";

type FederationDirective =
    | "@key"
    | "@shareable"
    | "@inaccessible"
    | "@override"
    | "@external"
    | "@provides"
    | "@requires"
    | "@tag";

type FederationDirectiveAlias = `@${string}`;

type RenamedFederationDirective = {
    name: FederationDirective;
    as: FederationDirectiveAlias;
};

const isRenamedFederationDirective = (d: any): d is RenamedFederationDirective => {
    return typeof d.as === "string";
};

type FederationDirectiveDefiniton = FederationDirective | RenamedFederationDirective;

type TypeDefsAndResolvers = {
    typeDefs: TypeSource;
    resolvers: IResolvers;
};

export interface FederationPluginInput extends OGMConstructor {
    directives: FederationDirectiveDefiniton[];
}

class Neo4jGraphQLFederationPlugin {
    private ogm: OGM;
    private directives: FederationDirectiveDefiniton[];

    // private typeDefs: TypeSource;
    // private resolvers: IResolvers;

    constructor(input: FederationPluginInput) {
        this.ogm = new OGM({ typeDefs: input.typeDefs });
        this.directives = input.directives;
    }

    /*
        Lifecycle:

        Add extension

        Create resolveReference

        Call buildSubgraphSchema
    */

    augmentUserInput(typeDefs: TypeSource): TypeSource {
        return [this.getExtensionString(), typeDefs];
    }

    getResolvers(typeDefs: TypeSource) {
        const resolverMap = {};

        const keyDirectiveName = this.getKeyDirectiveNameValue();

        if (keyDirectiveName === undefined) {
            return resolverMap;
        }

        const document = mergeTypeDefs(typeDefs);

        document.definitions.forEach((def) => {
            if (def.kind === Kind.OBJECT_TYPE_DEFINITION || def.kind === Kind.OBJECT_TYPE_EXTENSION) {
                if (!resolverMap[def.name.value]) {
                    def.directives?.forEach((d) => {
                        if (d.name.value === keyDirectiveName) {
                            resolverMap[def.name.value] = {
                                __resolveReference: this.getResolveReference(def.name.value),
                            };
                        }
                    });
                }
            }
        });

        return resolverMap;
    }

    getTypeDefsAndResolvers(typeDefs: TypeSource): TypeDefsAndResolvers {
        const resolverMap = {};

        const keyDirectiveName = this.getKeyDirectiveNameValue();

        // if (keyDirectiveName === undefined) {
        //     return resolverMap;
        // }
        const document = mergeTypeDefs(typeDefs);

        document.definitions.forEach((def) => {
            if (def.kind === Kind.OBJECT_TYPE_DEFINITION || def.kind === Kind.OBJECT_TYPE_EXTENSION) {
                if (!resolverMap[def.name.value]) {
                    def.directives?.forEach((d) => {
                        console.log(`${d.name.value}, ${keyDirectiveName}`);
                        if (d.name.value === keyDirectiveName) {
                            resolverMap[def.name.value] = {
                                __resolveReference: this.getResolveReference(def.name.value),
                            };
                        }
                    });
                }
            }
        });

        console.log(print(document));

        console.log(resolverMap);

        const schema = buildSubgraphSchema({
            typeDefs: mergeTypeDefs([this.getExtensionString(), typeDefs]),
            resolvers: resolverMap,
        });

        const resolvers = getResolversFromSchema(schema);

        const t = printSchemaWithDirectives(schema);

        return { typeDefs: t, resolvers };
    }

    getResolveReference(typename: string) {
        const __resolveReference = (reference, context): Promise<any> => {
            const model = this.ogm.model(typename);
            return model.find({ where: reference, context });
        };
        return __resolveReference;
    }

    getSchema(
        modulesOrSDL:
            | (GraphQLSchemaModule | DocumentNode)[]
            | DocumentNode
            | {
                  typeDefs: DocumentNode | DocumentNode[];
                  resolvers?: GraphQLResolverMap<unknown>;
              }
    ): GraphQLSchema {
        return buildSubgraphSchema(modulesOrSDL);
    }

    private getExtensionString(): string {
        const directiveStrings = this.directives.map((d) => {
            if (isRenamedFederationDirective(d)) {
                return `{ name: "${d.name}", as: "${d.as}" }`;
            }
            return `"${d}"`;
        });

        return `extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: [${directiveStrings.join(
            ", "
        )}])`;
    }

    private getKeyDirectiveNameValue(): string {
        const keyDirective = this.directives.find((d) => {
            if (isRenamedFederationDirective(d)) {
                return d.name === "@key";
            }
            return d === "@key";
        });

        let name: string;

        if (isRenamedFederationDirective(keyDirective)) {
            name = keyDirective.as;
        }

        name = (keyDirective || "@federation__key") as string;

        return name.replace("@", "");
    }
}

export default Neo4jGraphQLFederationPlugin;

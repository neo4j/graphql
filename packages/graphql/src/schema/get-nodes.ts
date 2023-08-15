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

import type { IResolvers } from "@graphql-tools/utils";
import type { DirectiveNode, NamedTypeNode } from "graphql";
import type { Exclude } from "../classes";
import { Node } from "../classes";
import type { NodeDirective } from "../classes/NodeDirective";
import type { QueryOptionsDirective } from "../classes/QueryOptionsDirective";
import type { FullText, Neo4jGraphQLCallbacks } from "../types";
import { asArray } from "../utils/utils";
import type { DefinitionNodes } from "./get-definition-nodes";
import getObjFieldMeta from "./get-obj-field-meta";
import parseExcludeDirective from "./parse-exclude-directive";
import parseNodeDirective from "./parse-node-directive";
import parseFulltextDirective from "./parse/parse-fulltext-directive";
import parsePluralDirective from "./parse/parse-plural-directive";
import { parseQueryOptionsDirective } from "./parse/parse-query-options-directive";
import { schemaConfigurationFromObjectTypeDefinition } from "./schema-configuration";

type Nodes = {
    nodes: Node[];
    pointInTypeDefs: boolean;
    cartesianPointInTypeDefs: boolean;
    floatWhereInTypeDefs: boolean;
    relationshipPropertyInterfaceNames: Set<string>;
    interfaceRelationshipNames: Set<string>;
};

function getNodes(
    definitionNodes: DefinitionNodes,
    options: {
        callbacks?: Neo4jGraphQLCallbacks;
        userCustomResolvers?: IResolvers | Array<IResolvers>;
    }
): Nodes {
    let pointInTypeDefs = false;
    let cartesianPointInTypeDefs = false;
    let floatWhereInTypeDefs = false;

    const relationshipPropertyInterfaceNames = new Set<string>();
    const interfaceRelationshipNames = new Set<string>();

    const nodes = definitionNodes.objectTypes.map((definition) => {
        const otherDirectives = (definition.directives || []).filter(
            (x) =>
                ![
                    "authorization",
                    "authentication",
                    "exclude",
                    "node",
                    "fulltext",
                    "queryOptions",
                    "plural",
                    "shareable",
                    "subscriptionsAuthorization",
                    "deprecated",
                    "query",
                    "mutation",
                    "subscription",
                    "jwt",
                ].includes(x.name.value)
        );
        const propagatedDirectives = (definition.directives || []).filter((x) =>
            ["deprecated", "shareable"].includes(x.name.value)
        );

        const excludeDirective = (definition.directives || []).find((x) => x.name.value === "exclude");
        const nodeDirectiveDefinition = (definition.directives || []).find((x) => x.name.value === "node");
        const pluralDirectiveDefinition = (definition.directives || []).find((x) => x.name.value === "plural");
        const fulltextDirectiveDefinition = (definition.directives || []).find((x) => x.name.value === "fulltext");
        const queryOptionsDirectiveDefinition = (definition.directives || []).find(
            (x) => x.name.value === "queryOptions"
        );
        const nodeInterfaces = [...(definition.interfaces || [])] as NamedTypeNode[];

        const { interfaceExcludeDirectives } = nodeInterfaces.reduce<{
            interfaceAuthDirectives: DirectiveNode[];
            interfaceExcludeDirectives: DirectiveNode[];
        }>(
            (res, interfaceName) => {
                const iface = definitionNodes.interfaceTypes.find((i) => i.name.value === interfaceName.name.value);

                if (iface) {
                    const interfaceExcludeDirective = (iface.directives || []).find((x) => x.name.value === "exclude");

                    if (interfaceExcludeDirective) {
                        res.interfaceExcludeDirectives.push(interfaceExcludeDirective);
                    }
                }

                return res;
            },
            { interfaceAuthDirectives: [], interfaceExcludeDirectives: [] }
        );

        let exclude: Exclude;
        if (excludeDirective || interfaceExcludeDirectives.length) {
            exclude = parseExcludeDirective(excludeDirective || interfaceExcludeDirectives[0]);
        }

        const schemaConfiguration = schemaConfigurationFromObjectTypeDefinition(definition);

        let nodeDirective: NodeDirective;
        if (nodeDirectiveDefinition) {
            nodeDirective = parseNodeDirective(nodeDirectiveDefinition);
        }

        const userCustomResolvers = asArray(options.userCustomResolvers);
        const customResolvers = userCustomResolvers.find((r) => !!r[definition.name.value])?.[
            definition.name.value
        ] as IResolvers;

        const nodeFields = getObjFieldMeta({
            obj: definition,
            enums: definitionNodes.enumTypes,
            interfaces: definitionNodes.interfaceTypes,
            objects: definitionNodes.objectTypes,
            scalars: definitionNodes.scalarTypes,
            unions: definitionNodes.unionTypes,
            callbacks: options.callbacks,
            customResolvers,
        });

        let fulltextDirective: FullText;
        if (fulltextDirectiveDefinition) {
            fulltextDirective = parseFulltextDirective({
                directive: fulltextDirectiveDefinition,
                nodeFields,
                definition,
            });
            floatWhereInTypeDefs = true;
        }

        let queryOptionsDirective: QueryOptionsDirective | undefined;
        if (queryOptionsDirectiveDefinition) {
            queryOptionsDirective = parseQueryOptionsDirective({
                directive: queryOptionsDirectiveDefinition,
                definition,
            });
        }

        nodeFields.relationFields.forEach((relationship) => {
            if (relationship.properties) {
                relationshipPropertyInterfaceNames.add(relationship.properties);
            }
            if (relationship.interface) {
                interfaceRelationshipNames.add(relationship.typeMeta.name);
            }
        });

        if (!pointInTypeDefs) {
            pointInTypeDefs = nodeFields.pointFields.some((field) => field.typeMeta.name === "Point");
        }
        if (!cartesianPointInTypeDefs) {
            cartesianPointInTypeDefs = nodeFields.pointFields.some((field) => field.typeMeta.name === "CartesianPoint");
        }

        const globalIdFields = nodeFields.primitiveFields.filter((field) => field.isGlobalIdField);
        const globalIdField = globalIdFields[0];

        const node = new Node({
            name: definition.name.value,
            interfaces: nodeInterfaces,
            otherDirectives,
            propagatedDirectives,
            ...nodeFields,
            // @ts-ignore we can be sure it's defined
            exclude,
            schemaConfiguration,
            // @ts-ignore we can be sure it's defined
            nodeDirective,
            // @ts-ignore we can be sure it's defined
            fulltextDirective,
            queryOptionsDirective,
            description: definition.description?.value,
            isGlobalNode: Boolean(globalIdField),
            globalIdField: globalIdField?.fieldName,
            globalIdFieldIsInt: globalIdField?.typeMeta?.name === "Int",
            plural: parsePluralDirective(pluralDirectiveDefinition),
        });

        return node;
    });
    return {
        nodes,
        pointInTypeDefs,
        cartesianPointInTypeDefs,
        floatWhereInTypeDefs,
        relationshipPropertyInterfaceNames,
        interfaceRelationshipNames,
    };
}

export default getNodes;

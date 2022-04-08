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

import { DirectiveNode, NamedTypeNode } from "graphql";
import { Exclude, Node } from "../classes";
import { NodeDirective } from "../classes/NodeDirective";
import { QueryOptionsDirective } from "../classes/QueryOptionsDirective";
import { Auth, FullText, Neo4jGraphQLCallbacks } from "../types";
import getObjFieldMeta from "./get-obj-field-meta";
import { parseQueryOptionsDirective } from "./parse/parse-query-options-directive";
import parseFulltextDirective from "./parse/parse-fulltext-directive";
import parseNodeDirective from "./parse-node-directive";
import parseExcludeDirective from "./parse-exclude-directive";
import getAuth from "./get-auth";
import { DefinitionNodes } from "./get-definition-nodes";

type Nodes = {
    nodes: Node[];
    pointInTypeDefs: boolean;
    cartesianPointInTypeDefs: boolean;
    relationshipPropertyInterfaceNames: Set<string>;
    interfaceRelationshipNames: Set<string>;
};

function getNodes(definitionNodes: DefinitionNodes, options: { callbacks?: Neo4jGraphQLCallbacks }): Nodes {
    let pointInTypeDefs = false;
    let cartesianPointInTypeDefs = false;

    const relationshipPropertyInterfaceNames = new Set<string>();
    const interfaceRelationshipNames = new Set<string>();

    const nodes = definitionNodes.objectTypes.map((definition) => {
        const otherDirectives = (definition.directives || []).filter(
            (x) => !["auth", "exclude", "node", "fulltext", "queryOptions"].includes(x.name.value)
        );
        const authDirective = (definition.directives || []).find((x) => x.name.value === "auth");
        const excludeDirective = (definition.directives || []).find((x) => x.name.value === "exclude");
        const nodeDirectiveDefinition = (definition.directives || []).find((x) => x.name.value === "node");
        const fulltextDirectiveDefinition = (definition.directives || []).find((x) => x.name.value === "fulltext");
        const queryOptionsDirectiveDefinition = (definition.directives || []).find(
            (x) => x.name.value === "queryOptions"
        );
        const nodeInterfaces = [...(definition.interfaces || [])] as NamedTypeNode[];

        const { interfaceAuthDirectives, interfaceExcludeDirectives } = nodeInterfaces.reduce<{
            interfaceAuthDirectives: DirectiveNode[];
            interfaceExcludeDirectives: DirectiveNode[];
        }>(
            (res, interfaceName) => {
                const iface = definitionNodes.interfaceTypes.find((i) => i.name.value === interfaceName.name.value);

                if (iface) {
                    const interfaceAuthDirective = (iface.directives || []).find((x) => x.name.value === "auth");
                    const interfaceExcludeDirective = (iface.directives || []).find((x) => x.name.value === "exclude");

                    if (interfaceAuthDirective) {
                        res.interfaceAuthDirectives.push(interfaceAuthDirective);
                    }

                    if (interfaceExcludeDirective) {
                        res.interfaceExcludeDirectives.push(interfaceExcludeDirective);
                    }
                }

                return res;
            },
            { interfaceAuthDirectives: [], interfaceExcludeDirectives: [] }
        );

        if (interfaceAuthDirectives.length > 1) {
            throw new Error(
                `Multiple interfaces of ${definition.name.value} have @auth directive - cannot determine directive to use`
            );
        }

        if (interfaceExcludeDirectives.length > 1) {
            throw new Error(
                `Multiple interfaces of ${definition.name.value} have @exclude directive - cannot determine directive to use`
            );
        }

        let auth: Auth;
        if (authDirective || interfaceAuthDirectives.length) {
            auth = getAuth(authDirective || interfaceAuthDirectives[0]);
        }

        let exclude: Exclude;
        if (excludeDirective || interfaceExcludeDirectives.length) {
            exclude = parseExcludeDirective(excludeDirective || interfaceExcludeDirectives[0]);
        }

        let nodeDirective: NodeDirective;
        if (nodeDirectiveDefinition) {
            nodeDirective = parseNodeDirective(nodeDirectiveDefinition);
        }

        const nodeFields = getObjFieldMeta({
            obj: definition,
            enums: definitionNodes.enumTypes,
            interfaces: definitionNodes.interfaceTypes,
            objects: definitionNodes.objectTypes,
            scalars: definitionNodes.scalarTypes,
            unions: definitionNodes.unionTypes,
            callbacks: options.callbacks,
        });

        // Ensure that all required fields are returning either a scalar type or an enum

        const violativeRequiredField = nodeFields.computedFields
            .filter((f) => f.requiredFields.length)
            .map((f) => f.requiredFields)
            .flat()
            .find(
                (requiredField) =>
                    ![
                        ...nodeFields.primitiveFields,
                        ...nodeFields.scalarFields,
                        ...nodeFields.enumFields,
                        ...nodeFields.temporalFields,
                        ...nodeFields.cypherFields.filter((field) => field.isScalar || field.isEnum),
                    ]
                        .map((x) => x.fieldName)
                        .includes(requiredField)
            );

        if (violativeRequiredField) {
            throw new Error(
                `Cannot have ${violativeRequiredField} as a required field on node ${definition.name.value}. Required fields must return a scalar type.`
            );
        }

        let fulltextDirective: FullText;
        if (fulltextDirectiveDefinition) {
            fulltextDirective = parseFulltextDirective({
                directive: fulltextDirectiveDefinition,
                nodeFields,
                definition,
            });
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
                const propertiesInterface = definitionNodes.interfaceTypes.find(
                    (i) => i.name.value === relationship.properties
                );
                if (!propertiesInterface) {
                    throw new Error(
                        `Cannot find interface specified in ${definition.name.value}.${relationship.fieldName}`
                    );
                }
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

        const node = new Node({
            name: definition.name.value,
            interfaces: nodeInterfaces,
            otherDirectives,
            ...nodeFields,
            // @ts-ignore we can be sure it's defined
            auth,
            // @ts-ignore we can be sure it's defined
            exclude,
            // @ts-ignore we can be sure it's defined
            nodeDirective,
            // @ts-ignore we can be sure it's defined
            fulltextDirective,
            queryOptionsDirective,
            description: definition.description?.value,
        });

        return node;
    });

    return {
        nodes,
        pointInTypeDefs,
        cartesianPointInTypeDefs,
        relationshipPropertyInterfaceNames,
        interfaceRelationshipNames,
    };
}

export default getNodes;

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
import { Kind } from "graphql";
import type { Exclude } from "../classes";
import { Node } from "../classes";
import type { NodeDirective } from "../classes/NodeDirective";
import type { QueryOptionsDirective } from "../classes/QueryOptionsDirective";
import type { FullText, Neo4jGraphQLCallbacks } from "../types";
import type { Auth } from "../types/deprecated/auth/auth";
import getObjFieldMeta from "./get-obj-field-meta";
import parsePluralDirective from "./parse/parse-plural-directive";
import { parseQueryOptionsDirective } from "./parse/parse-query-options-directive";
import parseFulltextDirective from "./parse/parse-fulltext-directive";
import parseNodeDirective from "./parse-node-directive";
import parseExcludeDirective from "./parse-exclude-directive";
import getAuth from "./get-auth";
import type { DefinitionNodes } from "./get-definition-nodes";
import { asArray } from "../utils/utils";

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
        validateResolvers: boolean;
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
                !["auth", "authorization", "exclude", "node", "fulltext", "queryOptions", "plural", "shareable", "deprecated"].includes(
                    x.name.value
                )
        );
        const propagatedDirectives = (definition.directives || []).filter((x) =>
            ["deprecated", "shareable"].includes(x.name.value)
        );
        let resolvable = true;
        const keyDirective = (definition.directives || []).find((x) => x.name.value === "key");
        const resolvableArgument = (keyDirective?.arguments || []).find((x) => x.name.value === "resolvable");
        if (resolvableArgument?.value.kind === Kind.BOOLEAN && resolvableArgument.value.value === false) {
            resolvable = false;
        }
        const authDirective = (definition.directives || []).find((x) => x.name.value === "auth");
        const excludeDirective = (definition.directives || []).find((x) => x.name.value === "exclude");
        const nodeDirectiveDefinition = (definition.directives || []).find((x) => x.name.value === "node");
        const pluralDirectiveDefinition = (definition.directives || []).find((x) => x.name.value === "plural");
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
            auth = getAuth(authDirective || (interfaceAuthDirectives[0] as DirectiveNode));
        }

        let exclude: Exclude;
        if (excludeDirective || interfaceExcludeDirectives.length) {
            exclude = parseExcludeDirective(excludeDirective || interfaceExcludeDirectives[0]);
        }

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
            validateResolvers: options.validateResolvers,
        });

        // Ensure that all required fields are returning either a scalar type or an enum

        const violativeRequiredField = nodeFields.customResolverFields
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

        const globalIdFields = nodeFields.primitiveFields.filter((field) => field.isGlobalIdField);

        if (globalIdFields.length > 1) {
            throw new Error(
                "Only one field may be decorated with an '@id' directive with the global argument set to `true`"
            );
        }

        const globalIdField = globalIdFields[0];

        const idField = definition.fields?.find((x) => x.name.value === "id");

        if (globalIdField && idField) {
            const hasAlias = idField.directives?.find((x) => x.name.value === "alias");
            if (!hasAlias) {
                throw new Error(
                    `Type ${definition.name.value} already has a field "id." Either remove it, or if you need access to this property, consider using the "@alias" directive to access it via another field`
                );
            }
        }

        if (globalIdField && !globalIdField.unique) {
            throw new Error(
                `Fields decorated with the "@id" directive must be unique in the database. Please remove it, or consider making the field unique`
            );
        }
        const node = new Node({
            name: definition.name.value,
            interfaces: nodeInterfaces,
            otherDirectives,
            propagatedDirectives,
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
            isGlobalNode: Boolean(globalIdField),
            globalIdField: globalIdField?.fieldName,
            globalIdFieldIsInt: globalIdField?.typeMeta?.name === "Int",
            plural: parsePluralDirective(pluralDirectiveDefinition),
            federationResolvable: resolvable,
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

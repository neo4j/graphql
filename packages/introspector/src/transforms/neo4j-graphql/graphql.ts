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

import { Neo4jStruct, NodeMap, RelationshipMap } from "../../types";
import createNodeFields from "./utils/create-node-fields";
import uniqueString from "../../utils/unique-string";
import { NodeDirective } from "./directives/Node";
import { GraphQLNode } from "./GraphQLNode";
import generateRelationshipPropsName from "./utils/generate-relationship-props-name";
import { RelationshipPropertiesDirective } from "./directives/RelationshipProperties";
import createRelationshipFields from "./utils/create-relationship-fields";
import { ExcludeDirective } from "./directives/Exclude";
import generateGraphQLSafeName from "./utils/generate-graphql-safe-name";

type GraphQLNodeMap = {
    [key: string]: GraphQLNode;
};

export default function graphqlFormatter(neo4jStruct: Neo4jStruct, readonly = false): string {
    const { nodes, relationships } = neo4jStruct;
    const bareNodes = transformNodes(nodes, readonly);
    const withRelationships = hydrateWithRelationships(bareNodes, relationships);
    const sorted = Object.keys(withRelationships).sort();
    return sorted.map((typeName) => withRelationships[typeName].toString()).join("\n\n");
}

function transformNodes(nodes: NodeMap, readonly: boolean): GraphQLNodeMap {
    const out = {};
    const takenTypeNames: string[] = [];
    Object.keys(nodes).forEach((nodeType) => {
        // No labels, skip
        if (!nodeType) {
            return;
        }
        const neo4jNode = nodes[nodeType];
        const mainLabel = neo4jNode.labels[0];
        const typeName = generateGraphQLSafeName(mainLabel);

        const uniqueTypeName = uniqueString(typeName, takenTypeNames);
        takenTypeNames.push(uniqueTypeName);

        const node = new GraphQLNode("type", uniqueTypeName);
        const nodeDirective = new NodeDirective();
        if (mainLabel !== uniqueTypeName) {
            nodeDirective.addLabel(mainLabel);
        }
        nodeDirective.addAdditionalLabels(neo4jNode.labels.slice(1));
        if (nodeDirective.toString().length) {
            node.addDirective(nodeDirective);
        }
        if (readonly) {
            const excludeDirective = new ExcludeDirective();
            excludeDirective.addOperation("CREATE");
            excludeDirective.addOperation("DELETE");
            excludeDirective.addOperation("UPDATE");
            node.addDirective(excludeDirective);
        }

        const fields = createNodeFields(neo4jNode.properties, node.typeName);
        fields.forEach((f) => node.addField(f));
        out[mainLabel] = node;
    });
    return out;
}

function hydrateWithRelationships(nodes: GraphQLNodeMap, rels: RelationshipMap): GraphQLNodeMap {
    Object.entries(rels).forEach(([relType, rel]) => {
        let relInterfaceName;

        if (rel.properties.length) {
            relInterfaceName = uniqueString(
                generateGraphQLSafeName(generateRelationshipPropsName(relType)),
                Object.values(nodes).map((n) => n.typeName)
            );
            const relInterfaceNode = new GraphQLNode("interface", relInterfaceName);
            relInterfaceNode.addDirective(new RelationshipPropertiesDirective());
            const relTypePropertiesFields = createNodeFields(rel.properties, relType);
            relTypePropertiesFields.forEach((f) => relInterfaceNode.addField(f));
            nodes[relInterfaceName] = relInterfaceNode;
        }
        rel.paths.forEach((path) => {
            const { fromField, toField } = createRelationshipFields(
                nodes[path.fromTypeId].typeName,
                nodes[path.toTypeId].typeName,
                relType,
                relInterfaceName
            );
            nodes[path.fromTypeId].addField(fromField);
            nodes[path.toTypeId].addField(toField);
        });
    });
    Object.keys(nodes).forEach((nodeKey) => {
        if (!nodes[nodeKey].fields.length) {
            delete nodes[nodeKey];
        }
    });
    return nodes;
}

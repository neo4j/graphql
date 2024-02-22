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

import type { Neo4jStruct, NodeMap, RelationshipMap } from "../../types";
import createNodeFields from "./utils/create-node-fields";
import uniqueString from "../../utils/unique-string";
import { NodeDirective } from "./directives/Node";
import { GraphQLNode } from "./GraphQLNode";
import generateRelationshipPropsName from "./utils/generate-relationship-props-name";
import { RelationshipPropertiesDirective } from "./directives/RelationshipProperties";
import createRelationshipFields from "./utils/create-relationship-fields";
import generateGraphQLSafeName from "./utils/generate-graphql-safe-name";
import nodeKey from "../../utils/node-key";
import type Node from "../../classes/Node";

type GraphQLNodeMap = {
    [key: string]: GraphQLNode;
};

type FormatterOptions = {
    getNodeLabel?: (node: Node) => string;
    sanitizeRelType?: (relType: string) => string;
};

export default function graphqlFormatter(
    neo4jStruct: Neo4jStruct,
    readonly = false,
    options: FormatterOptions = {}
): string {
    const { nodes, relationships } = neo4jStruct;
    const bareNodes = transformNodes(nodes, options);
    const withRelationships = hydrateWithRelationships(bareNodes, relationships, options);
    const sorted = Object.keys(withRelationships).sort((a, b) => {
        return withRelationships[a].typeName > withRelationships[b].typeName ? 1 : -1;
    });
    const sortedWithRelationships = sorted.map((typeName) => withRelationships[typeName].toString());
    if (readonly) {
        sortedWithRelationships.push("extend schema @mutation(operations: [])");
    }
    return sortedWithRelationships.join("\n\n");
}

function transformNodes(nodes: NodeMap, options: FormatterOptions = {}): GraphQLNodeMap {
    const out = {};
    const takenTypeNames: string[] = [];
    Object.keys(nodes).forEach((nodeType) => {
        // No labels, skip
        if (!nodeType) {
            return;
        }

        const neo4jNode = nodes[nodeType];

        const neo4jNodeKey = nodeKey(neo4jNode.labels);

        const mainLabel = options.getNodeLabel ? options.getNodeLabel(neo4jNode) : neo4jNode.labels[0];
        const typeName = generateGraphQLSafeName(mainLabel);

        const uniqueTypeName = uniqueString(typeName, takenTypeNames);
        takenTypeNames.push(uniqueTypeName);
        const node = new GraphQLNode("type", uniqueTypeName);
        const nodeDirective = new NodeDirective();

        if (neo4jNode.labels.length > 1 || mainLabel !== uniqueTypeName) {
            nodeDirective.addLabels(neo4jNode.labels);
        }

        if (nodeDirective.toString().length) {
            node.addDirective(nodeDirective);
        }

        const fields = createNodeFields(neo4jNode.properties, node.typeName);
        fields.forEach((f) => node.addField(f));
        out[neo4jNodeKey] = node;
    });
    return out;
}

function hydrateWithRelationships(
    nodes: GraphQLNodeMap,
    rels: RelationshipMap,
    options: FormatterOptions = {}
): GraphQLNodeMap {
    Object.entries(rels).forEach(([relType, rel]) => {
        let relInterfaceName: string;

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
        // console.dir(rel, { depth: 7 });
        rel.paths.forEach((path) => {
            const { fromField, toField } = createRelationshipFields(
                nodes[path.fromTypeId].typeName,
                nodes[path.toTypeId].typeName,
                relType,
                relInterfaceName,
                options.sanitizeRelType
            );
            nodes[path.fromTypeId].addField(fromField);
            nodes[path.toTypeId].addField(toField);
        });
    });
    Object.keys(nodes).forEach((key) => {
        if (!nodes[key].fields.length) {
            delete nodes[key];
        }
    });
    return nodes;
}

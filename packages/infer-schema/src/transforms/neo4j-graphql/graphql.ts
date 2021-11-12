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
import inferRelationshipPropsName from "./utils/infer-relationship-props-name";
import { RelationshipPropertiesDirective } from "./directives/RelationshipProperties";
import createRelationshipFields from "./utils/create-relationship-fields";
import { ExcludeDirective } from "./directives/Exclude";

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
        const neo4jNode = nodes[nodeType];
        const mainLabel = neo4jNode.labels[0];
        const typeName = mainLabel.replace(/[^_0-9A-Z]+/gi, "_");
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
        if (node.fields.length) {
            out[mainLabel] = node;
        }
    });
    return out;
}

function hydrateWithRelationships(nodes: GraphQLNodeMap, rels: RelationshipMap): GraphQLNodeMap {
    Object.keys(rels).forEach((relType) => {
        const rel = rels[relType];
        let relInterfaceName;

        if (rel.properties.length) {
            relInterfaceName = uniqueString(
                inferRelationshipPropsName(relType),
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
    return nodes;
}

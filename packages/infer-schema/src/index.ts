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

import { Session } from "neo4j-driver";
import { mapNeo4jToGraphQLType } from "./map-neo4j-to-graphql-type";

type NodeMap = {
    [key: string]: Neo4jNode;
};

type NodeTypePropertiesRecord = {
    nodeType: string;
    nodeLabels: string[];
    propertyName: string;
    propertyTypes: string[];
    mandatory: boolean;
};

export async function inferSchema(session: Session): Promise<string> {
    // Labels
    const neo4jNodes: NodeMap = {};

    // Label properties
    const labelPropsRes = await session.readTransaction((tx) =>
        tx.run(`CALL db.schema.nodeTypeProperties()
    YIELD nodeType, nodeLabels, propertyName, propertyTypes, mandatory
    WITH *
    WHERE propertyName =~ "[_A-Za-z][_0-9A-Za-z]*" 
    AND all(x IN nodeLabels WHERE (x =~ "[A-Za-z][_0-9A-Za-z]*"))
    RETURN *`)
    );
    if (!labelPropsRes?.records.length) {
        return "";
    }
    const nodeTypeProperties = labelPropsRes.records.map((r) => r.toObject()) as NodeTypePropertiesRecord[];

    // Find unique "nodeType"s to build Neo4jNode instances
    new Set(nodeTypeProperties.map((nt) => nt.nodeType)).forEach((nodeType) => {
        const propertiesRows = nodeTypeProperties.filter((nt) => nt.nodeType === nodeType);
        if (!propertiesRows) {
            return;
        }
        const { nodeLabels } = propertiesRows[0];
        const neo4jNode = new Neo4jNode(nodeLabels[0], nodeLabels.slice(1));
        propertiesRows.forEach((propertyRow) =>
            neo4jNode.addField(
                propertyRow.propertyName,
                mapNeo4jToGraphQLType(propertyRow.propertyTypes, propertyRow.mandatory)
            )
        );
        neo4jNodes[nodeType] = neo4jNode;
    });

    return Object.keys(neo4jNodes)
        .map((typeName) => neo4jNodes[typeName].toString())
        .join("\n\n");
}

type Directives = {
    node: NodeDirective;
};
class Neo4jNode {
    label: string;
    fields: string[][] = [];
    directives: Directives = { node: new NodeDirective() };
    constructor(label: string, additionalLabels: string[] = []) {
        this.label = label;
        this.directives.node.addAdditionalLabels(additionalLabels);
    }

    addField(name: string, type: string) {
        this.fields.push([name, type]);
    }

    toString() {
        return `type ${this.label} ${this.directives.node.toString()}{\n\t${this.fields
            .map(([name, type]) => `${name}: ${type}`)
            .join("\n\t")}\n}`;
    }
}

class NodeDirective {
    additionalLabels: string[] = [];
    addAdditionalLabels(labels: string[] | string) {
        if (!labels.length) {
            return;
        }
        this.additionalLabels = this.additionalLabels.concat(labels);
    }

    toString() {
        if (!this.additionalLabels.length) {
            return "";
        }
        return `@node(additonalLabels: ["${this.additionalLabels.join('","')}"]) `;
    }
}

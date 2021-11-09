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

import camelcase from "camelcase";
import { Session } from "neo4j-driver";
import { mapNeo4jToGraphQLType } from "./map-neo4j-to-graphql-type";

type NodeMap = {
    [key: string]: Neo4jNode;
};
type RelationshipMap = {
    [key: string]: Neo4jRelationship;
};

type NodeTypePropertiesRecord = {
    nodeType: string;
    nodeLabels: string[];
    propertyName: string;
    propertyTypes: string[];
    mandatory: boolean;
};
type RelationshipTypePropertiesRecord = {
    relType: string;
    propertyName: string;
    propertyTypes: string[];
    mandatory: boolean;
};
type ConnectionRecord = {
    from: string;
    to: string;
    relType: string;
};

export async function inferSchema(session: Session): Promise<string> {
    // Nodes
    const neo4jNodes = await inferNodes(session);

    // Rels
    const neo4jRels = await inferRelationships(session);

    const hydratedNodes = hydrateConnections(neo4jNodes, neo4jRels);

    return Object.keys(hydratedNodes)
        .map((typeName) => neo4jNodes[typeName].toString())
        .join("\n\n");
}

function hydrateConnections(nodes: NodeMap, rels: RelationshipMap): NodeMap {
    Object.keys(rels).forEach((relType) => {
        const { connections } = rels[relType];
        connections.forEach((connection) => {
            const from = nodes[connection.from];
            const to = nodes[connection.to];
            from.addRelationshipField(connection, "OUT", to.typeName);
            to.addRelationshipField(connection, "IN", from.typeName);
        });
    });
    return nodes;
}

async function inferRelationships(session: Session): Promise<RelationshipMap> {
    const rels: RelationshipMap = {};
    const typePropsRes = await session.readTransaction((tx) =>
        tx.run(`CALL db.schema.relTypeProperties()
    YIELD relType, propertyName, propertyTypes, mandatory
    RETURN *`)
    );
    const relTypeProperties = typePropsRes.records.map((r) => r.toObject()) as RelationshipTypePropertiesRecord[];
    const uniqueRelTypes = new Set(relTypeProperties.map((nt) => nt.relType));
    const queries: Promise<typeof typePropsRes>[] = [];
    uniqueRelTypes.forEach((relType) => {
        const propertiesRows = relTypeProperties.filter((nt) => nt.relType === relType);
        if (!propertiesRows) {
            return;
        }

        // Check node identifiers it's connected to
        const connectionsRes = session.readTransaction((tx) =>
            tx.run(`
        MATCH (n)-[r${relType}]->(m)
        WITH n, r, m LIMIT 100
        WITH DISTINCT labels(n) AS from, labels(m) AS to
        WITH from, to WHERE SIZE(from) > 0 AND SIZE(to) > 0
        RETURN from, to, "${relType.replace(/"/g, '\\"')}" AS relType`)
        );
        queries.push(connectionsRes);
        // propertiesRows.forEach((row) => {
        // });
    });
    const results = await Promise.all(queries);
    results.forEach((result, i) => {
        const connections = result.records.map((r) => r.toObject()) as ConnectionRecord[];
        if (!connections) {
            return;
        }
        const { relType } = connections[0];
        const typeOnly = relType.slice(2, -1);
        const rel = new Neo4jRelationship(typeOnly);
        connections.forEach(({ from, to }) => {
            rel.addConnection(from, to);
        });
        rels[typeOnly] = rel;
    });

    return rels;
}

async function inferNodes(session: Session): Promise<NodeMap> {
    const nodes: NodeMap = {};
    // Label properties
    const labelPropsRes = await session.readTransaction((tx) =>
        tx.run(`CALL db.schema.nodeTypeProperties()
    YIELD nodeType, nodeLabels, propertyName, propertyTypes, mandatory
    RETURN *`)
    );
    if (!labelPropsRes?.records.length) {
        return nodes;
    }
    const nodeTypeProperties = labelPropsRes.records.map((r) => r.toObject()) as NodeTypePropertiesRecord[];

    // Find unique "nodeType"s to build Neo4jNode instances
    new Set(nodeTypeProperties.map((nt) => nt.nodeType)).forEach((nodeType) => {
        const propertiesRows = nodeTypeProperties.filter((nt) => nt.nodeType === nodeType);
        if (!propertiesRows) {
            return;
        }
        const { nodeLabels } = propertiesRows[0];
        const mainLabel = nodeLabels[0];
        const typeName = mainLabel.replace(/[^_0-9A-Z]+/gi, "_");
        let counter = 2;
        let uniqueTypeName = typeName;
        while (typeof nodes[uniqueTypeName] !== "undefined") {
            uniqueTypeName = typeName + String(counter);
            counter += 1;
        }
        const neo4jNode = new Neo4jNode(uniqueTypeName, mainLabel, nodeLabels.slice(1));
        propertiesRows.forEach((propertyRow) =>
            neo4jNode.addField(
                propertyRow.propertyName,
                mapNeo4jToGraphQLType(propertyRow.propertyTypes, propertyRow.mandatory)
            )
        );
        nodes[mainLabel] = neo4jNode;
    });
    return nodes;
}

type Direction = "IN" | "OUT";

class Connection {
    from: string;
    to: string;
    type: string;
    constructor(type: string, from: string, to: string) {
        this.from = from;
        this.to = to;
        this.type = type;
    }

    toString(direction: Direction) {
        const args: string[] = [];
        args.push(`type: "${this.type}"`);
        args.push(`direction: ${direction}`);
        return `@relationship(${args.join(", ")})`;
    }
}
class Neo4jRelationship {
    type: string;
    propertiesInterfaceName?: string;
    fields: string[][] = [];
    connections: Connection[] = [];
    constructor(type: string) {
        this.type = type;
    }

    addConnection(from: string, to: string) {
        this.connections.push(new Connection(this.type, from, to));
    }
}

type NodeDirectives = {
    node: NodeDirective;
};
type RelationshipFields = {
    IN: RelationshipField[];
    OUT: RelationshipField[];
};
type RelationshipField = { relationship: Connection; remoteTypeName: string };
class Neo4jNode {
    label: string;
    typeName: string;
    fields: string[][] = [];
    relationshipFields: RelationshipFields = { IN: [], OUT: [] };
    directives: NodeDirectives = { node: new NodeDirective() };
    constructor(typeName: string, label: string, additionalLabels: string[] = []) {
        this.typeName = typeName;
        this.label = label;
        if (this.label !== this.typeName) {
            this.directives.node.addLabel(this.label);
        }
        this.directives.node.addAdditionalLabels(additionalLabels);
    }

    addField(name: string, type: string) {
        this.fields.push([name, type]);
    }

    addRelationshipField(relationship: Connection, direction: Direction, remoteTypeName: string) {
        this.relationshipFields[direction].push({ relationship, remoteTypeName });
    }

    toString() {
        const parts: (string | string[])[] = [];
        let innerParts: string[] = [];
        innerParts = innerParts.concat(this.fields.map(([name, type]) => `${name}: ${type}`));
        innerParts = innerParts.concat(
            this.relationshipFields.OUT.map(
                (c) =>
                    `${camelcase(c.relationship.type + c.remoteTypeName)}: [${
                        c.remoteTypeName
                    }] ${c.relationship.toString("OUT")}`
            )
        );
        innerParts = innerParts.concat(
            this.relationshipFields.IN.map(
                (c) =>
                    `${camelcase(c.remoteTypeName + c.relationship.type)}: [${
                        c.remoteTypeName
                    }] ${c.relationship.toString("IN")}`
            )
        );

        parts.push(`type ${this.typeName} ${this.directives.node.toString()}{`);
        parts.push(innerParts);
        parts.push(`}`);
        return parts.map((p) => (Array.isArray(p) ? `\t${p.join("\n\t")}` : p)).join("\n");
    }
}

class NodeDirective {
    label?: string;
    additionalLabels: string[] = [];

    addLabel(label: string) {
        this.label = label;
    }

    addAdditionalLabels(labels: string[] | string) {
        if (!labels.length) {
            return;
        }
        this.additionalLabels = this.additionalLabels.concat(labels);
    }

    toString() {
        const directiveArguments: string[] = [];
        if (this.label) {
            directiveArguments.push(`label: "${this.label}"`);
        }
        if (this.additionalLabels.length) {
            directiveArguments.push(`additonalLabels: ["${this.additionalLabels.join('","')}"]`);
        }
        return directiveArguments.length ? `@node(${directiveArguments.join(", ")}) ` : "";
    }
}

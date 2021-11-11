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

import Debug from "debug";
import { Session } from "neo4j-driver";
import { NodeDirective } from "./classes/directives/Node";
import { NodeField } from "./classes/NodeField";
import { RelationshipDirective } from "./classes/directives/Relationship";
import { GraphQLNode } from "./classes/GraphQLNode";
import { DEBUG_INFER_SCHEMA } from "./constants";
import inferRelationshipFieldName from "./utils/infer-relationship-field-name";
import mapNeo4jToGraphQLType from "./utils/map-neo4j-to-graphql-type";
import uniqueString from "./utils/unique-string";
import cleanTypeName from "./utils/clean-type-name";
import inferRelationshipPropsName from "./utils/infer-relationship-props-name";
import { RelationshipPropertiesDirective } from "./classes/directives/RelationshipProperties";

const debug = Debug(DEBUG_INFER_SCHEMA);

type NodeMap = {
    [key: string]: GraphQLNode;
};

type PropertyRecord = {
    propertyName: string;
    propertyTypes: string[];
    mandatory: boolean;
};

interface NodeTypePropertiesRecord extends PropertyRecord {
    nodeType: string;
    nodeLabels: string[];
}
interface RelationshipTypePropertiesRecord extends PropertyRecord {
    relType: string;
}

type RelationshipRecord = {
    from: string;
    to: string;
    relType: string;
};

type RelTypeProperties = { relTypeName: string; graphqlTypeName: string };

export async function inferSchema(sessionFactory: () => Session): Promise<string> {
    // Nodes
    const typeNodes = await inferNodes(sessionFactory);

    // Rels
    const hydratedNodes = await hydrateWithRelationships(typeNodes, sessionFactory);

    const sorted = Object.keys(hydratedNodes).sort();
    return sorted.map((typeName) => typeNodes[typeName].toString()).join("\n\n");
}

function createRelationshipFields(
    fromTypeName: string,
    toTypeName: string,
    relType: string,
    propertiesTypeName?: string
): { fromField: NodeField; toField: NodeField } {
    const fromField = new NodeField(
        inferRelationshipFieldName(relType, fromTypeName, toTypeName, "OUT"),
        `[${toTypeName}]`
    );
    const fromDirective = new RelationshipDirective(relType, "OUT", propertiesTypeName);
    fromField.addDirective(fromDirective);

    const toField = new NodeField(
        inferRelationshipFieldName(relType, fromTypeName, toTypeName, "IN"),
        `[${fromTypeName}]`
    );
    const toDirective = new RelationshipDirective(relType, "IN", propertiesTypeName);
    toField.addDirective(toDirective);
    return { fromField, toField };
}

async function hydrateWithRelationships(nodes: NodeMap, sessionFactory: () => Session): Promise<NodeMap> {
    const relSession = sessionFactory();
    const typePropsRes = await relSession.readTransaction((tx) =>
        tx.run(`CALL db.schema.relTypeProperties()
    YIELD relType, propertyName, propertyTypes, mandatory
    RETURN *`)
    );
    await relSession.close();
    const relTypePropertiesRecords = typePropsRes.records.map((r) =>
        r.toObject()
    ) as RelationshipTypePropertiesRecord[];
    const uniqueRelTypes = new Set(relTypePropertiesRecords.map((nt) => nt.relType));
    const queries: Promise<typeof typePropsRes>[] = [];
    const relTypeProperties: { [key: string]: RelTypeProperties } = {};
    uniqueRelTypes.forEach((relType) => {
        const propertiesRows = relTypePropertiesRecords.filter((nt) => nt.relType === relType);
        if (!propertiesRows) {
            return;
        }

        // Check node identifiers it's connected to
        async function sessionClosure() {
            const conSession = sessionFactory();
            await new Promise((r) => setTimeout(r, 3000));
            const relationshipsRes = await conSession.readTransaction((tx) =>
                tx.run(`
            MATCH (n)-[r${relType}]->(m)
            WITH n, r, m LIMIT 100
            WITH DISTINCT labels(n) AS from, labels(m) AS to
            WITH from, to WHERE SIZE(from) > 0 AND SIZE(to) > 0
            RETURN from, to, "${relType.replace(/"/g, '\\"')}" AS relType`)
            );
            await conSession.close();
            return relationshipsRes;
        }

        queries.push(sessionClosure());
        const typeOnly = cleanTypeName(relType);
        const relTypePropertiesFields = createNodeFields(propertiesRows, relType);

        if (relTypePropertiesFields.length) {
            const relInterfaceName = uniqueString(
                inferRelationshipPropsName(typeOnly),
                Object.values(nodes).map((n) => n.typeName)
            );
            const relInterfaceNode = new GraphQLNode("interface", relInterfaceName);
            relInterfaceNode.addDirective(new RelationshipPropertiesDirective());
            relTypePropertiesFields.forEach((f) => relInterfaceNode.addField(f));
            relTypeProperties[typeOnly] = { relTypeName: typeOnly, graphqlTypeName: relInterfaceName };
            nodes[relInterfaceName] = relInterfaceNode;
        }
    });
    const results = await Promise.all(queries);
    results.forEach((result) => {
        const relationships = result.records.map((r) => r.toObject()) as RelationshipRecord[];
        if (!relationships) {
            return;
        }
        const { relType } = relationships[0];
        const typeOnly = cleanTypeName(relType);
        relationships.forEach(({ from, to }) => {
            const { fromField, toField } = createRelationshipFields(
                nodes[from].typeName,
                nodes[to].typeName,
                typeOnly,
                relTypeProperties[typeOnly]?.graphqlTypeName
            );
            nodes[from].addField(fromField);
            nodes[to].addField(toField);
        });
    });

    return nodes;
}

async function inferNodes(sessionFactory: () => Session): Promise<NodeMap> {
    const nodes: NodeMap = {};
    // Label properties
    const session = sessionFactory();
    const labelPropsRes = await session.readTransaction((tx) =>
        tx.run(`CALL db.schema.nodeTypeProperties()
    YIELD nodeType, nodeLabels, propertyName, propertyTypes, mandatory
    RETURN *`)
    );
    await session.close();
    if (!labelPropsRes?.records.length) {
        return nodes;
    }
    const nodeTypeProperties = labelPropsRes.records.map((r) => r.toObject()) as NodeTypePropertiesRecord[];

    // Find unique "nodeType"s to build TypeNode instances
    const takenTypeNames: string[] = [];
    new Set(nodeTypeProperties.map((nt) => nt.nodeType)).forEach((nodeType) => {
        const propertiesRows = nodeTypeProperties.filter((nt) => nt.nodeType === nodeType);
        if (!propertiesRows) {
            return;
        }
        const { nodeLabels } = propertiesRows[0];
        const mainLabel = nodeLabels[0];
        const typeName = mainLabel.replace(/[^_0-9A-Z]+/gi, "_");

        const uniqueTypeName = uniqueString(typeName, takenTypeNames);
        takenTypeNames.push(uniqueTypeName);

        const node = new GraphQLNode("type", uniqueTypeName);
        const nodeDirective = new NodeDirective();
        if (mainLabel !== uniqueTypeName) {
            nodeDirective.addLabel(mainLabel);
        }
        nodeDirective.addAdditionalLabels(nodeLabels.slice(1));
        if (nodeDirective.toString().length) {
            node.addDirective(nodeDirective);
        }

        const fields = createNodeFields(propertiesRows, node.typeName);
        fields.forEach((f) => node.addField(f));
        if (node.fields.length) {
            nodes[mainLabel] = node;
        }
    });
    return nodes;
}

function createNodeFields(propertyRows: PropertyRecord[], elementType: string): NodeField[] {
    const out: NodeField[] = [];
    propertyRows.forEach((propertyRow) => {
        if (!propertyRow.propertyTypes) {
            if (debug.enabled) {
                debug("%s", `No properties on ${elementType}. Skipping generation.`);
            }
            return;
        }
        if (propertyRow.propertyTypes.length > 1) {
            if (debug.enabled) {
                debug(
                    "%s",
                    `Ambiguous types on ${elementType}.${propertyRow.propertyName}. Fix the inconsistences for this property to be included`
                );
            }
            return;
        }
        out.push(
            new NodeField(
                propertyRow.propertyName,
                mapNeo4jToGraphQLType(propertyRow.propertyTypes, propertyRow.mandatory)
            )
        );
    });
    return out;
}

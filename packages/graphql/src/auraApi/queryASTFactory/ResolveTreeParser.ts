import type { ResolveTree } from "graphql-parse-resolve-info";
import { ConcreteEntity } from "../../schema-model/entity/ConcreteEntity";
import type { Relationship } from "../../schema-model/relationship/Relationship";
import { AuraEntityOperations, type AuraRelationshipOperations } from "../AuraEntityOperations";

type ResolveTreeArgs = Record<string, any>;

interface ResolveTreeElement {
    alias: string;
    args: ResolveTreeArgs;
}

interface ResolveTreeField extends ResolveTreeElement {}

export interface ResolveTreeReadOperation extends ResolveTreeElement {
    fields: {
        connection?: ResolveTreeConnection;
    };
}

export interface ResolveTreeConnection extends ResolveTreeElement {
    fields: {
        edges?: ResolveTreeEdge;
    };
}

export interface ResolveTreeEdge extends ResolveTreeElement {
    fields: {
        node?: ResolveTreeNode;
        properties?: ResolveTreeProperties;
    };
}

export interface ResolveTreeNode extends ResolveTreeElement {
    fields: Record<string, ResolveTreeField | ResolveTreeReadOperation>;
}

export interface ResolveTreeProperties extends ResolveTreeElement {
    fields: Record<string, ResolveTreeField | ResolveTreeReadOperation>;
}

/** Returns the field of the resolve tree by passing the typename and name */
function findFieldByName(resolveTree: ResolveTree, typeName: string, name: string): ResolveTree | undefined {
    const fieldsByTypeName = resolveTree.fieldsByTypeName[typeName] ?? {};
    return Object.values(fieldsByTypeName).find((field) => {
        return field.name === name;
    });
}

export class ResolveTreeParser {
    private operations: AuraEntityOperations;
    private entity: ConcreteEntity;

    constructor(entity: ConcreteEntity) {
        this.entity = entity;
        this.operations = new AuraEntityOperations(entity);
    }

    public parse(resolveTree: ResolveTree): ResolveTreeReadOperation {
        // const fieldsByTypeName = resolveTree.fieldsByTypeName[this.operations.connectionOperation] ?? {};
        // const connectionResolveTree = fieldsByTypeName["connection"];

        const connectionResolveTree = findFieldByName(resolveTree, this.operations.connectionOperation, "connection");

        const connection = connectionResolveTree ? this.parseConnection(connectionResolveTree) : undefined;

        const result = {
            alias: resolveTree.alias,
            args: resolveTree.args,
            fields: {
                connection,
            },
        };
        return result;
    }

    private parseConnection(connectionResolveTree: ResolveTree): ResolveTreeConnection {
        // const edgesResolveTree = connectionResolveTree.fieldsByTypeName[this.operations.connectionType]?.["edges"];
        const edgesResolveTree = findFieldByName(connectionResolveTree, this.operations.connectionType, "edges");
        const edgeResolveTree = edgesResolveTree ? this.parseEdges(edgesResolveTree) : undefined;
        return {
            alias: connectionResolveTree.alias,
            args: connectionResolveTree.args,
            fields: {
                edges: edgeResolveTree,
            },
        };
    }

    private parseEdges(connectionResolveTree: ResolveTree): ResolveTreeEdge {
        // const nodeResolveTree = connectionResolveTree.fieldsByTypeName[this.operations.edgeType]?.["node"];
        const nodeResolveTree = findFieldByName(connectionResolveTree, this.operations.edgeType, "node");

        const node = nodeResolveTree ? this.parseEntity(nodeResolveTree) : undefined;

        return {
            alias: connectionResolveTree.alias,
            args: connectionResolveTree.args,
            fields: {
                node: node,
            },
        };
    }

    public parseEntity(nodeResolveTree: ResolveTree): ResolveTreeNode {
        const fieldsResolveTree = nodeResolveTree.fieldsByTypeName[this.operations.nodeType] ?? {};
        const fields = Object.fromEntries(
            Object.values(fieldsResolveTree).map((f): [string, ResolveTreeField | ResolveTreeReadOperation] => {
                const fieldName = f.name;
                if (this.entity.hasRelationship(fieldName)) {
                    const result = this.parseRelationship(f);
                    return [fieldName, result];
                }
                if (this.entity.hasAttribute(fieldName)) {
                    return [
                        fieldName,
                        {
                            alias: f.alias,
                            args: f.args,
                        },
                    ];
                }
                throw new ResolveTreeParserError(`${fieldName} is not an attribute nor relationship`);
            })
        );

        return {
            alias: nodeResolveTree.alias,
            args: nodeResolveTree.args,
            fields: fields,
        };
    }

    private parseRelationship(resolveTree: ResolveTree): ResolveTreeReadOperation {
        const relationship = this.entity.findRelationship(resolveTree.name);
        if (!relationship) {
            throw new ResolveTreeParserError("Relationship not found");
        }

        const relationshipOperations = this.operations.relationship(relationship);
        const relationshipParser = new RelationshipResolveTreeParser(relationship, relationshipOperations);
        return relationshipParser.parse(resolveTree);
    }
}

class RelationshipResolveTreeParser {
    private operations: AuraRelationshipOperations;
    private relationship: Relationship;

    constructor(relationship: Relationship, operations: AuraRelationshipOperations) {
        this.operations = operations;
        this.relationship = relationship;
    }

    public parse(resolveTree: ResolveTree): ResolveTreeReadOperation {
        // const fieldsByTypeName = resolveTree.fieldsByTypeName[this.operations.readOperation] ?? {};
        // const connectionResolveTree = fieldsByTypeName["connection"];

        const connectionResolveTree = findFieldByName(resolveTree, this.operations.readOperation, "connection");
        const connection = connectionResolveTree ? this.parseConnection(connectionResolveTree) : undefined;

        return {
            alias: resolveTree.alias,
            args: resolveTree.args,
            fields: {
                connection,
            },
        };
    }

    private parseConnection(connectionResolveTree: ResolveTree): ResolveTreeConnection {
        // const edgesResolveTree = connectionResolveTree.fieldsByTypeName[this.operations.connectionType]?.["edges"];
        const edgesResolveTree = findFieldByName(connectionResolveTree, this.operations.connectionType, "edges");
        const edgeResolveTree = edgesResolveTree ? this.parseEdges(edgesResolveTree) : undefined;
        return {
            alias: connectionResolveTree.alias,
            args: connectionResolveTree.args,
            fields: {
                edges: edgeResolveTree,
            },
        };
    }

    private parseEdges(connectionResolveTree: ResolveTree): ResolveTreeEdge {
        // const nodeResolveTree = connectionResolveTree.fieldsByTypeName[this.operations.edgeType]?.["node"];
        // const propertiesResolveTree = connectionResolveTree.fieldsByTypeName[this.operations.edgeType]?.["properties"];
        const nodeResolveTree = findFieldByName(connectionResolveTree, this.operations.edgeType, "node");
        const propertiesResolveTree = findFieldByName(connectionResolveTree, this.operations.edgeType, "properties");

        const node = nodeResolveTree ? this.parseEntity(nodeResolveTree) : undefined;
        const properties = propertiesResolveTree ? this.parseRelationshipProperties(propertiesResolveTree) : undefined;

        return {
            alias: connectionResolveTree.alias,
            args: connectionResolveTree.args,
            fields: {
                node: node,
                properties: properties,
            },
        };
    }

    private parseEntity(resolveTree: ResolveTree): ResolveTreeNode {
        const target = this.relationship.target;
        if (!(target instanceof ConcreteEntity)) {
            throw new Error("Interface not supported");
        }

        const resolveTreeParser = new ResolveTreeParser(target);
        const result = resolveTreeParser.parseEntity(resolveTree);

        return result;
    }

    private parseRelationshipProperties(resolveTree: ResolveTree): ResolveTreeProperties | undefined {
        if (!this.operations.propertiesType) return undefined;
        const fieldsResolveTree = resolveTree.fieldsByTypeName[this.operations.propertiesType] ?? {};
        const fields = Object.fromEntries(
            Object.values(fieldsResolveTree).map((f): [string, ResolveTreeField] => {
                const fieldName = f.name;
                if (this.relationship.hasAttribute(fieldName)) {
                    return [
                        fieldName,
                        {
                            alias: f.alias,
                            args: f.args,
                        },
                    ];
                }
                throw new ResolveTreeParserError(`${fieldName} is not an attribute of the relationship`);
            })
        );

        return {
            alias: resolveTree.alias,
            args: resolveTree.args,
            fields: fields,
        };
    }
}

class ResolveTreeParserError extends Error {}

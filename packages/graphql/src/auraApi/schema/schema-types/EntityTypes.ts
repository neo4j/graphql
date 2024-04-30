import type { ObjectTypeComposer } from "graphql-compose";
import { Memoize } from "typescript-memoize";
import type { GraphQLTypeNames } from "../../AuraEntityOperations";
import type { SchemaBuilder } from "../SchemaBuilder";
import type { StaticTypes } from "./StaticTypes";

/** This class defines the GraphQL types for an entity */
export abstract class EntityTypes<T extends GraphQLTypeNames> {
    protected schemaBuilder: SchemaBuilder;
    protected entityOperations: T;
    protected staticTypes: StaticTypes;

    constructor({
        schemaBuilder,
        entityOperations,
        staticTypes,
    }: {
        schemaBuilder: SchemaBuilder;
        staticTypes: StaticTypes;
        entityOperations: T;
    }) {
        this.schemaBuilder = schemaBuilder;
        this.entityOperations = entityOperations;
        this.staticTypes = staticTypes;
    }

    @Memoize()
    public get connectionOperation(): ObjectTypeComposer {
        return this.schemaBuilder.createObjectType(this.entityOperations.connectionOperation, {
            connection: this.connection,
        });
    }

    @Memoize()
    public get connection(): ObjectTypeComposer {
        return this.schemaBuilder.createObjectType(this.entityOperations.connectionType, {
            pageInfo: this.staticTypes.pageInfo,
            edges: [this.edge],
        });
    }

    @Memoize()
    public get edge(): ObjectTypeComposer {
        const fields = {
            node: this.nodeType,
            cursor: "String",
        };

        const properties = this.getEdgeProperties();
        if (properties) {
            fields["properties"] = properties;
        }

        return this.schemaBuilder.createObjectType(this.entityOperations.edgeType, fields);
    }

    protected abstract getEdgeProperties(): ObjectTypeComposer | undefined;
    public abstract get nodeType(): string;
}

import type { ObjectTypeComposer } from "graphql-compose";
import { Memoize } from "typescript-memoize";
import type { GraphQLTypeNames } from "../../graphQLTypeNames/EntityTypeNames";
import type { SchemaBuilder } from "../SchemaBuilder";
import type { StaticTypes } from "./StaticTypes";

/** This class defines the GraphQL types for an entity */
export abstract class EntityTypes<T extends GraphQLTypeNames> {
    protected schemaBuilder: SchemaBuilder;
    protected entityTypes: T;
    protected staticTypes: StaticTypes;

    constructor({
        schemaBuilder,
        entityTypes,
        staticTypes,
    }: {
        schemaBuilder: SchemaBuilder;
        staticTypes: StaticTypes;
        entityTypes: T;
    }) {
        this.schemaBuilder = schemaBuilder;
        this.entityTypes = entityTypes;
        this.staticTypes = staticTypes;
    }

    @Memoize()
    public get connectionOperation(): ObjectTypeComposer {
        return this.schemaBuilder.createObjectType(this.entityTypes.connectionOperation, {
            connection: this.connection,
        });
    }

    @Memoize()
    public get connection(): ObjectTypeComposer {
        return this.schemaBuilder.createObjectType(this.entityTypes.connectionType, {
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

        return this.schemaBuilder.createObjectType(this.entityTypes.edgeType, fields);
    }

    protected abstract getEdgeProperties(): ObjectTypeComposer | undefined;
    public abstract get nodeType(): string;
}

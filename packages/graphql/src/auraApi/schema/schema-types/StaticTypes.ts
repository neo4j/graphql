import type { ObjectTypeComposer } from "graphql-compose";
import { Memoize } from "typescript-memoize";
import type { SchemaBuilder } from "../SchemaBuilder";

export class StaticTypes {
    private schemaBuilder: SchemaBuilder;

    constructor({ schemaBuilder }: { schemaBuilder: SchemaBuilder }) {
        this.schemaBuilder = schemaBuilder;
    }

    @Memoize()
    public get pageInfo(): ObjectTypeComposer {
        return this.schemaBuilder.createObjectType("PageInfo", { hasNextPage: "Boolean", hasPreviousPage: "Boolean" });
    }
}

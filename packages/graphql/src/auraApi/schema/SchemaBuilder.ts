import type { GraphQLSchema } from "graphql";
import { SchemaComposer } from "graphql-compose";

export class SchemaBuilder {
    private composer: SchemaComposer;

    constructor() {
        this.composer = new SchemaComposer();
    }

    public createObjectType(name: string, description?: string) {
        this.composer.createObjectTC({
            name,
            description,
        });
    }

    public addFieldToObjectType(typeName: string) {
        this.composer.getOTC(typeName);
    }

    public build(): GraphQLSchema {
        return this.composer.buildSchema();
    }
}

import type { GraphQLSchema } from "graphql";
import type { ObjectTypeComposer } from "graphql-compose";
import { SchemaComposer } from "graphql-compose";

export class SchemaBuilder {
    private composer: SchemaComposer;

    constructor() {
        this.composer = new SchemaComposer();
    }

    public createObjectType(name: string, fields: Record<string, any>, description?: string) {
        this.composer.createObjectTC({
            name,
            description,
            fields,
        });
    }

    public addQueryField(name: string, type: ObjectTypeComposer | string) {
        this.composer.Query.addFields({
            [name]: {
                type: type,
                resolve: () => null,
            },
        });
    }

    public getObjectType(typeName: string) {
        return this.composer.getOTC(typeName);
    }

    public addFieldToObjectType(typeName: string) {
        this.composer.getOTC(typeName);
    }

    public build(): GraphQLSchema {
        return this.composer.buildSchema();
    }
}

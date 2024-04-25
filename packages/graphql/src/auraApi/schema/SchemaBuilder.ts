import type { GraphQLSchema } from "graphql";
import type { ObjectTypeComposer } from "graphql-compose";
import { SchemaComposer } from "graphql-compose";

export class SchemaBuilder {
    private composer: SchemaComposer;

    constructor() {
        this.composer = new SchemaComposer();
    }

    public createObjectType(name: string, fields?: Record<string, any>, description?: string): ObjectTypeComposer {
        return this.composer.createObjectTC({
            name,
            description,
            fields,
        });
    }

    public addFieldToType(type: ObjectTypeComposer, fields: Record<string, any>): void {
        type.addFields(fields);
    }

    public addQueryField(name: string, type: ObjectTypeComposer | string, resolver: (...args: any[]) => any): void {
        this.composer.Query.addFields({
            [name]: {
                type: type,
                resolve: resolver,
            },
        });
    }

    public getObjectType(typeName: string): ObjectTypeComposer {
        return this.composer.getOTC(typeName);
    }

    public build(): GraphQLSchema {
        return this.composer.buildSchema();
    }
}

import { GraphQLBoolean, GraphQLFloat, GraphQLID, GraphQLInt, GraphQLString } from "graphql";
import type { SchemaComposer } from "graphql-compose";
import { ScalarTypeComposer } from "graphql-compose";
import { Memoize } from "typescript-memoize";

export class SchemaBuilderTypes {
    private composer: SchemaComposer;

    constructor(composer: SchemaComposer) {
        this.composer = composer;
    }

    @Memoize()
    public get id(): ScalarTypeComposer {
        return new ScalarTypeComposer(GraphQLID, this.composer);
    }

    @Memoize()
    public get int(): ScalarTypeComposer {
        return new ScalarTypeComposer(GraphQLInt, this.composer);
    }
    @Memoize()
    public get float(): ScalarTypeComposer {
        return new ScalarTypeComposer(GraphQLFloat, this.composer);
    }
    @Memoize()
    public get string(): ScalarTypeComposer {
        return new ScalarTypeComposer(GraphQLString, this.composer);
    }
    @Memoize()
    public get boolean(): ScalarTypeComposer {
        return new ScalarTypeComposer(GraphQLBoolean, this.composer);
    }
}

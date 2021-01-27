import { DefinitionNode, FieldDefinitionNode } from "graphql";
import { Driver } from "neo4j-driver";
import { TypeDefs, Resolvers, BaseField } from "../types";
import { makeAugmentedSchema, mergeTypeDefs, mergeExtensionsIntoAST } from "../schema";
import NeoSchema from "./NeoSchema";
import Model from "./Model";

export interface OGMConstructor {
    typeDefs: TypeDefs;
    driver: Driver;
    resolvers?: Resolvers;
    schemaDirectives?: Resolvers;
}

function filterTypeDefs(typeDefs: TypeDefs) {
    const merged = mergeTypeDefs(typeDefs);
    const extended = mergeExtensionsIntoAST(merged);

    return {
        ...extended,
        definitions: extended.definitions.reduce((res: DefinitionNode[], def) => {
            if (def.kind !== "ObjectTypeDefinition" && def.kind !== "InterfaceTypeDefinition") {
                return [...res, def];
            }

            if (["Query", "Subscription", "Mutation"].includes(def.name.value)) {
                return [...res, def];
            }

            return [
                ...res,
                {
                    ...def,
                    directives: def.directives?.filter((x) => x.name.value !== "auth"),
                    fields: def.fields?.reduce(
                        (r: FieldDefinitionNode[], f) => [
                            ...r,
                            { ...f, directives: f.directives?.filter((x) => x.name.value !== "private") },
                        ],
                        []
                    ),
                },
            ];
        }, []),
    };
}

class OGM {
    public neoSchema: NeoSchema;

    public models: Model[];

    constructor(input: OGMConstructor) {
        const typeDefs = filterTypeDefs(input.typeDefs);

        this.neoSchema = makeAugmentedSchema({
            typeDefs,
            ...(input.driver ? { context: { driver: input.driver } } : {}),
        });

        this.models = this.neoSchema.nodes.map((n) => {
            const selectionSet = `
                {
                    ${
                        [n.primitiveFields, n.scalarFields, n.enumFields, n.dateTimeFields].reduce(
                            (res: string[], v: BaseField[]) => [...res, ...v.map((x) => x.fieldName)],
                            []
                        ) as string[]
                    }
                }
            `;

            return new Model({
                neoSchema: this.neoSchema,
                name: n.name,
                selectionSet,
            });
        });
    }

    model(name: string): Model | undefined {
        const found = this.models.find((n) => n.name === name);

        return found;
    }
}

export default OGM;

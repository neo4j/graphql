import { DefinitionNode, FieldDefinitionNode } from "graphql";
import { Driver } from "neo4j-driver";
import { TypeDefs, Resolvers, BaseField, SchemaDirectives, DriverConfig } from "../types";
import { mergeTypeDefs } from "../schema";
import Neo4jGraphQL from "./Neo4jGraphQL";
import Model from "./Model";

export interface OGMConstructor {
    typeDefs: TypeDefs;
    driver: Driver;
    resolvers?: Resolvers;
    schemaDirectives?: SchemaDirectives;
    debug?: boolean | ((...values: any[]) => void);
    driverConfig?: DriverConfig;
}

function filterTypeDefs(typeDefs: TypeDefs) {
    const merged = mergeTypeDefs(typeDefs);

    return {
        ...merged,
        definitions: merged.definitions.reduce((res: DefinitionNode[], def) => {
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
                    directives: def.directives?.filter((x) => !["auth", "exclude"].includes(x.name.value)),
                    fields: def.fields?.reduce(
                        (r: FieldDefinitionNode[], f) => [
                            ...r,
                            {
                                ...f,
                                directives: f.directives?.filter((x) => !["private", "ignore"].includes(x.name.value)),
                            },
                        ],
                        []
                    ),
                },
            ];
        }, []),
    };
}

class OGM {
    public neoSchema: Neo4jGraphQL;

    public models: Model[];

    public input: OGMConstructor;

    constructor(input: OGMConstructor) {
        this.input = input;

        const typeDefs = filterTypeDefs(input.typeDefs);

        this.neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver: input.driver,
            resolvers: input.resolvers,
            schemaDirectives: input.schemaDirectives,
            debug: input.debug,
            driverConfig: input.driverConfig,
        });

        this.models = this.neoSchema.nodes.map((n) => {
            const selectionSet = `
                {
                    ${[n.primitiveFields, n.scalarFields, n.enumFields, n.dateTimeFields].reduce(
                        (res: string[], v: BaseField[]) => [...res, ...v.map((x) => x.fieldName)],
                        []
                    )}
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

    async verify(input: { driver?: Driver } = {}): Promise<void> {
        const driver = input.driver || this.input.driver;

        return this.neoSchema.verify({ driver });
    }
}

export default OGM;

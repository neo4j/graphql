import { DefinitionNode, FieldDefinitionNode } from "graphql";
import { Driver } from "neo4j-driver";
import { mergeTypeDefs } from "@graphql-tools/merge";
import { Neo4jGraphQL, BaseField, Neo4jGraphQLConstructor } from "@neo4j/graphql";
import Model from "./Model";

function filterTypeDefs(typeDefs: Neo4jGraphQLConstructor["typeDefs"]) {
    const merged = mergeTypeDefs(Array.isArray(typeDefs) ? (typeDefs as string[]) : [typeDefs as string]);

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

    public input: Neo4jGraphQLConstructor;

    constructor(input: Neo4jGraphQLConstructor) {
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

    model(name: string): Model {
        const found = this.models.find((n) => n.name === name);

        if (!found) {
            throw new Error(`Could not find model ${name}`);
        }

        return found;
    }

    async verifyDatabase(input: { driver?: Driver } = {}): Promise<void> {
        const driver = input.driver || this.input.driver;

        return this.neoSchema.verifyDatabase({ driver });
    }
}

export default OGM;

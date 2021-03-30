import { DefinitionNode, DocumentNode, FieldDefinitionNode } from "graphql";
import { Neo4jGraphQLConstructor } from "@neo4j/graphql";
import { mergeTypeDefs } from "@graphql-tools/merge";

const excludedDirectives = ["auth", "exclude", "private", "readonly", "writeonly"];

function filterDocument(typeDefs: Neo4jGraphQLConstructor["typeDefs"]): DocumentNode {
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
                    directives: def.directives?.filter((x) => !excludedDirectives.includes(x.name.value)),
                    fields: def.fields?.reduce(
                        (r: FieldDefinitionNode[], f) => [
                            ...r,
                            {
                                ...f,
                                directives: f.directives?.filter((x) => !excludedDirectives.includes(x.name.value)),
                            },
                        ],
                        []
                    ),
                },
            ];
        }, []),
    };
}

export default filterDocument;

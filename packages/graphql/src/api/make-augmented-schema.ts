/* eslint-disable @typescript-eslint/ban-ts-comment */
import { mergeTypeDefs } from "@graphql-tools/merge";
import { GraphQLSchema, ObjectTypeDefinitionNode, visit } from "graphql";
import { SchemaComposer } from "graphql-compose";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { NeoSchema, NeoSchemaConstructor, Node } from "../classes";
import { getFieldDirective, getFieldTypeMeta, findOne, findMany } from "../graphql";
import { RelationField, CypherField, NestedField, PrimitiveField, BaseField } from "../types";

interface Input {
    typeDefs: any;
    resolvers?: any;
}

function makeAugmentedSchema(input: Input): NeoSchema {
    const document = mergeTypeDefs(Array.isArray(input.typeDefs) ? input.typeDefs : [input.typeDefs]);

    const composer = new SchemaComposer();

    let neoSchema: NeoSchema;

    composer.addTypeDefs(`
        type PageInfo {
            hasNextPage: Int
        }
    `);

    // @ts-ignore
    const neoSchemaInput: NeoSchemaConstructor = {
        nodes: [],
    };

    const documentReferenceNames = document.definitions.reduce((res: string[], def) => {
        if (def.kind !== "ObjectTypeDefinition") {
            return res;
        }

        return [...res, def.name.value];
    }, []) as string[];

    function createObjectType(definition: ObjectTypeDefinitionNode) {
        if (["Query", "Mutation", "Subscription"].includes(definition.name.value)) {
            // TODO
            return;
        }

        const { relationFields, primitiveFields, cypherFields, nestedFields } = definition?.fields?.reduce(
            (
                res: {
                    relationFields: RelationField[];
                    primitiveFields: PrimitiveField[];
                    cypherFields: CypherField[];
                    nestedFields: NestedField[];
                },
                field
            ) => {
                const typeMeta = getFieldTypeMeta(field);

                const relationDirective = getFieldDirective(field, "relation");
                const cypherDirective = getFieldDirective(field, "cypher");
                const isNested = documentReferenceNames.includes(typeMeta.name);
                const otherDirectives = field.directives?.filter((x) => !["relation", "cypher"].includes(x.name.value));

                const baseField: BaseField = {
                    fieldName: field.name.value,
                    typeMeta,
                    ...(otherDirectives ? { otherDirectives } : { otherDirectives: [] }),
                };

                if (relationDirective) {
                    const directionArg = relationDirective.arguments?.find((x) => x.name.value === "direction");
                    if (!directionArg) {
                        throw new Error("@relation direction required");
                    }
                    if (directionArg.value.kind !== "StringValue") {
                        throw new Error("@relation direction not a string");
                    }

                    const typeArg = relationDirective.arguments?.find((x) => x.name.value === "type");
                    if (!typeArg) {
                        throw new Error("@relation type required");
                    }
                    if (typeArg.value.kind !== "StringValue") {
                        throw new Error("@relation type not a string");
                    }

                    const direction = directionArg.value.value;
                    const type = typeArg.value.value;

                    const relationField: RelationField = {
                        ...baseField,
                        type,
                        // @ts-ignore
                        direction,
                    };

                    res.relationFields.push(relationField);
                } else if (cypherDirective) {
                    const stmtArg = cypherDirective.arguments?.find((x) => x.name.value === "statement");
                    if (!stmtArg) {
                        throw new Error("@cypher statement required");
                    }
                    if (stmtArg.value.kind !== "StringValue") {
                        throw new Error("@cypher statement not a string");
                    }

                    const statement = stmtArg.value.value;

                    const cypherField: CypherField = {
                        ...baseField,
                        statement,
                    };

                    res.cypherFields.push(cypherField);
                } else if (isNested) {
                    const nestedField: NestedField = baseField;
                    res.nestedFields.push(nestedField);
                } else {
                    const primitiveField: PrimitiveField = baseField;
                    res.primitiveFields.push(primitiveField);
                }

                return res;
            },
            { relationFields: [], primitiveFields: [], cypherFields: [], nestedFields: [] }
        ) as {
            relationFields: RelationField[];
            primitiveFields: PrimitiveField[];
            cypherFields: CypherField[];
            nestedFields: NestedField[];
        };

        const node = new Node({
            name: definition.name.value,
            relationFields,
            primitiveFields,
            cypherFields,
            nestedFields,
        });

        neoSchemaInput.nodes.push(node);

        const composeNodeFields = [...primitiveFields, ...nestedFields].map(
            (x) => `${x.fieldName}: ${x.typeMeta.pretty}`
        );
        const composeNode = composer.createObjectTC(
            `
            type ${node.name} {
                ${composeNodeFields.join("\n")}
            }
           `
        );

        composer.createObjectTC(`
            type ${node.name}Edge {
                node: ${node.name}
            }
        `);

        composer.createObjectTC(`
            type ${node.name}Connection {
                edges: [${node.name}Edge]
                pageInfo: PageInfo
            }
        `);

        relationFields.forEach((relation) => {
            if (relation.typeMeta.array) {
                composeNode.addFields({
                    [relation.fieldName]: {
                        type: `${relation.typeMeta.name}Connection`,
                        args: { query: `${relation.typeMeta.name}Query`, options: `${relation.typeMeta.name}Options` },
                    },
                });
            } else {
                composeNode.addFields({
                    [relation.fieldName]: {
                        type: relation.typeMeta.name,
                        args: { query: `${relation.typeMeta.name}Query` },
                    },
                });
            }
        });

        const sortEnum = composer.createEnumTC({
            name: `${node.name}_SORT`,
            values: primitiveFields.reduce((res, v) => {
                return {
                    ...res,
                    [`${v.fieldName}_DESC`]: { value: `${v.fieldName}_DESC` },
                    [`${v.fieldName}_ASC`]: { value: `${v.fieldName}_ASC` },
                };
            }, {}),
        });

        const looseFields = primitiveFields.reduce((res, v) => {
            return {
                ...res,
                [v.fieldName]: v.typeMeta.array ? `[${v.typeMeta.name}]` : v.typeMeta.name,
            };
        }, {});

        composer.createInputTC({
            name: `${node.name}_AND`,
            fields: {
                ...looseFields,
                OR: `[${node.name}_OR]`,
                AND: `[${node.name}_AND]`,
            },
        });

        composer.createInputTC({
            name: `${node.name}_OR`,
            fields: {
                ...looseFields,
                OR: `[${node.name}_OR]`,
                AND: `[${node.name}_AND]`,
            },
        });

        composer.createInputTC({
            name: `${node.name}Query`,
            fields: {
                ...looseFields,
                AND: `[${node.name}_AND]`,
                OR: `[${node.name}_OR]`,
            },
        });

        composer.createInputTC({
            name: `${node.name}Options`,
            fields: { sort: sortEnum.List, limit: "Int", skip: "Int" },
        });

        // @ts-ignore
        composer.Query.addFields({
            [`FindOne_${node.name}`]: findOne({ definition, getSchema: () => neoSchema }),
            [`FindMany_${node.name}`]: findMany({ definition, getSchema: () => neoSchema }),
        });
    }

    const visitor = {
        ObjectTypeDefinition: createObjectType,
    };

    visit(document, { enter: visitor });

    const generatedTypeDefs = composer.toSDL();
    const generatedResolvers = composer.getResolveMethods();

    neoSchemaInput.schema = makeExecutableSchema({
        typeDefs: generatedTypeDefs,
        resolvers: generatedResolvers,
    });

    neoSchema = new NeoSchema(neoSchemaInput);

    return neoSchema;
}

export default makeAugmentedSchema;

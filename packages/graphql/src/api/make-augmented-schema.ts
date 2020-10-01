import { mergeTypeDefs } from "@graphql-tools/merge";
import { ObjectTypeDefinitionNode, visit } from "graphql";
import { SchemaComposer } from "graphql-compose";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { NeoSchema, NeoSchemaConstructor, Node } from "../classes";
import { getFieldDirective, getFieldTypeMeta, findOne, findMany } from "../graphql";
import { RelationField, CypherField, PrimitiveField, BaseField } from "../types";

export interface MakeAugmentedSchemaOptions {
    typeDefs: any;
    debug?: boolean | ((...values: any[]) => void);
}

function makeAugmentedSchema(options: MakeAugmentedSchemaOptions): NeoSchema {
    const document = mergeTypeDefs(Array.isArray(options.typeDefs) ? options.typeDefs : [options.typeDefs]);

    const composer = new SchemaComposer();

    let neoSchema: NeoSchema;
    // @ts-ignore
    const neoSchemaInput: NeoSchemaConstructor = {
        nodes: [],
        options,
    };

    function createObjectType(definition: ObjectTypeDefinitionNode) {
        if (["Query", "Mutation", "Subscription"].includes(definition.name.value)) {
            // TODO
            return;
        }

        const { relationFields, primitiveFields, cypherFields } = definition?.fields?.reduce(
            (
                res: {
                    relationFields: RelationField[];
                    primitiveFields: PrimitiveField[];
                    cypherFields: CypherField[];
                },
                field
            ) => {
                const typeMeta = getFieldTypeMeta(field);

                const relationDirective = getFieldDirective(field, "relationship");
                const cypherDirective = getFieldDirective(field, "cypher");
                const otherDirectives = field.directives?.filter(
                    (x) => !["relationship", "cypher"].includes(x.name.value)
                );

                const baseField: BaseField = {
                    fieldName: field.name.value,
                    typeMeta,
                    ...(otherDirectives ? { otherDirectives } : { otherDirectives: [] }),
                    ...(field.arguments ? { arguments: [...field.arguments] } : { arguments: [] }),
                };

                if (relationDirective) {
                    const directionArg = relationDirective.arguments?.find((x) => x.name.value === "direction");
                    if (!directionArg) {
                        throw new Error("@relationship direction required");
                    }
                    if (directionArg.value.kind !== "StringValue") {
                        throw new Error("@relationship direction not a string");
                    }

                    const typeArg = relationDirective.arguments?.find((x) => x.name.value === "type");
                    if (!typeArg) {
                        throw new Error("@relationship type required");
                    }
                    if (typeArg.value.kind !== "StringValue") {
                        throw new Error("@relationship type not a string");
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
                } else {
                    const primitiveField: PrimitiveField = baseField;
                    res.primitiveFields.push(primitiveField);
                }

                return res;
            },
            { relationFields: [], primitiveFields: [], cypherFields: [] }
        ) as {
            relationFields: RelationField[];
            primitiveFields: PrimitiveField[];
            cypherFields: CypherField[];
        };

        const node = new Node({
            name: definition.name.value,
            relationFields,
            primitiveFields,
            cypherFields,
        });

        neoSchemaInput.nodes.push(node);

        const composeNode = composer.createObjectTC({
            name: node.name,
            fields: [...primitiveFields, ...cypherFields].reduce((res, v) => {
                const field = { type: v.typeMeta.pretty, args: [] } as {
                    type: string;
                    args: { [k: string]: any };
                };

                if (v.arguments) {
                    field.args = v.arguments.reduce((_args, arg) => {
                        const meta = getFieldTypeMeta(arg);

                        const newArg = {} as any;
                        newArg.type = meta.pretty;
                        newArg.description = arg.description;
                        newArg.defaultValue = arg.defaultValue;

                        return {
                            ..._args,
                            [arg.name.value]: newArg,
                        };
                    }, {});
                }

                return { ...res, [v.fieldName]: field };
            }, {}),
        });

        composeNode.addFields(
            relationFields.reduce(
                (res, relation) => ({
                    ...res,
                    [relation.fieldName]: {
                        type: relation.typeMeta.pretty,
                        args: {
                            query: `${relation.typeMeta.name}Query`,
                            options: `${relation.typeMeta.name}Options`,
                        },
                    },
                }),
                {}
            )
        );

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
                ...(!v.typeMeta.array ? { [`${v.fieldName}_IN`]: `[${v.typeMeta.name}]` } : {}),
            };
        }, {});

        const andOrFields = {
            _OR: `[${node.name}_OR]`,
            _AND: `[${node.name}_AND]`,
        };

        composer.createInputTC({
            name: `${node.name}_AND`,
            fields: {
                ...looseFields,
                ...andOrFields,
            },
        });

        composer.createInputTC({
            name: `${node.name}_OR`,
            fields: {
                ...looseFields,
                ...andOrFields,
            },
        });

        composer.createInputTC({
            name: `${node.name}Query`,
            fields: {
                ...looseFields,
                ...andOrFields,
            },
        });

        composer.createInputTC({
            name: `${node.name}Options`,
            fields: { sort: sortEnum.List, limit: "Int", skip: "Int" },
        });

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

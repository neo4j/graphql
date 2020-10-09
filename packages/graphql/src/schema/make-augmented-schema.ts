import { mergeTypeDefs } from "@graphql-tools/merge";
import { ObjectTypeDefinitionNode, visit } from "graphql";
import { SchemaComposer, ObjectTypeComposerFieldConfigAsObjectDefinition } from "graphql-compose";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { NeoSchema, NeoSchemaConstructor, Node } from "../classes";
import getFieldTypeMeta from "./get-field-type-meta";
import getCypherMeta from "./get-cypher-meta";
import getRelationshipMeta from "./get-relationship-meta";
import findMany from "./find-many";
import findOne from "./find-one";
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
            // TODO custom resolvers
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
                const relationshipMeta = getRelationshipMeta(field);
                const cypherMeta = getCypherMeta(field);

                const baseField: BaseField = {
                    fieldName: field.name.value,
                    typeMeta: getFieldTypeMeta(field),
                    otherDirectives: (field.directives || []).filter(
                        (x) => !["relationship", "cypher"].includes(x.name.value)
                    ),
                    ...(field.arguments ? { arguments: [...field.arguments] } : { arguments: [] }),
                };

                if (relationshipMeta) {
                    const relationField: RelationField = {
                        ...baseField,
                        ...relationshipMeta,
                    };
                    res.relationFields.push(relationField);
                } else if (cypherMeta) {
                    const cypherField: CypherField = {
                        ...baseField,
                        ...cypherMeta,
                    };
                    res.cypherFields.push(cypherField);
                } else {
                    const primitiveField: PrimitiveField = {
                        ...baseField,
                    };
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
            fields: [...primitiveFields, ...cypherFields].reduce((res, field) => {
                const newField = {
                    type: field.typeMeta.pretty,
                    args: {},
                } as ObjectTypeComposerFieldConfigAsObjectDefinition<any, any>;

                if (field.arguments) {
                    newField.args = field.arguments.reduce((args, arg) => {
                        const meta = getFieldTypeMeta(arg);

                        return {
                            ...args,
                            [arg.name.value]: {
                                type: meta.pretty,
                                description: arg.description,
                                defaultValue: arg.defaultValue,
                            },
                        };
                    }, {});
                }

                return { ...res, [field.fieldName]: newField };
            }, {}),
        });

        composeNode.addFields(
            relationFields.reduce(
                (res, relation) => ({
                    ...res,
                    [relation.fieldName]: {
                        type: relation.typeMeta.pretty,
                        args: {
                            where: `${relation.typeMeta.name}Where`,
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
            OR: `[${node.name}OR]`,
            AND: `[${node.name}AND]`,
        };

        composer.createInputTC({
            name: `${node.name}AND`,
            fields: {
                ...looseFields,
                ...andOrFields,
            },
        });

        composer.createInputTC({
            name: `${node.name}OR`,
            fields: {
                ...looseFields,
                ...andOrFields,
            },
        });

        composer.createInputTC({
            name: `${node.name}Where`,
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

    neoSchemaInput.typeDefs = generatedTypeDefs;
    neoSchemaInput.resolvers = generatedResolvers;
    neoSchemaInput.schema = makeExecutableSchema({
        typeDefs: generatedTypeDefs,
        resolvers: generatedResolvers,
    });

    neoSchema = new NeoSchema(neoSchemaInput);

    return neoSchema;
}

export default makeAugmentedSchema;

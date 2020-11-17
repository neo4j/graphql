import { mergeTypeDefs } from "@graphql-tools/merge";
import { ObjectTypeDefinitionNode } from "graphql";
import { SchemaComposer, ObjectTypeComposerFieldConfigAsObjectDefinition, InputTypeComposer } from "graphql-compose";
import { makeExecutableSchema } from "@graphql-tools/schema";
import pluralize from "pluralize";
import { Auth, NeoSchema, NeoSchemaConstructor, Node } from "../classes";
import getFieldTypeMeta from "./get-field-type-meta";
import getCypherMeta from "./get-cypher-meta";
import getAuth from "./get-auth";
import getRelationshipMeta from "./get-relationship-meta";
import { RelationField, CypherField, PrimitiveField, BaseField } from "../types";
import { upperFirstLetter } from "../utils";
import findResolver from "./find";
import createResolver from "./create";
import deleteResolver from "./delete";

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
        options,
    };

    composer.createObjectTC({
        name: "DeleteInfo",
        fields: {
            nodesDeleted: "Int!",
            relationshipsDeleted: "Int!",
        },
    });

    neoSchemaInput.nodes = (document.definitions.filter(
        (x) => x.kind === "ObjectTypeDefinition" && !["Query", "Mutation", "Subscription"].includes(x.name.value)
    ) as ObjectTypeDefinitionNode[]).map((definition) => {
        const authDirective = definition.directives?.find((x) => x.name.value === "auth");
        let auth: Auth;
        if (authDirective) {
            // todo
            auth = getAuth(authDirective);
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
            // @ts-ignore
            auth,
        });

        return node;
    });

    neoSchemaInput.nodes.forEach((node) => {
        const composeNode = composer.createObjectTC({
            name: node.name,
            fields: [...node.primitiveFields, ...node.cypherFields].reduce((res, field) => {
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
            node.relationFields.reduce(
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
            name: `${node.name}Sort`,
            values: node.primitiveFields.reduce((res, f) => {
                return {
                    ...res,
                    [`${f.fieldName}_DESC`]: { value: `${f.fieldName}_DESC` },
                    [`${f.fieldName}_ASC`]: { value: `${f.fieldName}_ASC` },
                };
            }, {}),
        });

        const queryFields = node.primitiveFields.reduce(
            (res, f) => {
                return {
                    ...res,
                    [f.fieldName]: f.typeMeta.array ? `[${f.typeMeta.name}]` : f.typeMeta.name,
                    ...(!f.typeMeta.array ? { [`${f.fieldName}_IN`]: `[${f.typeMeta.name}]` } : {}),
                };
            },
            { OR: `[${node.name}OR]`, AND: `[${node.name}AND]` }
        );

        ["AND", "OR", "Where"].forEach((value) => {
            composer.createInputTC({
                name: `${node.name}${value}`,
                fields: queryFields,
            });
        });

        composer.createInputTC({
            name: `${node.name}Options`,
            fields: { sort: sortEnum.List, limit: "Int", skip: "Int" },
        });

        const nodeInput = composer.createInputTC({
            name: `${node.name}CreateInput`,
            fields: node.primitiveFields.reduce((r, f) => {
                return {
                    ...r,
                    [f.fieldName]: f.typeMeta.pretty,
                };
            }, {}),
        });

        let nodeConnectInput: InputTypeComposer<any> = (undefined as unknown) as InputTypeComposer<any>;
        if (node.relationFields.length) {
            nodeConnectInput = composer.createInputTC({
                name: `${node.name}ConnectInput`,
                fields: {},
            });
        }

        composer.createInputTC({
            name: `${node.name}ConnectFieldInput`,
            fields: {
                where: `${node.name}Where`,
                ...(node.relationFields.length ? { connect: nodeConnectInput } : {}),
            },
        });

        node.relationFields.forEach((rel) => {
            const refNode = neoSchemaInput.nodes.find((x) => x.name === rel.typeMeta.name) as Node;
            const createField = rel.typeMeta.array ? `[${refNode.name}CreateInput]` : `${refNode.name}CreateInput`;
            const nodeFieldInputName = `${node.name}${upperFirstLetter(rel.fieldName)}FieldInput`;
            const connectField = rel.typeMeta.array
                ? `[${refNode.name}ConnectFieldInput]`
                : `${refNode.name}ConnectFieldInput`;

            composer.createInputTC({
                name: nodeFieldInputName,
                fields: {
                    create: createField,
                    connect: connectField,
                },
            });

            nodeInput.addFields({
                [rel.fieldName]: nodeFieldInputName,
            });

            nodeConnectInput.addFields({
                [rel.fieldName]: connectField,
            });
        });

        composer.Query.addFields({
            [pluralize(node.name)]: findResolver({ node, getSchema: () => neoSchema }),
        });

        composer.Mutation.addFields({
            [`create${pluralize(node.name)}`]: createResolver({ node, getSchema: () => neoSchema }),
            [`delete${pluralize(node.name)}`]: deleteResolver({ node, getSchema: () => neoSchema }),
        });
    });

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

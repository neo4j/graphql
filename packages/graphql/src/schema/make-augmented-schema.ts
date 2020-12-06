import {
    DirectiveDefinitionNode,
    DirectiveNode,
    EnumTypeDefinitionNode,
    ObjectTypeDefinitionNode,
    print,
    ScalarTypeDefinitionNode,
    ValueNode,
} from "graphql";
import {
    SchemaComposer,
    ObjectTypeComposerFieldConfigAsObjectDefinition,
    InputTypeComposer,
    DirectiveArgs,
} from "graphql-compose";
import { makeExecutableSchema } from "@graphql-tools/schema";
import pluralize from "pluralize";
import { Auth, NeoSchema, NeoSchemaConstructor, Node } from "../classes";
import getFieldTypeMeta from "./get-field-type-meta";
import getCypherMeta from "./get-cypher-meta";
import getAuth from "./get-auth";
import getRelationshipMeta from "./get-relationship-meta";
import { RelationField, CypherField, PrimitiveField, BaseField, CustomEnumField, CustomScalarField } from "../types";
import { upperFirstLetter } from "../utils";
import findResolver from "./find";
import createResolver from "./create";
import deleteResolver from "./delete";
import updateResolver from "./update";
import mergeExtensionsIntoAST from "./merge-extensions-into-ast";
import parseValueNode from "./parse-value-node";
import mergeTypeDefs from "./merge-typedefs";

export interface MakeAugmentedSchemaOptions {
    typeDefs: any;
    resolvers?: any;
    schemaDirectives?: any;
    debug?: boolean | ((...values: any[]) => void);
}

function makeAugmentedSchema(options: MakeAugmentedSchemaOptions): NeoSchema {
    const document = mergeExtensionsIntoAST(mergeTypeDefs(options.typeDefs));
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

    const scalars = document.definitions.filter((x) => x.kind === "ScalarTypeDefinition") as ScalarTypeDefinitionNode[];
    const scalarNames = scalars.map((x) => x.name.value);
    const enums = document.definitions.filter((x) => x.kind === "EnumTypeDefinition") as EnumTypeDefinitionNode[];
    const enumNames = enums.map((x) => x.name.value);
    const directives = document.definitions.filter(
        (x) => x.kind === "DirectiveDefinition"
    ) as DirectiveDefinitionNode[];

    const nodes = (document.definitions.filter(
        (x) => x.kind === "ObjectTypeDefinition" && !["Query", "Mutation", "Subscription"].includes(x.name.value)
    ) as ObjectTypeDefinitionNode[]).map((definition) => {
        const otherDirectives = (definition.directives || []).filter((x) => x.name.value !== "auth") as DirectiveNode[];
        const authDirective = (definition.directives || []).find((x) => x.name.value === "auth");

        let auth: Auth;
        if (authDirective) {
            auth = getAuth(authDirective);
        }

        const { relationFields, primitiveFields, cypherFields, scalarFields, enumFields } = definition?.fields?.reduce(
            (
                res: {
                    relationFields: RelationField[];
                    primitiveFields: PrimitiveField[];
                    cypherFields: CypherField[];
                    scalarFields: CustomScalarField[];
                    enumFields: CustomEnumField[];
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
                    arguments: [...(field.arguments || [])],
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
                } else if (scalarNames.includes(baseField.typeMeta.name)) {
                    const scalarField: CustomScalarField = {
                        ...baseField,
                    };
                    res.scalarFields.push(scalarField);
                } else if (enumNames.includes(baseField.typeMeta.name)) {
                    const enumField: CustomEnumField = {
                        ...baseField,
                    };
                    res.enumFields.push(enumField);
                } else {
                    const primitiveField: PrimitiveField = {
                        ...baseField,
                    };
                    res.primitiveFields.push(primitiveField);
                }

                return res;
            },
            { relationFields: [], primitiveFields: [], cypherFields: [], scalarFields: [], enumFields: [] }
        ) as {
            relationFields: RelationField[];
            primitiveFields: PrimitiveField[];
            cypherFields: CypherField[];
            scalarFields: CustomScalarField[];
            enumFields: CustomEnumField[];
        };

        const node = new Node({
            name: definition.name.value,
            relationFields,
            primitiveFields,
            cypherFields,
            scalarFields,
            enumFields,
            otherDirectives,
            // @ts-ignore
            auth,
        });

        return node;
    });

    const nodeNames = nodes.map((x) => x.name);
    neoSchemaInput.nodes = nodes;

    neoSchemaInput.nodes.forEach((node) => {
        const nodeFields = [
            ...node.primitiveFields,
            ...node.cypherFields,
            ...node.enumFields,
            ...node.scalarFields,
        ].reduce((res, field) => {
            const newField = {
                type: field.typeMeta.pretty,
                args: {},
            } as ObjectTypeComposerFieldConfigAsObjectDefinition<any, any>;

            if (field.otherDirectives.length) {
                newField.extensions = { directives: [] };

                field.otherDirectives.forEach((directive) => {
                    newField.extensions?.directives?.push({
                        args: directive.arguments?.reduce(
                            (r: DirectiveArgs, d) => ({ ...r, [d.name.value]: parseValueNode(d.value) }),
                            {}
                        ) as DirectiveArgs,
                        name: directive.name.value,
                    });
                });
            }

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
        }, {});

        const composeNode = composer.createObjectTC({
            name: node.name,
            fields: nodeFields,
            extensions: {
                directives: node.otherDirectives.map((direc) => ({
                    args: parseValueNode({
                        kind: "ListValue",
                        values: (direc.arguments || []).map((x) => x.value) as ValueNode[],
                    }),
                    name: direc.name.value,
                })),
            },
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
            values: [...node.primitiveFields, ...node.enumFields, ...node.scalarFields].reduce((res, f) => {
                return {
                    ...res,
                    [`${f.fieldName}_DESC`]: { value: `${f.fieldName}_DESC` },
                    [`${f.fieldName}_ASC`]: { value: `${f.fieldName}_ASC` },
                };
            }, {}),
        });

        const queryFields = [...node.primitiveFields, ...node.enumFields, ...node.scalarFields].reduce(
            (res, f) => {
                if (["ID", "String"].includes(f.typeMeta.name) || enumNames.includes(f.typeMeta.name)) {
                    const type = f.typeMeta.name === "ID" ? "ID" : "String";

                    // equality
                    if (f.typeMeta.array) {
                        res[f.fieldName] = `[${type}]`;
                    } else {
                        res[f.fieldName] = type;
                    }

                    res[`${f.fieldName}_IN`] = `[${type}]`;
                    res[`${f.fieldName}_NOT`] = type;
                    res[`${f.fieldName}_NOT_IN`] = `[${type}]`;
                    res[`${f.fieldName}_CONTAINS`] = type;
                    res[`${f.fieldName}_NOT_CONTAINS`] = type;
                    res[`${f.fieldName}_STARTS_WITH`] = type;
                    res[`${f.fieldName}_NOT_STARTS_WITH`] = type;
                    res[`${f.fieldName}_ENDS_WITH`] = type;
                    res[`${f.fieldName}_NOT_ENDS_WITH`] = type;
                    res[`${f.fieldName}_REGEX`] = "String";

                    return res;
                }

                if (["Boolean"].includes(f.typeMeta.name)) {
                    // equality
                    if (f.typeMeta.array) {
                        res[f.fieldName] = `[Boolean]`;
                    } else {
                        res[f.fieldName] = "Boolean";
                    }

                    res[`${f.fieldName}_NOT`] = "Boolean";

                    return res;
                }

                if (["Float", "Int"].includes(f.typeMeta.name)) {
                    if (f.typeMeta.array) {
                        res[f.fieldName] = `[${f.typeMeta.name}]`;
                    } else {
                        // equality
                        res[f.fieldName] = f.typeMeta.name;
                    }

                    res[`${f.fieldName}_IN`] = `[${f.typeMeta.name}]`;
                    res[`${f.fieldName}_NOT_IN`] = `[${f.typeMeta.name}]`;
                    res[`${f.fieldName}_NOT`] = f.typeMeta.name;
                    res[`${f.fieldName}_LT`] = f.typeMeta.name;
                    res[`${f.fieldName}_LTE`] = f.typeMeta.name;
                    res[`${f.fieldName}_GT`] = f.typeMeta.name;
                    res[`${f.fieldName}_GTE`] = f.typeMeta.name;

                    return res;
                }

                // equality
                if (f.typeMeta.array) {
                    res[f.fieldName] = `[${f.typeMeta.name}]`;
                } else {
                    res[f.fieldName] = f.typeMeta.name;
                }

                return res;
            },
            { OR: `[${node.name}OR]`, AND: `[${node.name}AND]` }
        );

        const [andInput, orInput, whereInput] = ["AND", "OR", "Where"].map((value) => {
            return composer.createInputTC({
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
            fields: [...node.primitiveFields, ...node.scalarFields, ...node.enumFields].reduce((r, f) => {
                return {
                    ...r,
                    [f.fieldName]: f.typeMeta.pretty,
                };
            }, {}),
        });

        const nodeUpdateInput = composer.createInputTC({
            name: `${node.name}UpdateInput`,
            fields: [...node.primitiveFields, ...node.scalarFields, ...node.enumFields].reduce((res, f) => {
                return {
                    ...res,
                    [f.fieldName]: f.typeMeta.array ? `[${f.typeMeta.name}]` : f.typeMeta.name,
                };
            }, {}),
        });

        let nodeConnectInput: InputTypeComposer<any> = (undefined as unknown) as InputTypeComposer<any>;
        let nodeDisconnectInput: InputTypeComposer<any> = (undefined as unknown) as InputTypeComposer<any>;
        let nodeRelationInput: InputTypeComposer<any> = (undefined as unknown) as InputTypeComposer<any>;
        if (node.relationFields.length) {
            nodeConnectInput = composer.createInputTC({
                name: `${node.name}ConnectInput`,
                fields: {},
            });

            nodeDisconnectInput = composer.createInputTC({
                name: `${node.name}DisconnectInput`,
                fields: {},
            });

            nodeRelationInput = composer.createInputTC({
                name: `${node.name}RelationInput`,
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

        composer.createInputTC({
            name: `${node.name}DisconnectFieldInput`,
            fields: {
                where: `${node.name}Where`,
                ...(node.relationFields.length ? { disconnect: nodeDisconnectInput } : {}),
            },
        });

        node.relationFields.forEach((rel) => {
            const refNode = neoSchemaInput.nodes.find((x) => x.name === rel.typeMeta.name) as Node;
            const createField = rel.typeMeta.array ? `[${refNode.name}CreateInput]` : `${refNode.name}CreateInput`;
            const updateField = `${refNode.name}UpdateInput`;
            const nodeFieldInputName = `${node.name}${upperFirstLetter(rel.fieldName)}FieldInput`;
            const nodeFieldUpdateInputName = `${node.name}${upperFirstLetter(rel.fieldName)}UpdateFieldInput`;
            const connectField = rel.typeMeta.array
                ? `[${refNode.name}ConnectFieldInput]`
                : `${refNode.name}ConnectFieldInput`;
            const disconnectField = rel.typeMeta.array
                ? `[${refNode.name}DisconnectFieldInput]`
                : `${refNode.name}DisconnectFieldInput`;

            [whereInput, andInput, orInput].forEach((inputType) => {
                inputType.addFields({
                    [rel.fieldName]: `${refNode.name}Where`,
                    [`${rel.fieldName}_NOT`]: `${refNode.name}Where`,
                    [`${rel.fieldName}_IN`]: `[${refNode.name}Where]`,
                    [`${rel.fieldName}_NOT_IN`]: `[${refNode.name}Where]`,
                });
            });

            composer.createInputTC({
                name: nodeFieldUpdateInputName,
                fields: {
                    where: `${refNode.name}Where`,
                    update: updateField,
                    connect: connectField,
                    disconnect: disconnectField,
                    create: createField,
                },
            });

            composer.createInputTC({
                name: nodeFieldInputName,
                fields: {
                    create: createField,
                    connect: connectField,
                },
            });

            nodeRelationInput.addFields({
                [rel.fieldName]: createField,
            });

            nodeInput.addFields({
                [rel.fieldName]: nodeFieldInputName,
            });

            nodeUpdateInput.addFields({
                [rel.fieldName]: rel.typeMeta.array ? `[${nodeFieldUpdateInputName}]` : nodeFieldUpdateInputName,
            });

            nodeConnectInput.addFields({
                [rel.fieldName]: connectField,
            });

            nodeDisconnectInput.addFields({
                [rel.fieldName]: disconnectField,
            });
        });

        composer.Query.addFields({
            [pluralize(node.name)]: findResolver({ node, getSchema: () => neoSchema }),
        });

        composer.Mutation.addFields({
            [`create${pluralize(node.name)}`]: createResolver({ node, getSchema: () => neoSchema }),
            [`delete${pluralize(node.name)}`]: deleteResolver({ node, getSchema: () => neoSchema }),
            [`update${pluralize(node.name)}`]: updateResolver({ node, getSchema: () => neoSchema }),
        });
    });

    const extraDefinitions = [...enums, ...scalars, ...directives];
    if (extraDefinitions.length) {
        composer.addTypeDefs(print({ kind: "Document", definitions: extraDefinitions }));
    }

    const generatedTypeDefs = composer.toSDL();
    let generatedResolvers = composer.getResolveMethods();
    if (options.resolvers) {
        const {
            Query: customQueries = {},
            Mutation: customMutations = {},
            Subscription: customSubscriptions = {},
            ...rest
        } = options.resolvers;

        if (customQueries) {
            if (generatedResolvers.Query) {
                generatedResolvers.Query = { ...generatedResolvers.Query, ...customQueries };
            } else {
                generatedResolvers.Query = customQueries;
            }
        }

        if (customMutations) {
            if (generatedResolvers.Mutation) {
                generatedResolvers.Mutation = { ...generatedResolvers.Mutation, ...customMutations };
            } else {
                generatedResolvers.Mutation = customMutations;
            }
        }

        if (Object.keys(customSubscriptions).length) {
            generatedResolvers.Subscription = customSubscriptions;
        }

        const typeResolvers = Object.entries(rest).reduce((r, entry) => {
            const [key, value] = entry;

            if (!nodeNames.includes(key)) {
                return r;
            }

            return {
                ...r,
                [key]: {
                    ...generatedResolvers[key],
                    ...(value as any),
                },
            };
        }, {});
        generatedResolvers = {
            ...generatedResolvers,
            ...typeResolvers,
        };

        const otherResolvers = Object.entries(rest).reduce((r, entry) => {
            const [key, value] = entry;

            if (nodeNames.includes(key)) {
                return r;
            }

            return {
                ...r,
                [key]: value,
            };
        }, {});
        generatedResolvers = {
            ...generatedResolvers,
            ...otherResolvers,
        };
    }

    neoSchemaInput.typeDefs = generatedTypeDefs;
    neoSchemaInput.resolvers = generatedResolvers;
    neoSchemaInput.schema = makeExecutableSchema({
        typeDefs: generatedTypeDefs,
        resolvers: generatedResolvers,
        schemaDirectives: options.schemaDirectives,
    });

    neoSchema = new NeoSchema(neoSchemaInput);

    return neoSchema;
}

export default makeAugmentedSchema;

import {
    DefinitionNode,
    DirectiveDefinitionNode,
    DirectiveNode,
    EnumTypeDefinitionNode,
    InputObjectTypeDefinitionNode,
    InterfaceTypeDefinitionNode,
    NamedTypeNode,
    ObjectTypeDefinitionNode,
    print,
    ScalarTypeDefinitionNode,
    UnionTypeDefinitionNode,
} from "graphql";
import {
    SchemaComposer,
    ObjectTypeComposerFieldConfigAsObjectDefinition,
    InputTypeComposer,
    DirectiveArgs,
    ObjectTypeComposer,
} from "graphql-compose";
import { makeExecutableSchema } from "@graphql-tools/schema";
import pluralize from "pluralize";
import { Driver } from "neo4j-driver";
import { Auth, NeoSchema, NeoSchemaConstructor, Node } from "../classes";
import getFieldTypeMeta from "./get-field-type-meta";
import getCypherMeta from "./get-cypher-meta";
import getAuth from "./get-auth";
import getRelationshipMeta from "./get-relationship-meta";
import {
    RelationField,
    CypherField,
    PrimitiveField,
    BaseField,
    CustomEnumField,
    CustomScalarField,
    UnionField,
    InterfaceField,
    ObjectField,
} from "../types";
import { upperFirstLetter } from "../utils";
import findResolver from "./find";
import createResolver from "./create";
import deleteResolver from "./delete";
import cypherResolver from "./cypher-resolver";
import updateResolver from "./update";
import mergeExtensionsIntoAST from "./merge-extensions-into-ast";
import parseValueNode from "./parse-value-node";
import mergeTypeDefs from "./merge-typedefs";
import checkNodeImplementsInterfaces from "./check-node-implements-interfaces";

export interface MakeAugmentedSchemaOptions {
    typeDefs: any;
    resolvers?: any;
    schemaDirectives?: any;
    debug?: boolean | ((...values: any[]) => void);
    context?: { [k: string]: any } & { driver?: Driver };
}

interface ObjectFields {
    relationFields: RelationField[];
    primitiveFields: PrimitiveField[];
    cypherFields: CypherField[];
    scalarFields: CustomScalarField[];
    enumFields: CustomEnumField[];
    unionFields: UnionField[];
    interfaceFields: InterfaceField[];
    objectFields: ObjectField[];
}

interface CustomResolvers {
    customQuery?: ObjectTypeDefinitionNode;
    customCypherQuery?: ObjectTypeDefinitionNode;
    customMutation?: ObjectTypeDefinitionNode;
    customCypherMutation?: ObjectTypeDefinitionNode;
    customSubscription?: ObjectTypeDefinitionNode;
}

function getObjFieldMeta({
    obj,
    objects,
    interfaces,
    scalars,
    unions,
    enums,
}: {
    obj: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode;
    objects: ObjectTypeDefinitionNode[];
    interfaces: InterfaceTypeDefinitionNode[];
    unions: UnionTypeDefinitionNode[];
    scalars: ScalarTypeDefinitionNode[];
    enums: EnumTypeDefinitionNode[];
}) {
    return obj?.fields?.reduce(
        (res: ObjectFields, field) => {
            const relationshipMeta = getRelationshipMeta(field);
            const cypherMeta = getCypherMeta(field);
            const typeMeta = getFieldTypeMeta(field);
            const fieldInterface = interfaces.find((x) => x.name.value === typeMeta.name);
            const fieldUnion = unions.find((x) => x.name.value === typeMeta.name);
            const fieldScalar = scalars.find((x) => x.name.value === typeMeta.name);
            const fieldEnum = enums.find((x) => x.name.value === typeMeta.name);
            const fieldObject = objects.find((x) => x.name.value === typeMeta.name);

            const baseField: BaseField = {
                fieldName: field.name.value,
                typeMeta,
                otherDirectives: (field.directives || []).filter(
                    (x) => !["relationship", "cypher"].includes(x.name.value)
                ),
                arguments: [...(field.arguments || [])],
            };

            if (relationshipMeta) {
                if (fieldInterface) {
                    throw new Error("cannot have interface on relationship");
                }

                const relationField: RelationField = {
                    ...baseField,
                    ...relationshipMeta,
                };

                if (fieldUnion) {
                    const nodes: string[] = [];

                    fieldUnion.types?.forEach((type) => {
                        const node = objects.find((x) => x.name.value === type.name.value);
                        if (!node) {
                            throw new Error(`relationship union type ${type.name.value} must be an object type`);
                        }

                        nodes.push(type.name.value);
                    });

                    const unionField: UnionField = {
                        ...baseField,
                        nodes,
                    };

                    relationField.union = unionField;
                }

                res.relationFields.push(relationField);
            } else if (cypherMeta) {
                const cypherField: CypherField = {
                    ...baseField,
                    ...cypherMeta,
                };
                res.cypherFields.push(cypherField);
            } else if (fieldScalar) {
                const scalarField: CustomScalarField = {
                    ...baseField,
                };
                res.scalarFields.push(scalarField);
            } else if (fieldEnum) {
                const enumField: CustomEnumField = {
                    ...baseField,
                };
                res.enumFields.push(enumField);
            } else if (fieldUnion) {
                const unionField: UnionField = {
                    ...baseField,
                };
                res.unionFields.push(unionField);
            } else if (fieldInterface) {
                const interfaceField: InterfaceField = {
                    ...baseField,
                };
                res.interfaceFields.push(interfaceField);
            } else if (fieldObject) {
                const objectField: ObjectField = {
                    ...baseField,
                };
                res.objectFields.push(objectField);
            } else {
                const primitiveField: PrimitiveField = {
                    ...baseField,
                };
                res.primitiveFields.push(primitiveField);
            }

            return res;
        },
        {
            relationFields: [],
            primitiveFields: [],
            cypherFields: [],
            scalarFields: [],
            enumFields: [],
            unionFields: [],
            interfaceFields: [],
            objectFields: [],
        }
    ) as ObjectFields;
}

function objectFieldsToComposeFields(
    fields: BaseField[]
): { [k: string]: ObjectTypeComposerFieldConfigAsObjectDefinition<any, any> } {
    return fields.reduce((res, field) => {
        const newField = {
            type: field.typeMeta.pretty,
            args: {},
        } as ObjectTypeComposerFieldConfigAsObjectDefinition<any, any>;

        if (field.otherDirectives.length) {
            newField.extensions = {
                directives: field.otherDirectives.map((directive) => ({
                    args: (directive.arguments || [])?.reduce(
                        (r: DirectiveArgs, d) => ({ ...r, [d.name.value]: parseValueNode(d.value) }),
                        {}
                    ) as DirectiveArgs,
                    name: directive.name.value,
                })),
            };
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

    const queryOptions = composer.createInputTC({
        name: "QueryOptions",
        fields: {
            skip: "Int",
            limit: "Int",
        },
    });

    const customResolvers = (document.definitions || []).reduce((res: CustomResolvers, definition) => {
        if (definition.kind !== "ObjectTypeDefinition") {
            return res;
        }

        if (!["Query", "Mutation", "Subscription"].includes(definition.name.value)) {
            return res;
        }

        const cypherOnes = (definition.fields || []).filter(
            (field) => field.directives && field.directives.find((direc) => direc.name.value === "cypher")
        );
        const normalOnes = (definition.fields || []).filter(
            (field) =>
                (field.directives && !field.directives.find((direc) => direc.name.value === "cypher")) ||
                !field.directives
        );

        if (definition.name.value === "Query") {
            if (cypherOnes.length) {
                res.customCypherQuery = {
                    ...definition,
                    fields: cypherOnes,
                };
            }

            if (normalOnes.length) {
                res.customQuery = {
                    ...definition,
                    fields: normalOnes,
                };
            }
        }

        if (definition.name.value === "Mutation") {
            if (cypherOnes.length) {
                res.customCypherMutation = {
                    ...definition,
                    fields: cypherOnes,
                };
            }

            if (normalOnes.length) {
                res.customMutation = {
                    ...definition,
                    fields: normalOnes,
                };
            }
        }

        if (definition.name.value === "Subscription") {
            if (normalOnes.length) {
                res.customSubscription = {
                    ...definition,
                    fields: normalOnes,
                };
            }
        }

        return res;
    }, {}) as CustomResolvers;

    const scalars = document.definitions.filter((x) => x.kind === "ScalarTypeDefinition") as ScalarTypeDefinitionNode[];

    const objectNodes = document.definitions.filter(
        (x) => x.kind === "ObjectTypeDefinition" && !["Query", "Mutation", "Subscription"].includes(x.name.value)
    ) as ObjectTypeDefinitionNode[];

    const enums = document.definitions.filter((x) => x.kind === "EnumTypeDefinition") as EnumTypeDefinitionNode[];

    const inputs = document.definitions.filter(
        (x) => x.kind === "InputObjectTypeDefinition"
    ) as InputObjectTypeDefinitionNode[];

    const interfaces = document.definitions.filter(
        (x) => x.kind === "InterfaceTypeDefinition"
    ) as InterfaceTypeDefinitionNode[];

    const directives = document.definitions.filter(
        (x) => x.kind === "DirectiveDefinition"
    ) as DirectiveDefinitionNode[];

    const unions = document.definitions.filter((x) => x.kind === "UnionTypeDefinition") as UnionTypeDefinitionNode[];

    const nodes = objectNodes.map((definition) => {
        checkNodeImplementsInterfaces(definition, interfaces);

        const otherDirectives = (definition.directives || []).filter((x) => x.name.value !== "auth") as DirectiveNode[];
        const authDirective = (definition.directives || []).find((x) => x.name.value === "auth");
        const nodeInterfaces = [...(definition.interfaces || [])] as NamedTypeNode[];

        let auth: Auth;
        if (authDirective) {
            auth = getAuth(authDirective);
        }

        const nodeFields = getObjFieldMeta({
            obj: definition,
            enums,
            interfaces,
            scalars,
            unions,
            objects: objectNodes,
        });

        const node = new Node({
            name: definition.name.value,
            interfaces: nodeInterfaces,
            otherDirectives,
            ...nodeFields,
            // @ts-ignore
            auth,
            getGraphQLSchema: () => neoSchemaInput.schema,
        });

        return node;
    });

    const nodeNames = nodes.map((x) => x.name);
    neoSchemaInput.nodes = nodes;

    neoSchemaInput.nodes.forEach((node) => {
        const nodeFields = objectFieldsToComposeFields([
            ...node.primitiveFields,
            ...node.cypherFields,
            ...node.enumFields,
            ...node.scalarFields,
            ...node.interfaceFields,
            ...node.objectFields,
            ...node.unionFields,
        ]);

        const composeNode = composer.createObjectTC({
            name: node.name,
            fields: nodeFields,
            extensions: {
                directives: node.otherDirectives.map((directive) => ({
                    args: (directive.arguments || [])?.reduce(
                        (r: DirectiveArgs, d) => ({ ...r, [d.name.value]: parseValueNode(d.value) }),
                        {}
                    ) as DirectiveArgs,
                    name: directive.name.value,
                })),
            },
            interfaces: node.interfaces.map((x) => x.name.value),
        });

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
                if (["ID", "String"].includes(f.typeMeta.name) || enums.find((x) => x.name.value === f.typeMeta.name)) {
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

        const [nodeInput, nodeUpdateInput] = ["CreateInput", "UpdateInput"].map((type) =>
            composer.createInputTC({
                name: `${node.name}${type}`,
                fields: [...node.primitiveFields, ...node.scalarFields, ...node.enumFields].reduce(
                    (res, f) => ({
                        ...res,
                        [f.fieldName]: f.typeMeta.array ? `[${f.typeMeta.name}]` : f.typeMeta.name,
                    }),
                    {}
                ),
            })
        );

        let nodeConnectInput: InputTypeComposer<any> = (undefined as unknown) as InputTypeComposer<any>;
        let nodeDisconnectInput: InputTypeComposer<any> = (undefined as unknown) as InputTypeComposer<any>;
        let nodeRelationInput: InputTypeComposer<any> = (undefined as unknown) as InputTypeComposer<any>;
        if (node.relationFields.length) {
            [nodeConnectInput, nodeDisconnectInput, nodeRelationInput] = [
                "ConnectInput",
                "DisconnectInput",
                "RelationInput",
            ].map((type) =>
                composer.createInputTC({
                    name: `${node.name}${type}`,
                    fields: {},
                })
            );
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
            if (rel.union) {
                const refNodes = neoSchemaInput.nodes.filter((x) => rel.union?.nodes?.includes(x.name)) as Node[];

                composeNode.addFields({
                    [rel.fieldName]: {
                        type: rel.typeMeta.pretty,
                        args: {
                            options: queryOptions.getTypeName(),
                        },
                    },
                });

                refNodes.forEach((n) => {
                    const concatFieldName = `${rel.fieldName}_${n.name}`;
                    const createField = rel.typeMeta.array ? `[${n.name}CreateInput]` : `${n.name}CreateInput`;
                    const updateField = `${n.name}UpdateInput`;
                    const nodeFieldInputName = `${node.name}${upperFirstLetter(rel.fieldName)}${n.name}FieldInput`;
                    const nodeFieldUpdateInputName = `${node.name}${upperFirstLetter(rel.fieldName)}${
                        n.name
                    }UpdateFieldInput`;

                    const connectField = rel.typeMeta.array
                        ? `[${n.name}ConnectFieldInput]`
                        : `${n.name}ConnectFieldInput`;
                    const disconnectField = rel.typeMeta.array
                        ? `[${n.name}DisconnectFieldInput]`
                        : `${n.name}DisconnectFieldInput`;

                    composeNode.addFieldArgs(rel.fieldName, {
                        [n.name]: `${n.name}Where`,
                    });

                    composer.createInputTC({
                        name: nodeFieldUpdateInputName,
                        fields: {
                            where: `${n.name}Where`,
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
                        [concatFieldName]: createField,
                    });

                    nodeInput.addFields({
                        [concatFieldName]: nodeFieldInputName,
                    });

                    nodeUpdateInput.addFields({
                        [concatFieldName]: rel.typeMeta.array
                            ? `[${nodeFieldUpdateInputName}]`
                            : nodeFieldUpdateInputName,
                    });

                    nodeConnectInput.addFields({
                        [concatFieldName]: connectField,
                    });

                    nodeDisconnectInput.addFields({
                        [concatFieldName]: disconnectField,
                    });
                });

                return;
            }

            const n = neoSchemaInput.nodes.find((x) => x.name === rel.typeMeta.name) as Node;
            const createField = rel.typeMeta.array ? `[${n.name}CreateInput]` : `${n.name}CreateInput`;
            const updateField = `${n.name}UpdateInput`;
            const nodeFieldInputName = `${node.name}${upperFirstLetter(rel.fieldName)}FieldInput`;
            const nodeFieldUpdateInputName = `${node.name}${upperFirstLetter(rel.fieldName)}UpdateFieldInput`;
            const connectField = rel.typeMeta.array ? `[${n.name}ConnectFieldInput]` : `${n.name}ConnectFieldInput`;
            const disconnectField = rel.typeMeta.array
                ? `[${n.name}DisconnectFieldInput]`
                : `${n.name}DisconnectFieldInput`;

            [whereInput, andInput, orInput].forEach((inputType) => {
                inputType.addFields({
                    [rel.fieldName]: `${n.name}Where`,
                    [`${rel.fieldName}_NOT`]: `${n.name}Where`,
                    [`${rel.fieldName}_IN`]: `[${n.name}Where]`,
                    [`${rel.fieldName}_NOT_IN`]: `[${n.name}Where]`,
                });
            });

            composeNode.addFields({
                [rel.fieldName]: {
                    type: rel.typeMeta.pretty,
                    args: {
                        where: `${rel.typeMeta.name}Where`,
                        options: `${rel.typeMeta.name}Options`,
                    },
                },
            });

            composer.createInputTC({
                name: nodeFieldUpdateInputName,
                fields: {
                    where: `${n.name}Where`,
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

    ["Mutation", "Query"].forEach((type) => {
        const objectComposer = composer[type] as ObjectTypeComposer;
        const cypherType = customResolvers[`customCypher${type}`] as
            | CustomResolvers["customCypherQuery"]
            | CustomResolvers["customCypherMutation"];

        if (cypherType) {
            const objectFields = getObjFieldMeta({
                obj: cypherType,
                scalars,
                enums,
                interfaces,
                unions,
                objects: objectNodes,
            });

            const objectComposeFields = objectFieldsToComposeFields([
                ...objectFields.enumFields,
                ...objectFields.interfaceFields,
                ...objectFields.primitiveFields,
                ...objectFields.relationFields,
                ...objectFields.scalarFields,
                ...objectFields.unionFields,
                ...objectFields.objectFields,
            ]);

            objectComposer.addFields(objectComposeFields);

            objectFields.cypherFields.forEach((field) => {
                const customResolver = cypherResolver({
                    defaultAccessMode: type === "Query" ? "READ" : "WRITE",
                    field,
                    statement: field.statement,
                    getSchema: () => neoSchema,
                });

                const composedField = objectFieldsToComposeFields([field])[field.fieldName];

                objectComposer.addFields({ [field.fieldName]: { ...composedField, ...customResolver } });
            });
        }
    });

    const extraDefinitions = [
        ...enums,
        ...scalars,
        ...directives,
        ...inputs,
        ...unions,
        ...([
            customResolvers.customQuery,
            customResolvers.customMutation,
            customResolvers.customSubscription,
        ] as ObjectTypeDefinitionNode[]),
    ].filter(Boolean) as DefinitionNode[];
    if (extraDefinitions.length) {
        composer.addTypeDefs(print({ kind: "Document", definitions: extraDefinitions }));
    }

    interfaces.forEach((inter) => {
        const objectFields = getObjFieldMeta({ obj: inter, scalars, enums, interfaces, unions, objects: objectNodes });

        const objectComposeFields = objectFieldsToComposeFields(
            Object.values(objectFields).reduce((acc, x) => [...acc, ...x], [])
        );

        composer.createInterfaceTC({
            name: inter.name.value,
            fields: objectComposeFields,
            extensions: {
                directives: (inter.directives || [])
                    .filter((x) => x.name.value !== "auth")
                    .map((directive) => ({
                        args: (directive.arguments || [])?.reduce(
                            (r: DirectiveArgs, d) => ({ ...r, [d.name.value]: parseValueNode(d.value) }),
                            {}
                        ) as DirectiveArgs,
                        name: directive.name.value,
                    })),
            },
        });
    });

    const generatedTypeDefs = composer.toSDL();
    let generatedResolvers = composer.getResolveMethods();
    unions.forEach((union) => {
        generatedResolvers[union.name.value] = { __resolveType: (root) => root.__resolveType };
    });
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

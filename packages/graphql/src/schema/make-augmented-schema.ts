import camelCase from "camelcase";
import {
    DefinitionNode,
    DirectiveDefinitionNode,
    EnumTypeDefinitionNode,
    GraphQLSchema,
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
    InputTypeComposer,
    ObjectTypeComposer,
    InputTypeComposerFieldConfigAsObjectDefinition,
} from "graphql-compose";
import { makeExecutableSchema } from "@graphql-tools/schema";
import pluralize from "pluralize";
import { Node, Exclude, Neo4jGraphQL } from "../classes";
import getAuth from "./get-auth";
import { PrimitiveField, Resolvers, Auth } from "../types";
import { upperFirstLetter } from "../utils";
import { findResolver, createResolver, deleteResolver, cypherResolver, updateResolver } from "./resolvers";
import mergeTypeDefs from "./merge-type-defs";
import checkNodeImplementsInterfaces from "./check-node-implements-interfaces";
import { Float, Int, DateTime, ID } from "./scalars";
import parseExcludeDirective from "./parse-exclude-directive";
import wrapCustomResolvers from "./wrap-custom-resolvers";
import getCustomResolvers from "./get-custom-resolvers";
import getObjFieldMeta from "./get-obj-field-meta";
import * as point from "./point";
import { graphqlDirectivesToCompose, objectFieldsToComposeFields } from "./to-compose";
import {
    cypherDirective,
    ignoreDirective,
    privateDirective,
    readonlyDirective,
    writeonlyDirective,
} from "./directives";

function makeAugmentedSchema(
    neoSchema: Neo4jGraphQL
): { typeDefs: string; resolvers: Resolvers; schema: GraphQLSchema; nodes: Node[] } {
    const document = mergeTypeDefs(neoSchema.input.typeDefs);
    const composer = new SchemaComposer();

    composer.addDirective(cypherDirective);
    composer.addDirective(ignoreDirective);
    composer.addDirective(privateDirective);
    composer.addDirective(readonlyDirective);
    composer.addDirective(writeonlyDirective);

    // graphql-compose will break if the Point and CartesianPoint types are created but not used,
    // because it will purge the unused types but leave behind orphaned field resolvers
    //
    // These are flags to check whether the types are used and then create them if they are
    let pointInTypeDefs = false;
    let cartesianPointInTypeDefs = false;

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

    const customResolvers = getCustomResolvers(document);

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

        const otherDirectives = (definition.directives || []).filter(
            (x) => !["auth", "exclude"].includes(x.name.value)
        );
        const authDirective = (definition.directives || []).find((x) => x.name.value === "auth");
        const excludeDirective = (definition.directives || []).find((x) => x.name.value === "exclude");
        const nodeInterfaces = [...(definition.interfaces || [])] as NamedTypeNode[];

        let auth: Auth;
        if (authDirective) {
            auth = getAuth(authDirective);
        }

        let exclude: Exclude;
        if (excludeDirective) {
            exclude = parseExcludeDirective(excludeDirective, definition.name.value);
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
            // @ts-ignore
            exclude,
            description: definition.description?.value,
        });

        return node;
    });

    const nodeNames = nodes.map((x) => x.name);

    nodes.forEach((node) => {
        const nodeFields = objectFieldsToComposeFields([
            ...node.primitiveFields,
            ...node.cypherFields,
            ...node.enumFields,
            ...node.scalarFields,
            ...node.interfaceFields,
            ...node.objectFields,
            ...node.unionFields,
            ...node.dateTimeFields,
            ...node.pointFields,
            ...node.ignoredFields,
        ]);

        const composeNode = composer.createObjectTC({
            name: node.name,
            fields: nodeFields,
            description: node.description,
            extensions: {
                directives: graphqlDirectivesToCompose(node.otherDirectives),
            },
            interfaces: node.interfaces.map((x) => x.name.value),
        });

        const sortValues = [
            ...node.primitiveFields,
            ...node.enumFields,
            ...node.scalarFields,
            ...node.dateTimeFields,
            ...node.pointFields,
        ].reduce((res, f) => {
            return f.typeMeta.array
                ? {
                      ...res,
                  }
                : {
                      ...res,
                      [`${f.fieldName}_DESC`]: { value: `${f.fieldName}_DESC` },
                      [`${f.fieldName}_ASC`]: { value: `${f.fieldName}_ASC` },
                  };
        }, {});

        if (Object.keys(sortValues).length) {
            const sortEnum = composer.createEnumTC({
                name: `${node.name}Sort`,
                values: sortValues,
            });

            composer.createInputTC({
                name: `${node.name}Options`,
                fields: { sort: sortEnum.List, limit: "Int", skip: "Int" },
            });
        } else {
            composer.createInputTC({
                name: `${node.name}Options`,
                fields: { limit: "Int", skip: "Int" },
            });
        }

        const queryFields = {
            OR: `[${node.name}Where!]`,
            AND: `[${node.name}Where!]`,
            // Custom scalar fields only support basic equality
            ...node.scalarFields.reduce((res, f) => {
                res[f.fieldName] = f.typeMeta.array ? `[${f.typeMeta.name}]` : f.typeMeta.name;
                return res;
            }, {}),
            ...[...node.primitiveFields, ...node.dateTimeFields, ...node.enumFields, ...node.pointFields].reduce(
                (res, f) => {
                    // This is the only sensible place to flag whether Point and CartesianPoint are used
                    if (f.typeMeta.name === "Point") {
                        pointInTypeDefs = true;
                    } else if (f.typeMeta.name === "CartesianPoint") {
                        cartesianPointInTypeDefs = true;
                    }

                    res[f.fieldName] = f.typeMeta.input.pretty;
                    res[`${f.fieldName}_NOT`] = f.typeMeta.input.pretty;

                    if (f.typeMeta.name !== "Boolean") {
                        res[`${f.fieldName}_IN`] = f.typeMeta.array
                            ? f.typeMeta.input.name
                            : `[${f.typeMeta.input.name}]`;

                        res[`${f.fieldName}_NOT_IN`] = f.typeMeta.array
                            ? f.typeMeta.input.name
                            : `[${f.typeMeta.input.name}]`;
                    }

                    if (!f.typeMeta.array) {
                        if (["Float", "Int", "DateTime"].includes(f.typeMeta.name)) {
                            ["_LT", "_LTE", "_GT", "_GTE"].forEach((comparator) => {
                                res[`${f.fieldName}${comparator}`] = f.typeMeta.name;
                            });
                        }

                        if (["Point", "CartesianPoint"].includes(f.typeMeta.name)) {
                            ["_DISTANCE", "_LT", "_LTE", "_GT", "_GTE"].forEach((comparator) => {
                                res[`${f.fieldName}${comparator}`] = `${f.typeMeta.name}Distance`;
                            });
                        }

                        if (["String", "ID"].includes(f.typeMeta.name)) {
                            res[`${f.fieldName}_MATCHES`] = "String";

                            [
                                "_CONTAINS",
                                "_NOT_CONTAINS",
                                "_STARTS_WITH",
                                "_NOT_STARTS_WITH",
                                "_ENDS_WITH",
                                "_NOT_ENDS_WITH",
                            ].forEach((comparator) => {
                                res[`${f.fieldName}${comparator}`] = f.typeMeta.name;
                            });
                        }
                    }

                    return res;
                },
                {}
            ),
        };

        const whereInput = composer.createInputTC({
            name: `${node.name}Where`,
            fields: queryFields,
        });

        const nodeInput = composer.createInputTC({
            name: `${node.name}CreateInput`,
            fields: [
                ...node.primitiveFields,
                ...node.scalarFields,
                ...node.enumFields,
                ...node.dateTimeFields.filter((x) => !x.timestamps),
                ...node.pointFields,
            ].reduce((res, f) => {
                if (f.readonly) {
                    return res;
                }

                if ((f as PrimitiveField)?.autogenerate) {
                    const field: InputTypeComposerFieldConfigAsObjectDefinition = {
                        type: f.typeMeta.name,
                        defaultValue: "autogenerate",
                    };
                    res[f.fieldName] = field;
                } else {
                    res[f.fieldName] = f.typeMeta.input.pretty;
                }

                return res;
            }, {}),
        });

        const nodeUpdateInput = composer.createInputTC({
            name: `${node.name}UpdateInput`,
            fields: [
                ...node.primitiveFields,
                ...node.scalarFields,
                ...node.enumFields,
                ...node.dateTimeFields.filter((x) => !x.timestamps),
                ...node.pointFields,
            ].reduce(
                (res, f) =>
                    f.readonly
                        ? res
                        : {
                              ...res,
                              [f.fieldName]: f.typeMeta.input.pretty,
                          },
                {}
            ),
        });

        const nodeDeleteInput = composer.createInputTC({
            name: `${node.name}DeleteInput`,
            fields: {},
        });

        ["Create", "Update"].map((operation) =>
            composer.createObjectTC({
                name: `${operation}${pluralize(node.name)}MutationResponse`,
                fields: {
                    [pluralize(camelCase(node.name))]: `[${node.name}!]!`,
                },
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

        composer.createInputTC({
            name: `${node.name}DeleteFieldInput`,
            fields: {
                where: `${node.name}Where`,
                ...(node.relationFields.length ? { delete: nodeDeleteInput } : {}),
            },
        });

        node.relationFields.forEach((rel) => {
            if (rel.union) {
                const refNodes = nodes.filter((x) => rel.union?.nodes?.includes(x.name));

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
                    const createField = rel.typeMeta.array ? `[${n.name}CreateInput!]` : `${n.name}CreateInput`;
                    const updateField = `${n.name}UpdateInput`;
                    const nodeFieldInputName = `${node.name}${upperFirstLetter(rel.fieldName)}${n.name}FieldInput`;
                    const nodeFieldUpdateInputName = `${node.name}${upperFirstLetter(rel.fieldName)}${
                        n.name
                    }UpdateFieldInput`;
                    const nodeFieldDeleteInputName = `${node.name}${upperFirstLetter(rel.fieldName)}${
                        n.name
                    }DeleteInput`;

                    const connectField = rel.typeMeta.array
                        ? `[${n.name}ConnectFieldInput!]`
                        : `${n.name}ConnectFieldInput`;
                    const disconnectField = rel.typeMeta.array
                        ? `[${n.name}DisconnectFieldInput!]`
                        : `${n.name}DisconnectFieldInput`;
                    const deleteField = rel.typeMeta.array
                        ? `[${n.name}DeleteFieldInput!]`
                        : `${n.name}DeleteFieldInput`;

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
                            delete: deleteField,
                        },
                    });

                    composer.createInputTC({
                        name: nodeFieldInputName,
                        fields: {
                            create: createField,
                            connect: connectField,
                        },
                    });

                    composer.createInputTC({
                        name: nodeFieldDeleteInputName,
                        fields: {
                            where: `${n.name}Where`,
                            ...(n.relationFields.length
                                ? {
                                      delete: `${n.name}DeleteInput`,
                                  }
                                : {}),
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
                            ? `[${nodeFieldUpdateInputName}!]`
                            : nodeFieldUpdateInputName,
                    });

                    nodeDeleteInput.addFields({
                        [concatFieldName]: rel.typeMeta.array
                            ? `[${nodeFieldDeleteInputName}!]`
                            : nodeFieldDeleteInputName,
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

            const n = nodes.find((x) => x.name === rel.typeMeta.name) as Node;
            const createField = rel.typeMeta.array ? `[${n.name}CreateInput!]` : `${n.name}CreateInput`;
            const updateField = `${n.name}UpdateInput`;
            const nodeFieldInputName = `${node.name}${upperFirstLetter(rel.fieldName)}FieldInput`;
            const nodeFieldUpdateInputName = `${node.name}${upperFirstLetter(rel.fieldName)}UpdateFieldInput`;
            const nodeFieldDeleteInputName = `${node.name}${upperFirstLetter(rel.fieldName)}DeleteInput`;
            const connectField = rel.typeMeta.array ? `[${n.name}ConnectFieldInput!]` : `${n.name}ConnectFieldInput`;
            const disconnectField = rel.typeMeta.array
                ? `[${n.name}DisconnectFieldInput!]`
                : `${n.name}DisconnectFieldInput`;
            const deleteField = rel.typeMeta.array ? `[${n.name}DeleteFieldInput!]` : `${n.name}DeleteFieldInput`;

            whereInput.addFields({
                [rel.fieldName]: `${n.name}Where`,
                [`${rel.fieldName}_NOT`]: `${n.name}Where`,
                [`${rel.fieldName}_IN`]: `[${n.name}Where!]`,
                [`${rel.fieldName}_NOT_IN`]: `[${n.name}Where!]`,
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
                    delete: deleteField,
                },
            });

            composer.createInputTC({
                name: nodeFieldInputName,
                fields: {
                    create: createField,
                    connect: connectField,
                },
            });

            composer.createInputTC({
                name: nodeFieldDeleteInputName,
                fields: {
                    where: `${n.name}Where`,
                    ...(n.relationFields.length
                        ? {
                              delete: `${n.name}DeleteInput`,
                          }
                        : {}),
                },
            });

            nodeRelationInput.addFields({
                [rel.fieldName]: createField,
            });

            nodeInput.addFields({
                [rel.fieldName]: nodeFieldInputName,
            });

            nodeUpdateInput.addFields({
                [rel.fieldName]: rel.typeMeta.array ? `[${nodeFieldUpdateInputName}!]` : nodeFieldUpdateInputName,
            });

            nodeDeleteInput.addFields({
                [rel.fieldName]: rel.typeMeta.array ? `[${nodeFieldDeleteInputName}!]` : nodeFieldDeleteInputName,
            });

            nodeConnectInput.addFields({
                [rel.fieldName]: connectField,
            });

            nodeDisconnectInput.addFields({
                [rel.fieldName]: disconnectField,
            });
        });

        if (!node.exclude?.operations.includes("read")) {
            composer.Query.addFields({
                [pluralize(camelCase(node.name))]: findResolver({ node, neoSchema }),
            });
        }

        if (!node.exclude?.operations.includes("create")) {
            composer.Mutation.addFields({
                [`create${pluralize(node.name)}`]: createResolver({ node, neoSchema }),
            });
        }

        if (!node.exclude?.operations.includes("delete")) {
            composer.Mutation.addFields({
                [`delete${pluralize(node.name)}`]: deleteResolver({ node, neoSchema }),
            });
        }

        if (!node.exclude?.operations.includes("update")) {
            composer.Mutation.addFields({
                [`update${pluralize(node.name)}`]: updateResolver({ node, neoSchema }),
            });
        }
    });

    ["Mutation", "Query"].forEach((type) => {
        const objectComposer = composer[type] as ObjectTypeComposer;
        const cypherType = customResolvers[`customCypher${type}`] as ObjectTypeDefinitionNode;

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
                ...objectFields.dateTimeFields,
            ]);

            objectComposer.addFields(objectComposeFields);

            objectFields.cypherFields.forEach((field) => {
                const customResolver = cypherResolver({
                    field,
                    statement: field.statement,
                    neoSchema,
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
                directives: graphqlDirectivesToCompose((inter.directives || []).filter((x) => x.name.value !== "auth")),
            },
        });
    });

    composer.addTypeDefs("scalar Int");
    composer.addTypeDefs("scalar Float");
    composer.addTypeDefs("scalar ID");
    composer.addTypeDefs("scalar DateTime");

    if (pointInTypeDefs) {
        // Every field (apart from CRS) in Point needs a custom resolver
        // to deconstruct the point objects we fetch from the database
        composer.createObjectTC(point.point);
        composer.createInputTC(point.pointInput);
        composer.createInputTC(point.pointDistance);
    }

    if (cartesianPointInTypeDefs) {
        // Every field (apart from CRS) in CartesianPoint needs a custom resolver
        // to deconstruct the point objects we fetch from the database
        composer.createObjectTC(point.cartesianPoint);
        composer.createInputTC(point.cartesianPointInput);
        composer.createInputTC(point.cartesianPointDistance);
    }

    const generatedTypeDefs = composer.toSDL();
    let generatedResolvers: any = {
        ...composer.getResolveMethods(),
        ...(generatedTypeDefs.includes("scalar Int") ? { Int } : {}),
        ...(generatedTypeDefs.includes("scalar Float") ? { Float } : {}),
        ...(generatedTypeDefs.includes("scalar ID") ? { ID } : {}),
        ...(generatedTypeDefs.includes("scalar DateTime") ? { DateTime } : {}),
    };

    if (neoSchema.input.resolvers) {
        generatedResolvers = wrapCustomResolvers({
            generatedResolvers,
            neoSchema,
            nodeNames,
            resolvers: neoSchema.input.resolvers,
        });
    }

    unions.forEach((union) => {
        // eslint-disable-next-line no-underscore-dangle
        generatedResolvers[union.name.value] = { __resolveType: (root) => root.__resolveType };
    });

    const schema = makeExecutableSchema({
        typeDefs: generatedTypeDefs,
        resolvers: generatedResolvers,
        schemaDirectives: neoSchema.input.schemaDirectives,
    });

    return {
        nodes,
        typeDefs: generatedTypeDefs,
        resolvers: generatedResolvers,
        schema,
    };
}

export default makeAugmentedSchema;

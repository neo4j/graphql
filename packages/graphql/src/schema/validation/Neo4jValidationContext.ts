/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { Maybe } from "@graphql-tools/utils";
import type {
    DefinitionNode,
    DocumentNode,
    EnumTypeDefinitionNode,
    GraphQLError,
    GraphQLSchema,
    InterfaceTypeDefinitionNode,
    InterfaceTypeExtensionNode,
    ObjectTypeDefinitionNode,
    ObjectTypeExtensionNode,
    UnionTypeDefinitionNode,
    UnionTypeExtensionNode,
} from "graphql";
import { Kind } from "graphql";
import { SDLValidationContext } from "graphql/validation/ValidationContext";
import { Neo4jVectorSettings } from "src/types";

export type TypeMapWithExtensions = Record<
    string,
    {
        extensions: (ObjectTypeExtensionNode | InterfaceTypeExtensionNode | UnionTypeExtensionNode)[];
        definition:
            | ObjectTypeDefinitionNode
            | InterfaceTypeDefinitionNode
            | UnionTypeDefinitionNode
            | EnumTypeDefinitionNode;
    }
>;
export class Neo4jValidationContext extends SDLValidationContext {
    public readonly typeMapWithExtensions?: TypeMapWithExtensions;
    public readonly interfacesMap?: Record<string, Array<ObjectTypeDefinitionNode>>;
    public readonly callbacks?: any;
    public readonly vectors?: Neo4jVectorSettings;

    constructor(
        ast: DocumentNode,
        schema: Maybe<GraphQLSchema>,
        onError: (error: GraphQLError) => void,
        callbacks?: any,
        vectors?: Neo4jVectorSettings
    ) {
        super(ast, schema, onError);
        this.callbacks = callbacks;
        this.vectors = vectors;
        this.typeMapWithExtensions = buildTypeMapWithExtensions(ast.definitions);

        this.interfacesMap = buildInterfacesMap(ast.definitions, this.typeMapWithExtensions);
    }
}

// build a type map to access specific types and their extensions
function buildTypeMapWithExtensions(definitions: Readonly<DefinitionNode[]>): TypeMapWithExtensions {
    return definitions.reduce((acc, def) => {
        if (
            def.kind === Kind.OBJECT_TYPE_DEFINITION ||
            def.kind === Kind.INTERFACE_TYPE_DEFINITION ||
            def.kind === Kind.UNION_TYPE_DEFINITION ||
            def.kind === Kind.ENUM_TYPE_DEFINITION ||
            def.kind === Kind.OBJECT_TYPE_EXTENSION ||
            def.kind === Kind.INTERFACE_TYPE_EXTENSION ||
            def.kind === Kind.UNION_TYPE_EXTENSION
        ) {
            const typeName = def.name.value;
            if (!acc[typeName]) {
                // definition is undefined whilst building the TypeMapWithExtensions, but will eventually be populated
                acc[typeName] = { extensions: [], definition: undefined };
            }
            if (
                def.kind === Kind.OBJECT_TYPE_EXTENSION ||
                def.kind === Kind.INTERFACE_TYPE_EXTENSION ||
                def.kind === Kind.UNION_TYPE_EXTENSION
            ) {
                if (acc[typeName].extensions) {
                    acc[typeName].extensions.push(def);
                } else {
                    acc[typeName].extensions = [def];
                }
            } else {
                acc[typeName].definition = def;
            }
        }
        return acc;
    }, {});
}

function buildInterfacesMap(
    definitions: Readonly<DefinitionNode[]>,
    typeMapWithExtensions: TypeMapWithExtensions
): Record<string, Array<ObjectTypeDefinitionNode>> {
    return definitions.reduce((acc, def): Record<string, Array<ObjectTypeDefinitionNode>> => {
        if (def.kind === Kind.OBJECT_TYPE_DEFINITION || def.kind === Kind.OBJECT_TYPE_EXTENSION) {
            const typeName = def.name.value;
            for (const defInterface of def.interfaces ?? []) {
                const interfaceName = defInterface.name.value;
                if (!acc[interfaceName]) {
                    acc[interfaceName] = [];
                }

                const concreteDefinition = typeMapWithExtensions[typeName]?.definition;
                if (concreteDefinition && concreteDefinition.kind === Kind.OBJECT_TYPE_DEFINITION) {
                    acc[interfaceName].push(concreteDefinition);
                }
            }
        }
        return acc;
    }, {});
}

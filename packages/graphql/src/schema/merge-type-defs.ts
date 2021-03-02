import { DefinitionNode, DocumentNode, FieldDefinitionNode, Kind, parse, print } from "graphql";
import { TypeDefs } from "../types";

function getKindInfo(def: DefinitionNode): { isExtension: boolean; typeName: string } {
    switch (def.kind) {
        case Kind.SCHEMA_DEFINITION: {
            return {
                isExtension: false,
                typeName: "schema",
            };
        }

        case Kind.SCALAR_TYPE_DEFINITION: {
            return {
                isExtension: false,
                typeName: `scalar ${def.name.value}`,
            };
        }

        case Kind.OBJECT_TYPE_DEFINITION: {
            return {
                isExtension: false,
                typeName: `type ${def.name.value}`,
            };
        }

        case Kind.INTERFACE_TYPE_DEFINITION: {
            return {
                isExtension: false,
                typeName: `interface ${def.name.value}`,
            };
        }

        case Kind.UNION_TYPE_DEFINITION: {
            return {
                isExtension: false,
                typeName: `union ${def.name.value}`,
            };
        }

        case Kind.ENUM_TYPE_DEFINITION: {
            return {
                isExtension: false,
                typeName: `enum ${def.name.value}`,
            };
        }

        case Kind.INPUT_OBJECT_TYPE_DEFINITION: {
            return {
                isExtension: false,
                typeName: `input ${def.name.value}`,
            };
        }

        case Kind.DIRECTIVE_DEFINITION: {
            return {
                isExtension: false,
                typeName: `directive ${def.name.value}`,
            };
        }

        case Kind.SCHEMA_EXTENSION: {
            return {
                isExtension: true,
                typeName: "schema",
            };
        }

        case Kind.SCALAR_TYPE_EXTENSION: {
            return {
                isExtension: true,
                typeName: `scalar ${def.name.value}`,
            };
        }

        case Kind.OBJECT_TYPE_EXTENSION: {
            return {
                isExtension: true,
                typeName: `type ${def.name.value}`,
            };
        }

        case Kind.INTERFACE_TYPE_EXTENSION: {
            return {
                isExtension: true,
                typeName: `interface ${def.name.value}`,
            };
        }

        case Kind.UNION_TYPE_EXTENSION: {
            return {
                isExtension: true,
                typeName: `union ${def.name.value}`,
            };
        }

        case Kind.ENUM_TYPE_EXTENSION: {
            return {
                isExtension: true,
                typeName: `enum ${def.name.value}`,
            };
        }

        case Kind.INPUT_OBJECT_TYPE_EXTENSION: {
            return {
                isExtension: true,
                typeName: `input ${def.name.value}`,
            };
        }

        default: {
            throw new Error("something went wrong");
        }
    }
}

function mergeFields(fields: FieldDefinitionNode[] = [], extFields: FieldDefinitionNode[] = []): FieldDefinitionNode[] {
    const result = [...fields];

    extFields.forEach((extField) => {
        const existingIndex = result.findIndex((x) => x.name.value === extField.name.value);
        if (existingIndex !== -1) {
            const existing = result[existingIndex];
            result[existingIndex] = {
                ...existing,
                ...extField,
                directives: [
                    ...(existing.directives ? existing.directives : []),
                    ...(extField.directives ? extField.directives : []),
                ],
            };
        } else {
            result.push(extField);
        }
    });

    return result;
}

function extendDefinition(def: DefinitionNode, ext) {
    const extendLocation = (loc, loc2) => ({
        ...loc,
        ext: loc.ext ? [...loc.ext, loc2] : [loc2],
    });

    // @ts-ignore
    const directives = [...(def.directives || []), ...(ext.directives || [])];
    // @ts-ignore
    const fields = mergeFields(def.fields, ext.fields);
    const loc = extendLocation(def.loc, ext.loc);

    switch (def.kind) {
        case Kind.SCHEMA_DEFINITION: {
            return {
                ...def,
                directives,
                operationTypes: [...def.operationTypes, ...ext.operationTypes],
                loc,
            };
        }

        case Kind.SCALAR_TYPE_DEFINITION: {
            return {
                ...def,
                directives,
                loc,
            };
        }

        case Kind.OBJECT_TYPE_DEFINITION: {
            return {
                ...def,
                interfaces: [...(def.interfaces || []), ...(ext.interfaces || [])],
                directives,
                fields,
                loc,
            };
        }

        case Kind.INTERFACE_TYPE_DEFINITION: {
            return {
                ...def,
                directives,
                fields,
                loc,
            };
        }

        case Kind.UNION_TYPE_DEFINITION: {
            return {
                ...def,
                directives,
                types: [...(def.types || []), ...(ext.types || [])],
                loc,
            };
        }

        case Kind.ENUM_TYPE_DEFINITION: {
            return {
                ...def,
                directives,
                values: [...(def.values || []), ...(ext.values || [])],
                loc,
            };
        }

        case Kind.INPUT_OBJECT_TYPE_DEFINITION: {
            return {
                ...def,
                directives,
                fields,
                loc,
            };
        }

        default: {
            return def;
        }
    }
}

function mergeExtensionsIntoAST(document: DocumentNode): DocumentNode {
    const definitions = new Map();
    const extensions = new Map();

    document.definitions.forEach((def) => {
        const { isExtension, typeName } = getKindInfo(def);

        if (isExtension) {
            if (extensions.has(typeName)) {
                extensions.get(typeName).push(def);
            } else {
                extensions.set(typeName, [def]);
            }
        } else {
            definitions.set(typeName, def);
        }
    });

    extensions.forEach((value, key) => {
        const def = definitions.get(key);
        definitions.set(key, value.reduce(extendDefinition, def));
    });

    return {
        ...document,
        definitions: [...definitions.values()],
    };
}

function mergeTypeDefs(typeDefs: TypeDefs) {
    const arrayOfTypeDefs = Array.isArray(typeDefs) ? typeDefs : [typeDefs];

    const merged = {
        kind: "Document",
        definitions: arrayOfTypeDefs.reduce((acc: DefinitionNode[], type) => {
            if (typeof type === "string") {
                return [...acc, ...parse(type).definitions];
            }

            if (typeof type === "function") {
                return [...acc, ...mergeTypeDefs(type()).definitions];
            }

            return [...acc, ...parse(print(type)).definitions];
        }, []),
    };

    return mergeExtensionsIntoAST(merged);
}

export default mergeTypeDefs;

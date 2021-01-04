import { int } from "neo4j-driver";
import {
    InputValueDefinitionNode,
    DocumentNode,
    InputObjectTypeDefinitionNode,
    TypeNode,
    FieldDefinitionNode,
} from "graphql";
import getFieldTypeMeta from "../schema/get-field-type-meta";

export function serializeUnknownValue(unknownValue) {
    function isFloat(n: number) {
        return Number(n) === n && n % 1 !== 0;
    }

    function traverse(v: any) {
        function reducer(res: any, [key, value]: [string, any]) {
            if (Array.isArray(value)) {
                return {
                    ...res,
                    [key]: value.map((x) => traverse(x)),
                };
            }

            return {
                ...res,
                [key]: traverse(value),
            };
        }

        if (Array.isArray(unknownValue)) {
            return unknownValue.map((x) => serializeUnknownValue(x));
        }

        switch (typeof v) {
            case "number":
                if (isFloat(v)) {
                    return v;
                }

                return int(v);

            case "string":
                return v;

            case "boolean":
                return v;

            default:
                return Object.entries(v).reduce(reducer, {});
        }
    }

    return traverse(unknownValue);
}

export function serializeGraphQLValueByType(type: TypeNode, value) {
    if (type?.kind === "NamedType") {
        if (type.name.value === "Float") {
            return value;
        }

        if (type.name.value === "Int") {
            return int(value);
        }
    }

    if (type?.kind === "NonNullType") {
        if (type.type.kind === "NamedType") {
            if (type.type.name.value === "Float") {
                return value;
            }

            if (type.type.name.value === "Int") {
                return int(value);
            }
        }
    }

    if (type?.kind === "ListType" || (type?.kind === "NonNullType" && type?.type?.kind === "ListType")) {
        return value.map((a) => serializeGraphQLValueByType(type.type, a));
    }

    return serializeUnknownValue(value);
}

export function serializeArbitraryGraphQLArguments(
    definitions: InputValueDefinitionNode[],
    document: DocumentNode,
    args: any
) {
    return Object.entries(args).reduce((res, [key, value]: [string, any]) => {
        const definition = definitions.find((x) => x.name.value === key) as InputValueDefinitionNode;

        const typeMeta = getFieldTypeMeta(definition);

        if (definition) {
            const inputDefinition = document.definitions.find(
                (x) => x.kind === "InputObjectTypeDefinition" && x.name.value === typeMeta.name
            ) as InputObjectTypeDefinitionNode;

            if (inputDefinition) {
                if (definition.type.kind === "ListType") {
                    return {
                        ...res,
                        [key]: (value as any[]).map((v) =>
                            serializeArbitraryGraphQLArguments(definitions, document, v)
                        ),
                    };
                }

                return {
                    ...res,
                    [key]: Object.entries(value).reduce(function reducer(result, entry) {
                        const type = (inputDefinition.fields?.find(
                            (x) => x.name.value === entry[0]
                        ) as unknown) as FieldDefinitionNode;

                        return {
                            ...result,
                            [entry[0]]: serializeGraphQLValueByType(type?.type, entry[1]),
                        };
                    }, {}),
                };
            }
        }

        return {
            ...res,
            [key]: serializeGraphQLValueByType(definition?.type, value),
        };
    }, {});
}

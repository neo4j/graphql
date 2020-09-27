/* eslint-disable consistent-return */
/* eslint-disable no-fallthrough */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable default-case */
import { FieldDefinitionNode } from "graphql";

interface Meta {
    name: string;
    array: boolean;
    required: boolean;
    pretty: string;
    prettyBy(str: string): string;
}

function getFieldTypeMeta(field: FieldDefinitionNode): Meta {
    // @ts-ignore
    let result: Meta = {};

    switch (field.type.kind) {
        case "NonNullType":
            switch (field.type.type.kind) {
                case "ListType":
                    result = {
                        // @ts-ignore
                        name: field.type.type.type.name.value,
                        array: true,
                        required: true,
                        // @ts-ignore
                        pretty: `[${field.type.type.type.name.value}]!`,
                        prettyBy: (s) => `[${s}]!`,
                    };
                    break;

                case "NamedType":
                    result = {
                        name: field.type.type.name.value,
                        array: false,
                        required: true,
                        pretty: `${field.type.type.name.value}!`,
                        prettyBy: (s) => `${s}!`,
                    };

                    break;
            }
            break;
        case "NamedType":
            result = {
                name: field.type.name.value,
                array: false,
                required: false,
                pretty: `${field.type.name.value}`,
                prettyBy: (s) => s,
            };
            break;
        case "ListType":
            switch (field.type.type.kind) {
                case "NamedType":
                    result = {
                        // @ts-ignore
                        name: field.type.type.name.value,
                        array: true,
                        required: false,
                        pretty: `[${field.type.type.name.value}]`,
                        prettyBy: (s) => `[${s}]`,
                    };
                    break;

                case "NonNullType":
                    result = {
                        // @ts-ignore
                        name: field.type.type.type.name.value,
                        array: true,
                        required: true,
                        // @ts-ignore
                        pretty: `[${field.type.type.type.name.value}!]`,
                        prettyBy: (s) => `[${s}!]`,
                    };
                    break;
            }
    }

    return result;
}

export default getFieldTypeMeta;

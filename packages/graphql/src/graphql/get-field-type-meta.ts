/* eslint-disable consistent-return */
/* eslint-disable no-fallthrough */
/* eslint-disable default-case */
import { FieldDefinitionNode, InputValueDefinitionNode } from "graphql";
import { TypeMeta } from "../types";

function getFieldTypeMeta(field: FieldDefinitionNode | InputValueDefinitionNode): TypeMeta {
    // @ts-ignore
    let result: TypeMeta = {};

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
                    };
                    break;

                case "NamedType":
                    result = {
                        name: field.type.type.name.value,
                        array: false,
                        required: true,
                        pretty: `${field.type.type.name.value}!`,
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
                    };
                    break;
            }
    }

    return result;
}

export default getFieldTypeMeta;

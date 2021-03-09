import { FieldDefinitionNode, InputValueDefinitionNode, ListTypeNode, TypeNode } from "graphql";
import { TypeMeta } from "../types";

function getName(type: TypeNode): string {
    return type.kind === "NamedType" ? type.name.value : getName(type.type);
}

function getPrettyName(type: TypeNode): string {
    let result: string;

    // eslint-disable-next-line default-case
    switch (type.kind) {
        case "NamedType":
            result = type.name.value;
            break;
        case "NonNullType":
            result = `${getPrettyName(type.type)}!`;
            break;
        case "ListType":
            result = `[${getPrettyName(type.type)}]`;
            break;
    }

    return result;
}

function getFieldTypeMeta(field: FieldDefinitionNode | InputValueDefinitionNode): TypeMeta {
    const name = getName(field.type);
    const pretty = getPrettyName(field.type);
    const array = /\[.+\]/g.test(pretty);
    const required = pretty.includes("!");

    // Things to do with the T inside the Array [T]
    let arrayTypePretty = "";
    let arrayTypeRequiredPretty = false;
    if (array) {
        const listNode = field.type as ListTypeNode;

        arrayTypePretty = getPrettyName(listNode.type);
        arrayTypeRequiredPretty = arrayTypePretty.includes("!");

        const isMatrix = listNode.type.kind === "ListType" && listNode.type.type.kind === "ListType";
        if (isMatrix) {
            throw new Error("Matrix arrays not supported");
        }
    }

    const baseMeta = {
        name,
        array,
        required,
        pretty,
        arrayTypePretty,
    };

    const isPoint = ["Point", "CartesianPoint"].includes(name);
    if (isPoint) {
        const type = name === "Point" ? "PointInput" : "CartesianPointInput";

        let inputPretty = type;
        if (array) {
            inputPretty = `[${type}${arrayTypeRequiredPretty ? "!" : ""}]`;
        }

        return {
            ...baseMeta,
            input: {
                where: { type, pretty: inputPretty },
                create: {
                    type,
                    pretty: `${inputPretty}${required ? "!" : ""}`,
                },
                update: {
                    type,
                    pretty: inputPretty,
                },
            },
        };
    }

    let inputPretty = name;
    if (array) {
        inputPretty = `[${name}${arrayTypeRequiredPretty ? "!" : ""}]`;
    }

    return {
        ...baseMeta,
        input: {
            where: { type: name, pretty: inputPretty },
            create: {
                type: name,
                pretty: `${inputPretty}${required ? "!" : ""}`,
            },
            update: {
                type: name,
                pretty: inputPretty,
            },
        },
    };
}

export default getFieldTypeMeta;

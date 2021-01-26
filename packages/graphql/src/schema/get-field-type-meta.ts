/* eslint-disable default-case */
import { FieldDefinitionNode, InputValueDefinitionNode, TypeNode } from "graphql";
import { TypeMeta } from "../types";

function getName(type: TypeNode): string {
    return type.kind === "NamedType" ? type.name.value : getName(type.type);
}

function getPrettyName(type: TypeNode): string {
    let result: string;

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
    const prettyName = getPrettyName(field.type);
    const array = /\[.+\]/g.test(prettyName);

    return {
        name,
        array,
        required: prettyName.includes("!"),
        pretty: prettyName,
        inputType: `${array ? "[" : ""}${["Point", "CartesianPoint"].includes(name) ? `${name}Input` : name}${
            array ? "]" : ""
        }`,
    };
}

export default getFieldTypeMeta;

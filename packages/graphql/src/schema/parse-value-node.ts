import { ValueNode, ObjectValueNode } from "graphql/language/ast";
import { Kind } from "graphql/language";

function valueOfObjectValueNode(ast: ObjectValueNode) {
    return Object.values(ast.fields).reduce((a, b) => {
        a[b.name.value] = parseValueNode(b.value);

        return a;
    }, {});
}

function parseValueNode(ast: ValueNode): any {
    let result: any;

    switch (ast.kind) {
        case Kind.ENUM:
        case Kind.STRING:
            result = ast.value;
            break;

        case Kind.INT:
        case Kind.FLOAT:
            result = Number(ast.value);
            break;

        case Kind.BOOLEAN:
            result = Boolean(ast.value);
            break;
        case Kind.NULL:
            break;
        case Kind.LIST:
            result = ast.values.map(parseValueNode);
            break;
        case Kind.OBJECT:
            result = valueOfObjectValueNode(ast);
            break;
        default:
            throw new Error(`invalid Kind: ${ast.kind}`);
    }

    return result;
}

export default parseValueNode;

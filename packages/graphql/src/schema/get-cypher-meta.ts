import { FieldDefinitionNode } from "graphql";

type CypherMeta = {
    statement: string;
};

function getCypherMeta(field: FieldDefinitionNode): CypherMeta | undefined {
    const directive = field.directives?.find((x) => x.name.value === "cypher");
    if (!directive) {
        return undefined;
    }

    const stmtArg = directive.arguments?.find((x) => x.name.value === "statement");
    if (!stmtArg) {
        throw new Error("@cypher statement required");
    }
    if (stmtArg.value.kind !== "StringValue") {
        throw new Error("@cypher statement not a string");
    }

    const statement = stmtArg.value.value;

    return {
        statement,
    };
}

export default getCypherMeta;

import { FieldDefinitionNode } from "graphql";

type RelationshipMeta = {
    direction: "IN" | "OUT";
    type: string;
};

function getRelationshipMeta(field: FieldDefinitionNode): RelationshipMeta | undefined {
    const directive = field.directives?.find((x) => x.name.value === "relationship");
    if (!directive) {
        return undefined;
    }

    const directionArg = directive.arguments?.find((x) => x.name.value === "direction");
    if (!directionArg) {
        throw new Error("@relationship direction required");
    }
    if (directionArg.value.kind !== "StringValue") {
        throw new Error("@relationship direction not a string");
    }
    if (!["IN", "OUT"].includes(directionArg.value.value)) {
        throw new Error("@relationship direction invalid");
    }

    const typeArg = directive.arguments?.find((x) => x.name.value === "type");
    if (!typeArg) {
        throw new Error("@relationship type required");
    }
    if (typeArg.value.kind !== "StringValue") {
        throw new Error("@relationship type not a string");
    }

    const direction = directionArg.value.value as "IN" | "OUT";
    const type = typeArg.value.value as string;

    return {
        direction,
        type,
    };
}

export default getRelationshipMeta;

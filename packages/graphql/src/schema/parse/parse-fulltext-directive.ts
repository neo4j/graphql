import { ArgumentNode, DirectiveNode, ObjectTypeDefinitionNode } from "graphql";
import { FullText, FullTextIndex } from "../../types";
import { ObjectFields } from "../get-obj-field-meta";
import parseValueNode from "../parse-value-node";

function parseFulltextDirective({
    directive,
    nodeFields,
    definition,
}: {
    directive: DirectiveNode;
    nodeFields: ObjectFields;
    definition: ObjectTypeDefinitionNode;
}): FullText {
    const indexesArg = directive.arguments?.find((arg) => arg.name.value === "indexes") as ArgumentNode;
    const value = parseValueNode(indexesArg.value) as FullTextIndex[];
    const stringFields = nodeFields.primitiveFields.filter((f) => f.typeMeta.name === "String" && !f.typeMeta.array);

    value.forEach((index) => {
        const names = value.filter((i) => index.name === i.name);
        if (names.length > 1) {
            throw new Error(`Node '${definition.name.value}' @fulltext index contains duplicate name '${index.name}'`);
        }

        index.fields.forEach((field) => {
            const foundField = stringFields.find((f) => f.fieldName === field);
            if (!foundField) {
                throw new Error(
                    `Node '${definition.name.value}' @fulltext index contains invalid index '${index.name}' cannot use find String field '${field}'`
                );
            }
        });
    });

    return { indexes: value };
}

export default parseFulltextDirective;

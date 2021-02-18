import { ObjectTypeComposerFieldConfigAsObjectDefinition } from "graphql-compose";
import { BaseField } from "../types";
import graphqlArgsToCompose from "./graphql-arg-to-compose";
import graphqlDirectivesToCompose from "./graphql-directives-to-compose";

function objectFieldsToComposeFields(
    fields: BaseField[]
): { [k: string]: ObjectTypeComposerFieldConfigAsObjectDefinition<any, any> } {
    return fields.reduce((res, field) => {
        const newField = {
            type: field.typeMeta.pretty,
            args: {},
            description: field.description,
        } as ObjectTypeComposerFieldConfigAsObjectDefinition<any, any>;

        if (field.otherDirectives.length) {
            newField.extensions = {
                directives: graphqlDirectivesToCompose(field.otherDirectives),
            };
        }

        if (field.arguments) {
            newField.args = graphqlArgsToCompose(field.arguments);
        }

        return { ...res, [field.fieldName]: newField };
    }, {});
}

export default objectFieldsToComposeFields;

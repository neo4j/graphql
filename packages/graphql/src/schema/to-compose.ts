import { InputValueDefinitionNode, DirectiveNode } from "graphql";
import { ExtensionsDirective, DirectiveArgs, ObjectTypeComposerFieldConfigAsObjectDefinition } from "graphql-compose";
import getFieldTypeMeta from "./get-field-type-meta";
import parseValueNode from "./parse-value-node";
import { BaseField } from "../types";

export function graphqlArgsToCompose(args: InputValueDefinitionNode[]) {
    return args.reduce((res, arg) => {
        const meta = getFieldTypeMeta(arg);

        return {
            ...res,
            [arg.name.value]: {
                type: meta.pretty,
                description: arg.description,
                ...(arg.defaultValue ? { defaultValue: parseValueNode(arg.defaultValue) } : {}),
            },
        };
    }, {});
}

export function graphqlDirectivesToCompose(directives: DirectiveNode[]): ExtensionsDirective[] {
    return directives.map((directive) => ({
        args: (directive.arguments || [])?.reduce(
            (r: DirectiveArgs, d) => ({ ...r, [d.name.value]: parseValueNode(d.value) }),
            {}
        ) as DirectiveArgs,
        name: directive.name.value,
    }));
}

export function objectFieldsToComposeFields(
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

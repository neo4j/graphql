import { DirectiveNode } from "graphql";
import { ExtensionsDirective, DirectiveArgs } from "graphql-compose";
import parseValueNode from "./parse-value-node";

function graphqlDirectivesToCompose(directives: DirectiveNode[]): ExtensionsDirective[] {
    return directives.map((directive) => ({
        args: (directive.arguments || [])?.reduce(
            (r: DirectiveArgs, d) => ({ ...r, [d.name.value]: parseValueNode(d.value) }),
            {}
        ) as DirectiveArgs,
        name: directive.name.value,
    }));
}

export default graphqlDirectivesToCompose;

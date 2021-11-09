import { DirectiveNode } from "graphql";

function checkDirectiveCombinations(directives: readonly DirectiveNode[] = []) {
    const invalidCombinations = {
        // FIELD_DEFINITION
        alias: ["cypher", "ignore", "relationship"],
        auth: ["ignore"],
        coalesce: [],
        cypher: [],
        default: [],
        id: ["cypher", "ignore", "relationship", "timestamp", "unique"],
        ignore: ["alias", "auth", "id", "readonly", "relationship", ""],
        private: [],
        readonly: ["cypher", "ignore"],
        relationship: ["alias", "coalesce", "cypher", "default", "id", "ignore", "readonly", ""],
        timestamp: ["id", "unique"],
        unique: ["cypher", "id", "ignore", "relationship", "timestamp"],
        writeonly: ["cypher", "ignore"],
        // OBJECT
        node: [],
        // INTERFACE
        relationshipProperties: [],
        // OBJECT and INTERFACE
        exclude: [],
    };

    directives.forEach((directive) => {
        // Will skip any custom directives
        if (invalidCombinations[directive.name.value]) {
            directives.forEach((d) => {
                if (invalidCombinations[directive.name.value].includes(d.name.value)) {
                    throw new Error(
                        `Directive @${directive.name.value} cannot be used in combination with @${d.name.value}`
                    );
                }
            });
        }
    });
}

export default checkDirectiveCombinations;

import { DocumentNode, ObjectTypeDefinitionNode } from "graphql";

interface CustomResolvers {
    customQuery?: ObjectTypeDefinitionNode;
    customCypherQuery?: ObjectTypeDefinitionNode;
    customMutation?: ObjectTypeDefinitionNode;
    customCypherMutation?: ObjectTypeDefinitionNode;
    customSubscription?: ObjectTypeDefinitionNode;
}

function getCustomResolvers(document: DocumentNode): CustomResolvers {
    const customResolvers = (document.definitions || []).reduce((res: CustomResolvers, definition) => {
        if (definition.kind !== "ObjectTypeDefinition") {
            return res;
        }

        if (!["Query", "Mutation", "Subscription"].includes(definition.name.value)) {
            return res;
        }

        const cypherOnes = (definition.fields || []).filter(
            (field) => field.directives && field.directives.find((direc) => direc.name.value === "cypher")
        );
        const normalOnes = (definition.fields || []).filter(
            (field) =>
                (field.directives && !field.directives.find((direc) => direc.name.value === "cypher")) ||
                !field.directives
        );

        if (definition.name.value === "Query") {
            if (cypherOnes.length) {
                res.customCypherQuery = {
                    ...definition,
                    fields: cypherOnes,
                };
            }

            if (normalOnes.length) {
                res.customQuery = {
                    ...definition,
                    fields: normalOnes,
                };
            }
        }

        if (definition.name.value === "Mutation") {
            if (cypherOnes.length) {
                res.customCypherMutation = {
                    ...definition,
                    fields: cypherOnes,
                };
            }

            if (normalOnes.length) {
                res.customMutation = {
                    ...definition,
                    fields: normalOnes,
                };
            }
        }

        if (definition.name.value === "Subscription") {
            if (normalOnes.length) {
                res.customSubscription = {
                    ...definition,
                    fields: normalOnes,
                };
            }
        }

        return res;
    }, {}) as CustomResolvers;

    return customResolvers;
}

export default getCustomResolvers;

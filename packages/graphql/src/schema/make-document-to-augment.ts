/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { DefinitionNode, DocumentNode, ObjectTypeDefinitionNode } from "graphql";
import { Kind } from "graphql";
import getFieldTypeMeta from "./get-field-type-meta";

type DocumentToAugment = {
    document: DocumentNode;
    typesExcludedFromGeneration: {
        jwt?: { type: ObjectTypeDefinitionNode; jwtFieldsMap: Map<string, string> };
    };
};

type ParsedJwtPayload = {
    type: ObjectTypeDefinitionNode;
    jwtFieldsMap: Map<string, string>;
};

export function makeDocumentToAugment(document: DocumentNode): DocumentToAugment {
    const jwtTypeDefinitions: ObjectTypeDefinitionNode[] = [];
    const definitions: DefinitionNode[] = [];

    for (const definition of document.definitions) {
        if (
            definition.kind === Kind.OBJECT_TYPE_DEFINITION &&
            (definition.directives || []).some((x) => x.name.value === "jwt")
        ) {
            jwtTypeDefinitions.push(definition);
        } else {
            definitions.push(definition);
        }
    }

    const jwt = parseJwtPayload(jwtTypeDefinitions);

    return {
        document: {
            ...document,
            definitions,
        },
        typesExcludedFromGeneration: jwt ? { jwt } : {},
    };
}

function parseJwtPayload(jwtAnnotatedTypes: ObjectTypeDefinitionNode[]): ParsedJwtPayload | undefined {
    const jwtFieldsMap = new Map<string, string>();
    if (jwtAnnotatedTypes.length > 1) {
        throw new Error(`@jwt directive can only be used once in the Type Definitions.`);
    }
    const jwt = jwtAnnotatedTypes[0];
    if (!jwt) {
        return undefined;
    }
    if ((jwt?.directives || []).length > 1) {
        throw new Error(`@jwt directive cannot be combined with other directives.`);
    }
    jwt?.fields?.forEach((f) => {
        const typeMeta = getFieldTypeMeta(f.type);
        if (!["String", "ID", "Int", "Float", "Boolean"].includes(typeMeta.name)) {
            throw new Error("fields of a @jwt type can only be Scalars or Lists of Scalars.");
        }
        const fieldName = f.name.value;
        const jwtClaimDirective = f.directives?.find((x) => x.name.value === "jwtClaim");
        if (!jwtClaimDirective) {
            jwtFieldsMap.set(fieldName, fieldName);
        } else {
            const claimPathArgument = jwtClaimDirective.arguments?.find((a) => a.name.value === "path")?.value;
            if (!claimPathArgument || claimPathArgument.kind !== Kind.STRING) {
                throw new Error(`@jwtClaim path argument required and must be a String.`);
            }
            jwtFieldsMap.set(fieldName, claimPathArgument.value);
        }
    });
    return { type: jwt, jwtFieldsMap };
}

import { InterfaceTypeDefinitionNode, ObjectTypeDefinitionNode } from "graphql";
import equal from "deep-equal";

function stripLoc(obj: any) {
    return JSON.parse(
        JSON.stringify(obj, (key: string, value) => {
            if (key === "loc") {
                return undefined;
            }

            return value;
        })
    );
}

function checkNodeImplementsInterfaces(node: ObjectTypeDefinitionNode, interfaces: InterfaceTypeDefinitionNode[]) {
    if (!node.interfaces?.length) {
        return;
    }

    node.interfaces.forEach((inter) => {
        const error = new Error(`type ${node.name.value} does not implement interface ${inter.name.value} correctly`);

        const interDefinition = interfaces.find((x) => x.name.value === inter.name.value);
        if (!interDefinition) {
            throw error;
        }

        interDefinition.directives?.forEach((interDirec) => {
            const nodeDirec = node.directives?.find((x) => x.name.value === interDirec.name.value);
            if (!nodeDirec) {
                throw error;
            }

            const isEqual = equal(stripLoc(nodeDirec), stripLoc(interDirec));
            if (!isEqual) {
                throw error;
            }
        });

        interDefinition.fields?.forEach((interField) => {
            const nodeField = node.fields?.find((x) => x.name.value === interField.name.value);
            if (!nodeField) {
                throw error;
            }

            const isEqual = equal(stripLoc(nodeField), stripLoc(interField));
            if (!isEqual) {
                throw error;
            }
        });
    });
}

export default checkNodeImplementsInterfaces;

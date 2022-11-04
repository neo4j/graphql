import type { DocumentNode, FieldDefinitionNode, ObjectTypeDefinitionNode } from "graphql";
import { getDefinitionNodes } from "../schema/get-definition-nodes";
import getFieldTypeMeta from "../schema/get-field-type-meta";
import { Attribute } from "./Attribute";
import { ConcreteEntity } from "./entity/ConcreteEntity";

//
export function generateModel(document: DocumentNode): any {
    console.log("GENERATE MODEL");

    const definitionNodes = getDefinitionNodes(document);

    definitionNodes.objectTypes.map(generateConcreteEntity);

    // const { scalarTypes, objectTypes, enumTypes, inputObjectTypes, directives, unionTypes } = definitionNodes;
    // let { interfaceTypes } = definitionNodes;

    // console.log(definitionNodes);
}

function generateConcreteEntity(definition: ObjectTypeDefinitionNode): ConcreteEntity | any {
    // console.log(definition);
    // definition.directives

    // definition.interfaces
    // definition.description?
    const fields = (definition.fields || []).map(generateField);

    return new ConcreteEntity({
        name: definition.name.value,
        attributes: fields,
    });
}

function generateField(field: FieldDefinitionNode): Attribute {
    // getObjFieldMeta

    // if (field.type === "NonNullType") {
    // }

    const typeMeta = getFieldTypeMeta(field.type); // TODO: without originalType
    console.log(field.name.value, typeMeta);
    // console.log("FIELDType", field.name.value, field.type);
    // field.arguments;
    // field.type;
    // field.directive;
    // console.log(field.name, field.type);
    return new Attribute({ name: field.name.value });
}

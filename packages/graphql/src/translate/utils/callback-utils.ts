import { CallbackBucket } from "../../classes/CallbackBucket";
import { PrimitiveField } from "../../types";

export const addCallbackAndSetParam = (
    field: PrimitiveField,
    varName: string,
    parent: any,
    callbackBucket: CallbackBucket,
    strs: string[]
) => {
    if (!field.callback) {
        return;
    }

    const paramName = `${varName}_${field.fieldName}_${field.callback?.name}`;

    callbackBucket.addCallback({
        functionName: field.callback?.name,
        paramName,
        parent,
    });

    strs.push(`SET ${varName}.${field.dbPropertyName} = $callbacks.${paramName}`);
};

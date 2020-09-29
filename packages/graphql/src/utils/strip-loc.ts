/* eslint-disable no-prototype-builtins */
/* eslint-disable no-param-reassign */
/* eslint-disable no-restricted-syntax */
function stripLoc(doc): any {
    const docType = Object.prototype.toString.call(doc);
    if (docType === "[object Array]") {
        return doc.map(stripLoc);
    }
    if (docType !== "[object Object]") {
        throw new Error("Unexpected input.");
    }
    if (doc.loc) {
        delete doc.loc;
    }
    const keys = Object.keys(doc);
    let key;
    let value;
    let valueType;
    for (key in keys) {
        if (keys.hasOwnProperty(key)) {
            value = doc[keys[key]];
            valueType = Object.prototype.toString.call(value);
            if (valueType === "[object Object]" || valueType === "[object Array]") {
                doc[keys[key]] = stripLoc(value);
            }
        }
    }
    return doc;
}

export default stripLoc;

import dotProp from "dot-prop";
import { Context } from "../types";

export default class ContextParser {
    public static parseTag(value: string | undefined, tagName: "context" | "jwt"): string | undefined {
        // TODO: check with 550 tests fail without undefined
        const [, path] = value?.split?.(`$${tagName}.`) || [];
        return path;
    }

    public static getContextProperty(path: string, context: Context): string | undefined {
        return dotProp.get({ value: context }, `value.${path}`);
    }

    public static getJwtPropery(path: string, context: Context): string | undefined {
        return ContextParser.getContextProperty(`jwt.${path}`, context);
    }
}

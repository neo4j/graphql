import dotProp from "dot-prop";
import { Context } from "../types";

export default class ContextParser {
    public static parseTag(value: any, tagName: "context" | "jwt"): string | undefined {
        const [, path] = (value as string)?.split?.(`$${tagName}.`) || [];
        return path;
    }

    public static getContextProperty(path: string, context: Context): string | undefined {
        return dotProp.get({ value: context }, `value.${path}`) as string | undefined;
    }

    public static getJwtPropery(path: string, context: Context): string | undefined {
        return ContextParser.getContextProperty(`jwt.${path}`, context);
    }
}

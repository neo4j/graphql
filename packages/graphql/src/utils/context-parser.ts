import dotProp from "dot-prop";
import { Context } from "../types";

type ContextInterface = Pick<Context, "jwt">;

export default class ContextParser {
    public static parseTag(value: string, tagName: "context" | "jwt"): string | undefined {
        const [, path] = value?.split?.(`$${tagName}.`) || [];
        return path;
    }

    public static getProperty(path: string, context: ContextInterface): string | undefined {
        return dotProp.get({ value: context }, `value.${path}`);
    }

    public static replaceProperties(
        properties: Record<string, any>,
        context: ContextInterface,
        tagName: "context" | "jwt"
    ): Record<string, any> {
        return Object.entries(properties).reduce((acc, [key, value]) => {
            if (typeof value !== "string") return acc;
            const parsedTag = this.parseTag(value, tagName);
            if (parsedTag) {
                const parsedProperty = this.getProperty(`${tagName}.${parsedTag}`, context);
                acc[key] = parsedProperty;
            } else {
                acc[key] = value;
            }
            return acc;
        }, {});
    }
}

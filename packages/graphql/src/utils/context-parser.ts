/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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

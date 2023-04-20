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

const ESCAPE_SYMBOL_REGEX = /`/g;

export function escapeLabel(label: string): string {
    // TODO: only escape when needed
    return escapeString(label);
}

export function escapeType(type: string): string {
    const normalizedStr = normalizeString(type);
    if (needsEscape(normalizedStr)) {
        return escapeString(normalizedStr);
    }
    return type;
}

export function escapeProperty(propName: string): string {
    const normalizedStr = normalizeString(propName);
    if (needsEscape(normalizedStr)) {
        return escapeString(normalizedStr);
    }
    return propName;
}

function normalizeString(str: string): string {
    return str.replace(/\\u0060/g, "`");
}

function needsEscape(str: string): boolean {
    const validCharacter = /^[a-z0-9_]*$/i;
    return !validCharacter.test(str);
}

function escapeString(str: string): string {
    const escapedLabel = normalizeString(str).replace(ESCAPE_SYMBOL_REGEX, "``");
    return `\`${escapedLabel}\``;
}

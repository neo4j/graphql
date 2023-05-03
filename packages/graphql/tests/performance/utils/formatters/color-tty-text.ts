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

export enum TTYColors {
    yellow = "\x1b[33m",
    cyan = "\x1b[36m",
    red = "\x1b[31m",
    green = "\x1b[32m",
    magenta = "\x1b[45m",
}

const TTYReset = "\x1b[0m";

export function colorText(text: string, color: TTYColors): string {
    return `${color}${text}${TTYReset}`;
}

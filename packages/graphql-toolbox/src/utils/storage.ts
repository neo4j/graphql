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

export class Storage {
    public static store(key: string, value: string): void {
        if (window.localStorage) {
            window.localStorage.setItem(key, value);
        }
    }

    public static storeJSON(key: string, value: any): void {
        if (window.localStorage) {
            window.localStorage.setItem(key, JSON.stringify(value));
        }
    }

    public static retrieve(key: string): string | null {
        if (!window.localStorage) return null;
        return window.localStorage.getItem(key);
    }

    public static retrieveJSON(key: string): any | null {
        if (!window.localStorage) return null;
        const data = this.retrieve(key);
        if (!data) return null;
        try {
            return JSON.parse(data);
        } catch (error) {
            console.log("retrieveJSON error: ", error);
            return null;
        }
    }

    public static remove(key: string): void {
        if (window.localStorage) {
            window.localStorage.removeItem(key);
        }
    }

    public static clearAll(): void {
        if (window.localStorage) {
            window.localStorage.clear();
        }
    }
}

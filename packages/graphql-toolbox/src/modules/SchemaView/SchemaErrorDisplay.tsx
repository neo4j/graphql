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

import type { GraphQLError } from "graphql";

interface Props {
    error: string | GraphQLError;
}

export const SchemaErrorDisplay = ({ error }: Props) => {
    if (!error) return null;

    return (
        <div
            className="mt-1 mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative"
            role="alert"
        >
            {typeof error === "string" ? (
                <span className="block">{error}</span>
            ) : (
                <>
                    <span className="block">{error.message}</span>
                    {error.locations ? (
                        <span className="block">Locations: {JSON.stringify(error.locations)}</span>
                    ) : null}
                </>
            )}
        </div>
    );
};

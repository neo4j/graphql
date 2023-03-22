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

import type React from "react";

interface Props {
    value: string | number | readonly string[] | undefined;
    onChange: React.ChangeEventHandler<HTMLSelectElement> | undefined;
    children: JSX.Element[];
    testTag?: string;
    disabled?: boolean;
}

export const CustomSelect: React.FC<Props> = ({ value, onChange, children, testTag, disabled = false }: Props) => {
    const selectProps = {};
    if (testTag) {
        selectProps[testTag] = true;
    }
    return (
        <select
            className="w-36 cursor-pointer px-2 py-1 rounded border border-gray-100 bg-white"
            value={value}
            onChange={onChange}
            disabled={disabled}
            {...selectProps}
        >
            {children}
        </select>
    );
};

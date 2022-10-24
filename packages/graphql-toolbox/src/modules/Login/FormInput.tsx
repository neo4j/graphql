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

import { TextInput } from "@neo4j-ndl/react";

export interface Props {
    name: string;
    label: string;
    type: string;
    testtag: string;
    value?: string;
    placeholder?: string;
    defaultValue?: string;
    autoComplete?: string;
    required: boolean;
    disabled?: boolean;
    onChange?: (event: React.FormEvent<HTMLInputElement>) => void;
}

export const FormInput = (props: Props) => {
    const options = {};
    if (props.testtag) {
        options[props.testtag] = true;
    }
    return <TextInput aria-label={props.name} fluid {...props} {...options} />;
};

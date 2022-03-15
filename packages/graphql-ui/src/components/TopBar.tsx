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

import { useContext } from "react";
import { Checkbox } from "@neo4j-ndl/react";
import { AuthContext } from "../contexts/auth";
import { ThemeContext, Theme } from "../contexts/theme";

export const TopBar = () => {
    const auth = useContext(AuthContext);
    const theme = useContext(ThemeContext);
    const greenDot = <span className="ml-1 h-3 w-3 bg-green-400 rounded-full inline-block" />;
    const redDot = <span className="ml-1 h-3 w-3 bg-red-400 rounded-full inline-block" />;

    const onChangeEditorTheme = (): void => {
        const next = theme.theme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT;
        theme.setTheme(next);
    };

    return (
        <div
            className={`
                flex 
                justify-center 
                w-full 
                h-16 
                n-bg-neutral-90 
            `}
        >
            <div className="flex items-center justify-space text-white mr-8">
                <Checkbox
                    checked={theme.theme === Theme.LIGHT}
                    className="m-0"
                    label="Light editor theme"
                    labelBefore={true}
                    onChange={onChangeEditorTheme}
                />
            </div>
            <div className="flex items-center justify-space text-white text-base font-bold">
                <p>Connected to: {auth?.connectUrl}</p>
                <p className="ml-1">Status: {auth?.isConnected ? greenDot : redDot}</p>
            </div>
        </div>
    );
};

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
import { Radio } from "@neo4j-ndl/react";
import { Theme, ThemeContext } from "../contexts/theme";

export const AppSettings = () => {
    const theme = useContext(ThemeContext);

    const handleOThemeClick = (e: any) => {
        const next = e.target.id === Theme.LIGHT.toString() ? Theme.LIGHT : Theme.DARK;
        theme.setTheme(next);
    };

    return (
        <div>
            <div className="pb-6 flex justify-between items-center">
                <h3>Settings</h3>
                <span className="text-lg cursor-pointer">{"\u2715"}</span>
            </div>
            <div>
                <h4>Editors</h4>
                <Radio
                    id={Theme.LIGHT.toString()}
                    className="cursor-pointer"
                    label="Light theme"
                    checked={theme.theme === Theme.LIGHT}
                    onChange={handleOThemeClick}
                />
                <Radio
                    id={Theme.DARK.toString()}
                    className="cursor-pointer"
                    label="Dark theme"
                    checked={theme.theme === Theme.DARK}
                    onChange={handleOThemeClick}
                />
            </div>
        </div>
    );
};

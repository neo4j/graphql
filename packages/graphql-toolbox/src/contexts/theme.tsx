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

import React, { useState, useEffect } from "react";
import { useStore } from "../store";

export enum Theme {
    LIGHT,
    DARK,
}

export interface State {
    theme: Theme;
    setTheme: (v: Theme) => void;
}

export const ThemeContext = React.createContext({} as State);

export function ThemeProvider(props: React.PropsWithChildren<any>) {
    const loadEditorTheme = () => {
        const editorTheme = useStore.getState().editorTheme;
        if (editorTheme) {
            return editorTheme === Theme.LIGHT.toString() ? Theme.LIGHT : Theme.DARK;
        }

        return Theme.DARK;
    };

    const [value, setValue] = useState<State>({
        theme: loadEditorTheme(),
        setTheme: (theme: Theme) => _setTheme(theme),
    });

    // Automatically detect if the user changed the color scheme/theme, also on OS level.
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (event) => {
        event.matches ? _setTheme(Theme.DARK) : _setTheme(Theme.LIGHT);
    });

    useEffect(() => {
        if (!useStore.getState().editorTheme) {
            window.matchMedia("(prefers-color-scheme: dark)").matches ? _setTheme(Theme.DARK) : _setTheme(Theme.LIGHT);
        }
    }, []);

    const _setTheme = (theme: Theme) => {
        setValue((values) => ({ ...values, theme }));
        useStore.setState({ editorTheme: theme.toString() });
    };

    return <ThemeContext.Provider value={value}>{props.children}</ThemeContext.Provider>;
}

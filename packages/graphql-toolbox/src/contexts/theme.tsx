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

import React, { Dispatch, useState, SetStateAction, useEffect } from "react";
import { Storage } from "../utils/storage";
import { LOCAL_STATE_EDITOR_THEME } from "../constants";

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
    let value: State | undefined;
    let setValue: Dispatch<SetStateAction<State>>;

    const _setTheme = (theme: Theme) => {
        setValue((values) => ({ ...values, theme }));
        Storage.store(LOCAL_STATE_EDITOR_THEME, theme.toString());
    };

    const loadEditorTheme = () => {
        const storedTheme = Storage.retrieve(LOCAL_STATE_EDITOR_THEME);
        if (storedTheme) {
            return storedTheme === Theme.LIGHT.toString() ? Theme.LIGHT : Theme.DARK;
        }

        return Theme.DARK;
    };

    [value, setValue] = useState<State>({
        theme: loadEditorTheme(),
        setTheme: (theme: Theme) => _setTheme(theme),
    });

    // Automatically detect if the user changed the color scheme/theme, also on OS level.
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (event) => {
        event.matches ? _setTheme(Theme.DARK) : _setTheme(Theme.LIGHT);
    });

    useEffect(() => {
        const storedTheme = Storage.retrieve(LOCAL_STATE_EDITOR_THEME);
        if (!storedTheme) {
            window.matchMedia("(prefers-color-scheme: dark)").matches ? _setTheme(Theme.DARK) : _setTheme(Theme.LIGHT);
        }
    }, []);

    return <ThemeContext.Provider value={value }>{props.children}</ThemeContext.Provider>;
}

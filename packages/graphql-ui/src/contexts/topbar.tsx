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

import React, { Dispatch, useState, SetStateAction } from "react";
import { LOCAL_STATE_EDITOR_THEME } from "src/constants";

export enum EditorThemes {
    LIGHT,
    DARK,
}

export interface State {
    editorTheme: EditorThemes;
    setEditorTheme: (v: EditorThemes) => void;
}

export const Context = React.createContext(null as unknown as State);

export function Provider(props: React.PropsWithChildren<any>) {
    let value: State | undefined;
    let setValue: Dispatch<SetStateAction<State>>;

    const loadEditorTheme = () => {
        const storedTheme = localStorage.getItem(LOCAL_STATE_EDITOR_THEME);
        if (storedTheme) {
            return storedTheme === EditorThemes.LIGHT.toString() ? EditorThemes.LIGHT : EditorThemes.DARK;
        }
        return EditorThemes.DARK;
    };

    [value, setValue] = useState<State>({
        editorTheme: loadEditorTheme(),
        setEditorTheme: (editorTheme: EditorThemes) => {
            setValue((v) => ({ ...v, editorTheme }));
            localStorage.setItem(LOCAL_STATE_EDITOR_THEME, editorTheme.toString());
        },
    });

    return <Context.Provider value={value as State}>{props.children}</Context.Provider>;
}

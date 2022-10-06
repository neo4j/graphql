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

export interface State {
    isShowSettingsDrawer: boolean;
    isShowHelpDrawer: boolean;
    setIsShowSettingsDrawer: (v: boolean) => void;
    setIsShowHelpDrawer: (v: boolean) => void;
}

export const SettingsContext = React.createContext({} as State);

export function SettingsProvider(props: React.PropsWithChildren<any>) {
    let value: State | undefined;
    let setValue: Dispatch<SetStateAction<State>>;

    [value, setValue] = useState<State>({
        isShowSettingsDrawer: false,
        isShowHelpDrawer: false,
        setIsShowSettingsDrawer: (isShowSettingsDrawer: boolean) => {
            setValue((values) => ({
                ...values,
                isShowSettingsDrawer,
                ...(isShowSettingsDrawer ? { isShowHelpDrawer: false } : { isShowHelpDrawer: values.isShowHelpDrawer }),
            }));
        },
        setIsShowHelpDrawer: (isShowHelpDrawer: boolean) => {
            setValue((values) => ({
                ...values,
                isShowHelpDrawer,
                ...(isShowHelpDrawer
                    ? { isShowSettingsDrawer: false }
                    : { isShowSettingsDrawer: values.isShowSettingsDrawer }),
            }));
        },
    });

    return <SettingsContext.Provider value={value }>{props.children}</SettingsContext.Provider>;
}

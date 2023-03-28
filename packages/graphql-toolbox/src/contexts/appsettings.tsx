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

import type { Dispatch, SetStateAction } from "react";
import React, { useState, useEffect } from "react";
import { useStore } from "../store";
import { ConstraintState } from "../types";

export interface State {
    showLintMarkers: boolean;
    enableProductUsageTracking: boolean;
    hideProductUsageMessage: boolean;
    setShowLintMarkers: (v: boolean) => void;
    setEnableProductUsageTracking: (v: boolean) => void;
    setHideProductUsageMessage: (v: boolean) => void;
}

export const AppSettingsContext = React.createContext({} as State);

export function AppSettingsProvider(props: React.PropsWithChildren<any>) {
    const store = useStore();

    const [value, setValue]: [value: State | undefined, setValue: Dispatch<SetStateAction<State>>] = useState<State>({
        showLintMarkers: store.showLintMarkers,
        enableProductUsageTracking: store.enableProductUsageTracking,
        hideProductUsageMessage: store.hideProductUsageTrackingMessage,
        setShowLintMarkers: (nextState: boolean) => {
            store.setShowLintMarkers(nextState);
            setValue((values) => ({ ...values, showLintMarkers: nextState }));
        },
        setEnableProductUsageTracking: (nextState: boolean) => {
            store.setEnableProductUsageTracking(nextState);
            setValue((values) => ({ ...values, enableProductUsageTracking: nextState }));
        },
        setHideProductUsageMessage: (nextState: boolean) => {
            store.setHideProductUsageTrackingMessage(nextState);
            setValue((values) => ({ ...values, hideProductUsageMessage: nextState }));
        },
    });

    useEffect(() => {
        if (!store.constraint) {
            store.setConstraint(ConstraintState.ignore.toString());
        }
    }, []);

    return <AppSettingsContext.Provider value={value}>{props.children}</AppSettingsContext.Provider>;
}

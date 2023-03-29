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
import * as neo4j from "neo4j-driver";
import { VERIFY_CONNECTION_INTERVAL_MS } from "../constants";
import {
    checkDatabaseHasData,
    getDatabases,
    resolveNeo4jDesktopLoginPayload,
    resolveSelectedDatabaseName,
} from "./utils";
import type { LoginPayload, Neo4jDatabase } from "../types";
import { getURLProtocolFromText } from "../utils/utils";
import { useStore } from "../store";

interface LoginOptions {
    username: string;
    password: string;
    url: string;
}

export interface State {
    driver?: neo4j.Driver;
    connectUrl?: string;
    username?: string;
    isConnected?: boolean;
    isNeo4jDesktop?: boolean;
    databases?: Neo4jDatabase[];
    selectedDatabaseName?: string;
    showIntrospectionPrompt?: boolean;
    login: (options: LoginOptions) => Promise<void>;
    logout: () => void;
    setSelectedDatabaseName: (databaseName: string) => void;
    setShowIntrospectionPrompt: (nextState: boolean) => void;
}

export const AuthContext = React.createContext({} as State);

export function AuthProvider(props: any) {
    let intervalId: number;

    const [value, setValue] = useState<State>({
        login: async (options: LoginOptions) => {
            const auth = neo4j.auth.basic(options.username, options.password);
            const protocol = getURLProtocolFromText(options.url);
            // Manually set the encryption to off if it's not specified in the Connection URI to avoid implicit encryption in https domain
            const driver = protocol.includes("+s")
                ? neo4j.driver(options.url, auth)
                : neo4j.driver(options.url, auth, { encrypted: "ENCRYPTION_OFF" });

            await driver.verifyConnectivity();

            const databases = await getDatabases(driver);
            const selectedDatabaseName = resolveSelectedDatabaseName(databases || []);

            let isShowIntrospectionPrompt = false;
            if (!useStore((store) => store.hideIntrospectionPrompt)) {
                isShowIntrospectionPrompt = await checkDatabaseHasData(driver, selectedDatabaseName);
                useStore.setState({ hideIntrospectionPrompt: true });
            }

            useStore.setState({ connectionUsername: options.username });
            useStore.setState({ connectionUrl: options.url });

            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            intervalId = window.setInterval(async () => {
                await checkForDatabaseUpdates(driver, setValue);
            }, VERIFY_CONNECTION_INTERVAL_MS);

            setValue((values) => ({
                ...values,
                driver,
                username: options.username,
                connectUrl: options.url,
                isConnected: true,
                showIntrospectionPrompt: isShowIntrospectionPrompt,
                databases,
                selectedDatabaseName,
            }));
        },
        logout: () => {
            useStore.setState({ connectionUsername: null });
            useStore.setState({ connectionUrl: null });
            useStore.setState({ hideIntrospectionPrompt: false });
            if (intervalId) {
                clearInterval(intervalId);
            }

            setValue((values) => ({
                ...values,
                driver: undefined,
                connectUrl: undefined,
                isConnected: false,
                showIntrospectionPrompt: false,
            }));
        },
        setSelectedDatabaseName: (databaseName: string) => {
            useStore.setState({ selectedDatabaseName: databaseName });
            setValue((values) => ({ ...values, selectedDatabaseName: databaseName }));
        },
        setShowIntrospectionPrompt: (nextState: boolean) => {
            setValue((values) => ({ ...values, showIntrospectionPrompt: nextState }));
        },
    });

    useEffect(() => {
        resolveNeo4jDesktopLoginPayload().then(processLoginPayload.bind(null, value)).catch(console.error);
    }, []);

    const checkForDatabaseUpdates = async (driver: neo4j.Driver, setValue: any) => {
        try {
            await driver.verifyConnectivity();
            const databases = await getDatabases(driver);
            setValue((values) => ({ ...values, isConnected: true, databases: databases || [] }));
        } catch (err) {
            setValue((values) => ({ ...values, isConnected: false }));
        }
    };

    const processLoginPayload = (value: State | undefined, loginPayloadFromDesktop: LoginPayload | null) => {
        let loginPayload: LoginPayload | null = null;
        if (loginPayloadFromDesktop) {
            loginPayload = loginPayloadFromDesktop;
            setValue((values) => ({ ...values, isNeo4jDesktop: true }));
        } else {
            const connectionUrl = useStore((store) => store.connectionUrl);
            const connectionUsername = useStore((store) => store.connectionUsername);
            if (connectionUrl && connectionUsername) {
                loginPayload = {
                    username: connectionUsername,
                    url: connectionUrl,
                };
            }
        }
        if (loginPayload?.password && value && !value.driver) {
            value
                .login({
                    username: loginPayload.username,
                    password: loginPayload.password,
                    url: loginPayload.url,
                })
                .catch((error) => console.log(error));
        }
    };

    return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>;
}

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
import * as neo4j from "neo4j-driver";
import { encrypt, decrypt } from "../utils/utils";
import { LOCAL_STATE_LOGIN, LOCAL_STATE_SELECTED_DATABASE_NAME, VERIFY_CONNECTION_INTERVAL_MS } from "../constants";
import { getDatabases, resolveNeo4jDesktopLoginPayload, resolveSelectedDatabaseName } from "./utils";
import { LoginPayload, Neo4jDatabase } from "../types";
import { Storage } from "../utils/storage";

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
    login: (options: LoginOptions) => Promise<void>;
    logout: () => void;
    setSelectedDatabaseName: (databaseName: string) => void;
}

export const AuthContext = React.createContext({} as State);

export function AuthProvider(props: any) {
    let value: State | undefined;
    let setValue: Dispatch<SetStateAction<State>>;
    let intervalId: number;

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
            setValue((v) => ({ ...v, isNeo4jDesktop: true }));
        } else {
            const storedEncryptedPayload = Storage.retrieve(LOCAL_STATE_LOGIN);
            if (storedEncryptedPayload && typeof storedEncryptedPayload === "string") {
                const { encryptedPayload, hashKey } = JSON.parse(storedEncryptedPayload as string);
                loginPayload = decrypt(encryptedPayload, hashKey) as unknown as LoginPayload;
            }
        }
        if (loginPayload && value && !value.driver) {
            value
                .login({
                    username: loginPayload.username,
                    password: loginPayload.password,
                    url: loginPayload.url,
                })
                .catch(() => {});
        }
    };

    [value, setValue] = useState<State>({
        login: async (options: LoginOptions) => {
            const auth = neo4j.auth.basic(options.username, options.password);
            const protocol = new URL(options.url).protocol;
            // Manually set the encryption to off if it's not specified in the Connection URI to avoid implicit encryption in https domain
            const driver = protocol.includes("+s")
                ? neo4j.driver(options.url, auth)
                : neo4j.driver(options.url, auth, { encrypted: "ENCRYPTION_OFF" });

            await driver.verifyConnectivity();

            const databases = await getDatabases(driver);
            const selectedDatabaseName = resolveSelectedDatabaseName(databases || []);

            const encodedPayload = encrypt({
                username: options.username,
                password: options.password,
                url: options.url,
            } as LoginPayload);
            Storage.storeJSON(LOCAL_STATE_LOGIN, encodedPayload);

            intervalId = window.setInterval(() => {
                checkForDatabaseUpdates(driver, setValue);
            }, VERIFY_CONNECTION_INTERVAL_MS);

            setValue((v) => ({
                ...v,
                driver,
                username: options.username,
                connectUrl: options.url,
                isConnected: true,
                databases,
                selectedDatabaseName,
            }));
        },
        logout: () => {
            Storage.remove(LOCAL_STATE_LOGIN);
            if (intervalId) {
                clearInterval(intervalId);
            }

            setValue((v) => ({ ...v, driver: undefined, connectUrl: undefined, isConnected: false }));
        },
        setSelectedDatabaseName: (databaseName: string) => {
            Storage.store(LOCAL_STATE_SELECTED_DATABASE_NAME, databaseName);
            setValue((v) => ({ ...v, selectedDatabaseName: databaseName }));
        },
    });

    useEffect(() => {
        resolveNeo4jDesktopLoginPayload().then(processLoginPayload.bind(null, value)).catch(console.error);
    }, []);

    return <AuthContext.Provider value={value as State}>{props.children}</AuthContext.Provider>;
}

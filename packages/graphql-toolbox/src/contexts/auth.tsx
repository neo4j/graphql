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
import { LOCAL_STATE_LOGIN, VERIFY_CONNECTION_INTERVAL_MS } from "../constants";
import { resolveNeo4jDesktopLoginPayload } from "./utils";
import { LoginPayload } from "./types";

interface LoginOptions {
    username: string;
    password: string;
    url: string;
}

export interface State {
    driver?: neo4j.Driver;
    connectUrl?: string;
    isConnected?: boolean;
    isNeo4jDesktop?: boolean;
    login: (options: LoginOptions) => Promise<void>;
    logout: () => void;
}

export const AuthContext = React.createContext(null as unknown as State);

export function AuthProvider(props: any) {
    let value: State | undefined;
    let setValue: Dispatch<SetStateAction<State>>;
    let intervalId: number;

    const checkConnectivity = async (driver: neo4j.Driver, setValue: any) => {
        try {
            await driver.verifyConnectivity();
            setValue((v) => ({ ...v, isConnected: true }));
        } catch (err) {
            setValue((v) => ({ ...v, isConnected: false }));
        }
    };

    const processLoginPayload = (value: State | undefined, loginPayloadFromDesktop: LoginPayload | null) => {
        let loginPayload: LoginPayload | null = null;
        if (loginPayloadFromDesktop) {
            loginPayload = loginPayloadFromDesktop;
            setValue((v) => ({ ...v, isNeo4jDesktop: true }));
        } else {
            const storedEncryptedPayload = localStorage.getItem(LOCAL_STATE_LOGIN);
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
            const driver = neo4j.driver(options.url, auth);
            await driver.verifyConnectivity();

            const encodedPayload = encrypt({
                username: options.username,
                password: options.password,
                url: options.url,
            } as LoginPayload);
            localStorage.setItem(LOCAL_STATE_LOGIN, JSON.stringify(encodedPayload));

            intervalId = window.setInterval(() => {
                checkConnectivity(driver, setValue);
            }, VERIFY_CONNECTION_INTERVAL_MS);

            setValue((v) => ({ ...v, driver, connectUrl: options.url, isConnected: true }));
        },
        logout: () => {
            localStorage.removeItem(LOCAL_STATE_LOGIN);
            if (intervalId) {
                clearInterval(intervalId);
            }

            setValue((v) => ({ ...v, driver: undefined, connectUrl: undefined, isConnected: false }));
        },
    });

    useEffect(() => {
        resolveNeo4jDesktopLoginPayload().then(processLoginPayload.bind(null, value)).catch(console.error);
    }, []);

    return <AuthContext.Provider value={value as State}>{props.children}</AuthContext.Provider>;
}

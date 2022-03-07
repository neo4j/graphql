import React, { Dispatch, useState, SetStateAction } from "react";
import * as neo4j from "neo4j-driver";
import { encrypt, decrypt } from "src/utils/utils";
import { LOCAL_STATE_LOGIN } from "src/constants/constants";

const VERIFY_CONNECTION_INTERVAL_MS = 30000;

interface LoginOptions {
    username: string;
    password: string;
    url: string;
}

interface LoginPayload {
    username: string;
    password: string;
    url: string;
}

export interface State {
    driver?: neo4j.Driver;
    connectUrl?: string;
    isConnected?: boolean;
    login: (options: LoginOptions) => Promise<void>;
    logout: () => void;
}

// @ts-ignore - This is going to be set in the Provider
export const Context = React.createContext<State>();

export function Provider(props: any) {
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

            intervalId = window.setInterval(() => checkConnectivity(driver, setValue), VERIFY_CONNECTION_INTERVAL_MS);

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

    const storedEncryptedPayload = localStorage.getItem(LOCAL_STATE_LOGIN);
    if (storedEncryptedPayload && typeof storedEncryptedPayload === "string") {
        const { encryptedPayload, hashKey } = JSON.parse(storedEncryptedPayload as string);
        const { username, password, url } = decrypt(encryptedPayload, hashKey) as unknown as LoginPayload;

        if (username && password && url && !value.driver) {
            value
                .login({
                    username,
                    password,
                    url,
                })
                .catch(() => {});
        }
    }

    return <Context.Provider value={value as State}>{props.children}</Context.Provider>;
}

import React, { Dispatch, useState } from "react";
import * as neo4j from "neo4j-driver";
import { SetStateAction } from "react";

interface LoginOptions {
    username: string;
    password: string;
    url: string;
}

export interface State {
    driver?: neo4j.Driver;
    login: (options: LoginOptions) => Promise<void>;
    logout: () => void;
}

// @ts-ignore - This is going to be set in the Provider
export const Context = React.createContext<State>();

export function Provider(props: any) {
    let value: State | undefined;
    let setValue: Dispatch<SetStateAction<State>>;

    [value, setValue] = useState<State>({
        login: async (options: LoginOptions) => {
            const auth = neo4j.auth.basic(options.username, options.password);
            const driver = neo4j.driver(options.url, auth);
            await driver.verifyConnectivity();

            setValue((v) => ({ ...v, driver }));
        },
        logout: () => {
            setValue((v) => ({ ...v, driver: undefined }));
        },
    });

    return <Context.Provider value={value as State}>{props.children}</Context.Provider>;
}

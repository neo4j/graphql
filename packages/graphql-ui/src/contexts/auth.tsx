import React, { Dispatch, useState } from "react";
import { Driver } from "neo4j-driver";
import { SetStateAction } from "react";

interface LoginOptions {
    username: string;
    password: string;
    url: string;
}

export interface State {
    driver?: Driver;
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
            // @ts-ignore
            setValue((v) => ({ ...v, driver: true }));
        },
        logout: () => {
            setValue((v) => ({ ...v, driver: undefined }));
        },
    });

    return <Context.Provider value={value as State}>{props.children}</Context.Provider>;
}

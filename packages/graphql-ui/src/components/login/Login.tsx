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

import { useCallback } from "react";
import { useContext, useState } from "react";
import { FormInput } from "./FormInput";
import { Button } from "@neo4j-ndl/react";
import {
    DEFAULT_BOLT_URL,
    LOGIN_BUTTON,
    LOGIN_PASSWORD_INPUT,
    LOGIN_URL_INPUT,
    LOGIN_USERNAME_INPUT,
} from "../../constants";
// @ts-ignore - SVG Import
import Icon from "../../assets/neo4j-color.svg";
import { AuthContext } from "../../contexts/auth";

export const Login = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const auth = useContext(AuthContext);

    const onSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);

        try {
            const data = new FormData(event.currentTarget);
            const username = data.get("username") as string;
            const password = data.get("password") as string;
            const url = data.get("url") as string;

            await auth.login({
                username,
                password,
                url,
            });
        } catch (error) {
            setError((error as Error).message as string);
        } finally {
            setLoading(false);
        }
    }, []);

    return (
        <div className="grid place-items-center h-screen n-bg-neutral-90">
            <div className="flex flex-col align-center justify-center bg-white shadow-md rounded p-8">
                <div className="mb-3">
                    <img src={Icon} alt="d.s" className="h-12 w-12 mx-auto" />
                    <h2 className="text-3xl mx-auto">Neo4j GraphQL Toolbox</h2>
                </div>
                <form onSubmit={onSubmit}>
                    <div className="mb-4">
                        <FormInput
                            id={LOGIN_USERNAME_INPUT}
                            label="Username"
                            name="username"
                            placeholder="neo4j"
                            required={true}
                            type="text"
                            disabled={loading}
                        ></FormInput>
                    </div>
                    <div className="mb-6">
                        <FormInput
                            id={LOGIN_PASSWORD_INPUT}
                            label="Password"
                            name="password"
                            placeholder="password"
                            required={true}
                            type="password"
                            disabled={loading}
                        ></FormInput>
                    </div>
                    <div className="mb-8">
                        <FormInput
                            id={LOGIN_URL_INPUT}
                            label="Bolt URL"
                            name="url"
                            placeholder={DEFAULT_BOLT_URL}
                            defaultValue={DEFAULT_BOLT_URL}
                            required={true}
                            type="text"
                            disabled={loading}
                        ></FormInput>
                    </div>
                    <div className="flex items-center justify-between">
                        <Button id={LOGIN_BUTTON} color="neutral" fill="outlined" type="submit" disabled={loading}>
                            {loading ? <>Connecting...</> : <span>Connect</span>}
                        </Button>
                    </div>

                    {error && (
                        <p className="mt-4 inline-block align-baseline font-bold text-sm text-red-500">{error}</p>
                    )}
                </form>
            </div>
        </div>
    );
};

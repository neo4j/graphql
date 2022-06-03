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
import { CONNECT_URL_PARAM_NAME, DEFAULT_BOLT_URL, DEFAULT_USERNAME, USERNAME_PARAM_NAME } from "../../constants";
// @ts-ignore - SVG Import
import Icon from "../../assets/neo4j-color.svg";
import { AuthContext } from "../../contexts/auth";
import { getUrlSearchParam } from "../../contexts/utils";

export const Login = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const auth = useContext(AuthContext);
    const [url, setUrl] = useState(getUrlSearchParam(CONNECT_URL_PARAM_NAME) || DEFAULT_BOLT_URL);
    const [username, setUsername] = useState(getUrlSearchParam(USERNAME_PARAM_NAME) || DEFAULT_USERNAME);
    const [secure, setSecure] = useState(true);

    const onSubmit = useCallback(
        async (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            setLoading(true);

            try {
                const data = new FormData(event.currentTarget);
                const secure = data.get("secure") as string;
                const password = data.get("password") as string;

                await auth.login({
                    username,
                    password,
                    url,
                    secure,
                });
            } catch (error) {
                setError((error as Error).message as string);
            } finally {
                setLoading(false);
            }
        },
        [url, username]
    );

    return (
        <div className="grid place-items-center h-screen n-bg-neutral-90">
            <div className="w-login flex flex-col align-center justify-center bg-white shadow-md rounded p-8">
                <div className="mb-6 text-center">
                    <img src={Icon} alt="d.s" className="h-12 w-12 mx-auto" />
                    <h2 className="mt-1 text-3xl">Neo4j GraphQL Toolbox</h2>
                </div>
                <form onSubmit={onSubmit}>
                    <div className="mb-4">
                        <FormInput
                            testTag="data-test-login-username"
                            label="Username"
                            name="username"
                            value={username}
                            onChange={(event) => setUsername(event.currentTarget.value)}
                            placeholder="neo4j"
                            required={true}
                            type="text"
                            disabled={loading}
                            autoComplete="username"
                        ></FormInput>
                    </div>
                    <div className="mb-6">
                        <FormInput
                            testTag="data-test-login-password"
                            label="Password"
                            name="password"
                            placeholder="password"
                            required={true}
                            type="password"
                            disabled={loading}
                            autoComplete="current-password"
                        ></FormInput>
                    </div>
                    <div className="mb-6">
                        <FormInput
                            testTag="data-test-login-url"
                            label="Connection URI"
                            name="url"
                            value={url}
                            onChange={(event) => setUrl(event.currentTarget.value)}
                            placeholder={DEFAULT_BOLT_URL}
                            required={true}
                            type="text"
                            disabled={loading}
                        ></FormInput>
                    </div>
                    <div className="mb-4">
                        <label className="text-gray-700 text-sm font-bold mb-2 mr-2">Secure connection:</label>
                        <input
                            data-test-login-secure="true"
                            type="checkbox"
                            name="secure"
                            checked={secure}
                            onChange={(event) => setSecure(event.currentTarget.checked)}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Button data-test-login-button color="neutral" fill="outlined" type="submit" disabled={loading}>
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

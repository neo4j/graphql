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
import { DEFAULT_BOLT_URL, DEFAULT_USERNAME } from "../../constants";
// @ts-ignore - SVG Import
import Icon from "../../assets/neo4j-color.svg";
import { AuthContext } from "../../contexts/auth";
import { getConnectUrlSearchParamValue } from "../../contexts/utils";

export const Login = () => {
    const auth = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { url: searchParamUrl, username: searchParamUsername } = getConnectUrlSearchParamValue() || {};
    const [url, setUrl] = useState(searchParamUrl || DEFAULT_BOLT_URL);
    const [username, setUsername] = useState(searchParamUsername || DEFAULT_USERNAME);

    const onSubmit = useCallback(
        async (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            setLoading(true);

            try {
                const data = new FormData(event.currentTarget);
                const password = data.get("password") as string;

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
        },
        [url, username]
    );

    return (
        <div className="grid place-items-center h-screen n-bg-neutral-90">
            <div className="w-login flex flex-col align-center justify-center bg-white shadow-md rounded p-8">
                <div className="mb-6 text-center">
                    <img src={Icon} alt="Neo4j Logo" className="h-12 w-12 mx-auto" />
                    <h2 className="mt-1 text-3xl">Neo4j GraphQL Toolbox</h2>
                </div>
                <form onSubmit={onSubmit} className="flex flex-col gap-4">
                    <FormInput
                        testtag="data-test-login-username"
                        label="Username"
                        name="username"
                        placeholder="neo4j"
                        value={username}
                        onChange={(event) => setUsername(event.currentTarget.value)}
                        required={true}
                        type="text"
                        disabled={loading}
                        autoComplete="username"
                    />

                    <FormInput
                        testtag="data-test-login-password"
                        label="Password"
                        name="password"
                        placeholder="password"
                        required={true}
                        type="password"
                        disabled={loading}
                        autoComplete="current-password"
                    />

                    <FormInput
                        testtag="data-test-login-url"
                        label="Connection URI"
                        name="url"
                        value={url}
                        onChange={(event) => setUrl(event.currentTarget.value)}
                        placeholder={DEFAULT_BOLT_URL}
                        required={true}
                        type="text"
                        disabled={loading}
                    />

                    <div className="flex items-center justify-between">
                        <Button
                            data-test-login-button
                            color="neutral"
                            fill="outlined"
                            type="submit"
                            loading={loading}
                            disabled={loading}
                            onClick={() => {}} // INFO: To prevent warning in browser console
                        >
                            Connect
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

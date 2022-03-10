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

import { useContext } from "react";
import * as AuthContext from "../../contexts/auth";

const TopBar = () => {
    const auth = useContext(AuthContext.Context);
    const greenDot = <span className="ml-1 h-3 w-3 bg-green-400 rounded-full inline-block" />;
    const redDot = <span className="ml-1 h-3 w-3 bg-red-400 rounded-full inline-block" />;

    return (
        <div className="flex justify-center w-full h-16 n-bg-neutral-20">
            <div className="flex justify-center w-full h-12 m-2 n-bg-neutral-90">
                <div className="flex items-center justify-space text-white text-sm">
                    <div className="mr-3">Connected to: {auth?.connectUrl}</div>
                    <div className="flex items-start">Status: {auth?.isConnected ? greenDot : redDot}</div>
                </div>
            </div>
        </div>
    );
};

export default TopBar;

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

import { Main } from "./modules/Main/Main";
import { AuthProvider } from "./contexts/auth";
import { ScreenProvider } from "./contexts/screen";
import { ThemeProvider } from "./contexts/theme";
import { SettingsProvider } from "./contexts/settings";
import { AppSettingsProvider } from "./contexts/appsettings";
import "@neo4j-ndl/base/lib/neo4j-ds-styles.css";
import "@graphiql/react/dist/style.css";
import "./index.css";

export const App = () => {
    return (
        <AuthProvider>
            <ScreenProvider>
                <ThemeProvider>
                    <SettingsProvider>
                        <AppSettingsProvider>
                            <Main />
                        </AppSettingsProvider>
                    </SettingsProvider>
                </ThemeProvider>
            </ScreenProvider>
        </AuthProvider>
    );
};

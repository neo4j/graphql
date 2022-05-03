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

import { Screen } from "./Screen";

export class HelpDrawer extends Screen {
    public openHelpDrawer() {
        // data-test-topbar-help-button
        // data-test-help-drawer
    }

    public closeHelpDrawer() {
        // data-test-help-drawer
        // data-test-help-drawer-close
    }

    public displaysSchemaViewContent() {}

    public displaysEditorViewContent() {}

    public displaysSchemaDocumentation() {}
}

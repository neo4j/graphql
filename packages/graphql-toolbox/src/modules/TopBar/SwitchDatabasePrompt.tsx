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

import { Button, Dialog } from "@neo4j-ndl/react";

interface Props {
    selectedDatabaseName: string | undefined;
    onClose: () => void;
    onSwitchDatabase: () => void;
}

export const SwitchDatabasePrompt = ({ selectedDatabaseName, onClose, onSwitchDatabase }: Props) => {
    return (
        <Dialog
            ndl-id="switch-database-prompt"
            data-test-switch-database-prompt
            type="warning"
            open={!!selectedDatabaseName}
            onClose={() => onClose()}
        >
            <Dialog.Header className="h4">Switch current database</Dialog.Header>
            <Dialog.Description>
                <p>If you switch the database, the content in the editor will be overwritten.</p>
                <br />
                <p>To save the current editor content, cancel this prompt and save the editor content as a favorite.</p>
            </Dialog.Description>
            <Dialog.Actions className="flex w-full">
                <Button
                    data-test-switch-database-prompt-cancel
                    fill="outlined"
                    color="neutral"
                    aria-label="Close switch database prompt"
                    onClick={() => onClose()}
                >
                    Cancel
                </Button>
                <Button
                    data-test-switch-database-prompt-switch-db
                    fill="outlined"
                    color="neutral"
                    aria-label="Switch database"
                    onClick={() => onSwitchDatabase()}
                >
                    Switch to database: {selectedDatabaseName}
                </Button>
            </Dialog.Actions>
        </Dialog>
    );
};

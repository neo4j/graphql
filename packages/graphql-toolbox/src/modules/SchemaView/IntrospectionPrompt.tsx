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

import { Button, IconButton, Modal } from "@neo4j-ndl/react";
import { XMarkIconOutline } from "@neo4j-ndl/react/icons";
import { tokens } from "@neo4j-ndl/base";

interface Props {
    open: boolean;
    onClose: () => void;
    onIntrospect: () => void;
    onDisconnect: () => void;
}

export const IntrospectionPrompt = ({ open, onClose, onDisconnect, onIntrospect }: Props) => {
    return (
        <Modal
            className="w-introspection-prompt p-12 n-bg-neutral-10 rounded-lg"
            id="introspection-prompt"
            data-test-introspect-prompt
            open={open}
            onClose={() => onClose()}
        >
            <div className="flex w-full">
                <span className="h4">Generate type definitions</span>
                <IconButton
                    aria-label="Close introspection modal"
                    className="mr-0 ml-auto"
                    onClick={() => onClose()}
                    clean
                >
                    <XMarkIconOutline />
                </IconButton>
            </div>
            <div className="mt-6 mb-20">
                Your current connection already has data. Would you like to introspect this database to generate type
                definitions automatically?
            </div>
            <div className="flex w-full">
                <Button data-test-introspect-prompt-cancel fill="outlined" color="neutral" onClick={() => onClose()}>
                    Cancel
                </Button>
                <div className="mr-0 ml-auto">
                    <Button
                        data-test-introspect-prompt-logout
                        className="mr-3"
                        fill="outlined"
                        color="primary"
                        onClick={() => onDisconnect()}
                    >
                        Switch connection
                    </Button>
                    <Button
                        data-test-introspect-prompt-introspect
                        style={{ backgroundColor: tokens.colors.primary[50] }}
                        fill="filled"
                        color="primary"
                        onClick={() => onIntrospect()}
                    >
                        Introspect
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

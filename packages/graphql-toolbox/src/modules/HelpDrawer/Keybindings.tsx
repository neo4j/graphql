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

// @ts-ignore - SVG import
import ArrowLeft from "../../assets/arrow-left.svg";
import { Screen, ScreenContext } from "../../contexts/screen";

interface RowEntryType {
    label: string;
    winCmd: string;
    macCmd: string;
    isBgDark?: boolean;
}

interface Props {
    onClickClose: () => void;
    onClickBack: () => void;
}

const schemaScreenCmds: RowEntryType[] = [
    {
        label: "Format/Prettify code",
        winCmd: "Ctrl+m",
        macCmd: "Cmd+m",
    },
];

const editorScreenCmds: RowEntryType[] = [
    {
        label: "Execute current query",
        winCmd: "Ctrl+Enter",
        macCmd: "Cmd+Enter",
    },
    {
        label: "Format/Prettify code",
        winCmd: "Ctrl+m",
        macCmd: "Cmd+m",
    },
];

const RowEntry = ({ label, winCmd, macCmd, isBgDark }: RowEntryType) => {
    return (
        <div className={`flex text-xs py-4 px-2 ${isBgDark ? "n-bg-neutral-20 rounded-xl" : ""}`}>
            <div className="flex-1 italic font-light">
                <span className="whitespace-break-spaces pr-6">{label}</span>
            </div>
            <span className="flex-1">{winCmd}</span>
            <span className="flex-1">{macCmd}</span>
        </div>
    );
};

export const Keybindings = ({ onClickClose, onClickBack }: Props): JSX.Element => {
    const screen = useContext(ScreenContext);
    const cmds = screen.view === Screen.EDITOR ? editorScreenCmds : schemaScreenCmds;

    return (
        <div data-test-help-drawer-keybindings-list>
            <div className="flex items-center justify-between">
                <button data-test-help-drawer-keybindings-back onClick={onClickBack} aria-label="Back to Help drawer">
                    <img src={ArrowLeft} alt="arrow left" className="inline w-5 h-5 text-lg cursor-pointer" />
                </button>
                <span className="h5">Keybindings</span>
                <span
                    className="text-lg cursor-pointer"
                    data-test-help-drawer-keybindings-close
                    onClick={onClickClose}
                    onKeyDown={onClickClose}
                    role="button"
                    tabIndex={0}
                >
                    {"\u2715"}
                </span>
            </div>
            <div className="flex flex-col pt-8">
                <div className="flex font-bold py-4 px-2">
                    <div className="flex-1">Editor action</div>
                    <div className="flex-1">Win/Linux</div>
                    <div className="flex-1">Mac</div>
                </div>
                {cmds.map((cmd, idx) => {
                    return (
                        <RowEntry
                            key={`${cmd.winCmd}-${idx}`}
                            label={cmd.label}
                            winCmd={cmd.winCmd}
                            macCmd={cmd.macCmd}
                            isBgDark={idx % 2 === 1}
                        />
                    );
                })}
            </div>
        </div>
    );
};

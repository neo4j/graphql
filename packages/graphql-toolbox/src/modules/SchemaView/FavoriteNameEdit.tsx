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

import { useState } from "react";
import { IconButton } from "@neo4j-ndl/react";
import { CheckIconOutline, PencilIconOutline } from "@neo4j-ndl/react/icons";

interface FavoriteNameEditProps {
    name: string;
    saveName: (newName: string) => void;
    onSelectFavorite: () => void;
}

export const FavoriteNameEdit = ({ name, saveName, onSelectFavorite }: FavoriteNameEditProps) => {
    const [editMode, setEditMode] = useState<boolean>(false);
    const [nameValue, setNameValue] = useState<string>(name);

    const _handleKeyDown = (event) => {
        if (event.key === "Enter") {
            setEditMode(false);
            saveName(nameValue);
        }
    };

    return (
        <>
            <div
                className="w-full"
                onClick={() => onSelectFavorite()}
                onKeyDown={() => onSelectFavorite()}
                role="button"
                tabIndex={0}
            >
                {editMode ? (
                    <input
                        className="w-60"
                        value={nameValue}
                        onChange={(event) => setNameValue(event.currentTarget.value)}
                        onKeyDown={_handleKeyDown}
                    />
                ) : (
                    <div className="truncate w-60">{name}</div>
                )}
            </div>
            {editMode ? (
                <IconButton
                    aria-label="Finish editing favorite name"
                    className={`border-none h-5 w-5`}
                    clean
                    onClick={() => {
                        setEditMode(false);
                        saveName(nameValue);
                    }}
                >
                    <CheckIconOutline />
                </IconButton>
            ) : (
                <IconButton
                    aria-label="Edit favorite name"
                    className={`border-none h-5 w-5`}
                    clean
                    onClick={() => setEditMode(true)}
                >
                    <PencilIconOutline />
                </IconButton>
            )}
        </>
    );
};

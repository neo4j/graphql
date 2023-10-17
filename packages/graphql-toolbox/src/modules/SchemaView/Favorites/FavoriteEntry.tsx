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

import { useEffect, useRef, useState } from "react";

import { tokens } from "@neo4j-ndl/base";
import { Checkbox, IconButton, TextInput } from "@neo4j-ndl/react";
import { CheckIconOutline, PencilIconOutline, PlayCircleIconOutline } from "@neo4j-ndl/react/icons";

import { useFavoritesStore } from "../../../store/favorites";
import type { Favorite } from "../../../types";

interface FavoriteEntryProps {
    favorite: Favorite;
    onSelectFavorite: (typeDefs: string) => void;
    updateName: (newName: string, id: string) => void;
    dragHandle: JSX.Element;
}

export const FavoriteEntry = ({ dragHandle, onSelectFavorite, favorite, updateName }: FavoriteEntryProps) => {
    const [editMode, setEditMode] = useState<boolean>(false);
    const [nameValue, setNameValue] = useState<string>(favorite.name);
    const inputRef = useRef<HTMLInputElement>(null);

    const finishEditingName = () => {
        setEditMode(false);

        // Ensure empty strings are reverted to previous name value
        if (nameValue === "") {
            setNameValue(favorite.name);
            return;
        }

        updateName(nameValue, favorite.id);
    };

    const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
        if (event.key === "Enter") {
            finishEditingName();
        }
    };

    const handleInputChange: React.ChangeEventHandler<HTMLInputElement> = (event) =>
        setNameValue(event.currentTarget.value);

    const handleCheckboxChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
        if (event.target.checked) {
            useFavoritesStore.getState().addSelectedFavorite(favorite.id);
        } else {
            useFavoritesStore.getState().removeSelectedFavorite(favorite.id);
        }
    };

    useEffect(() => {
        if (editMode && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.setSelectionRange(0, inputRef.current.value.length);
        }
    }, [editMode]);

    return (
        <li
            className={
                "favorite-entry flex justify-between items-center p-1 mb-1 cursor-pointer hover:n-bg-neutral-40 rounded"
            }
        >
            <div className="w-full flex items-center justify-start">
                <div className="show-on-hover">{dragHandle}</div>
                {editMode ? (
                    <TextInput
                        className="w-60"
                        value={nameValue}
                        ref={inputRef}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        size="extra-small"
                        aria-label="Input for new name for the favorite snippet"
                    />
                ) : (
                    <Checkbox
                        onChange={handleCheckboxChange}
                        checked={useFavoritesStore.getState().selectedFavorites.includes(favorite.id)}
                        className="w-full"
                        label={favorite.name}
                    />
                )}
            </div>

            <IconButton
                aria-label="Delete favorite"
                clean
                onClick={() => onSelectFavorite(favorite.typeDefs)}
                onKeyDown={() => onSelectFavorite(favorite.typeDefs)}
                className="show-on-hover"
            >
                <PlayCircleIconOutline color={tokens.colors.baltic[50]} />
            </IconButton>

            {editMode ? (
                <IconButton
                    aria-label="Finish editing favorite name"
                    className={`show-on-hover border-none h-5 w-5`}
                    clean
                    onClick={() => finishEditingName()}
                >
                    <CheckIconOutline />
                </IconButton>
            ) : (
                <IconButton
                    aria-label="Edit favorite name"
                    className={`show-on-hover border-none h-5 w-5`}
                    clean
                    onClick={() => setEditMode(true)}
                >
                    <PencilIconOutline />
                </IconButton>
            )}
        </li>
    );
};

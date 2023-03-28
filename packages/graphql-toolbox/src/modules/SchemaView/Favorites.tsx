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

import { IconButton } from "@neo4j-ndl/react";
import { CheckIconOutline, PencilIconOutline, TrashIconOutline } from "@neo4j-ndl/react/icons";
import type { Favorite } from "../../types";
import { Fragment, useState } from "react";
import { useStore } from "../../store";

interface NameComponentProps {
    name: string;
    saveName: (newName: string) => void;
    onSelectFavorite: () => void;
}

interface FavoritesProps {
    favorites: Favorite[] | null;
    setFavorites: (nextState: Favorite[] | null) => void;
    onSelectFavorite: (typeDefs: string) => void;
}

const ALTERNATE_BG_COLOR = "n-bg-neutral-20";

const NameComponent = ({ name, saveName, onSelectFavorite }: NameComponentProps) => {
    const [editMode, setEditMode] = useState<boolean>(false);
    const [nameValue, setNameValue] = useState<string>(name);

    const _handleKeyDown = (event) => {
        if (event.key === "Enter") {
            setEditMode(false);
            saveName(nameValue);
        }
    };

    return (
        <Fragment>
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
        </Fragment>
    );
};

export const Favorites = ({ favorites, setFavorites, onSelectFavorite }: FavoritesProps) => {
    const store = useStore();

    const deleteFavorite = (id: string): void => {
        const nextFavs = favorites?.filter((fav) => fav.id !== id) || null;
        setFavorites(nextFavs);
        store.setFavorites(nextFavs);
    };

    const updateName = (newName: string, id: string): void => {
        const nextFavs = favorites?.map((fav) => (fav.id === id ? { ...fav, name: newName } : fav)) || null;
        setFavorites(nextFavs);
        store.setFavorites(nextFavs);
    };

    return (
        <div className="flex flex-col w-full">
            <span className="h5">Favorites</span>
            {favorites?.length ? (
                <ul className="pt-3 h-favorite overflow-y-scroll">
                    {favorites.map((favorite, idx) => {
                        const isAlternateBackground = idx % 2 === 1;
                        return (
                            <li
                                key={favorite.id}
                                className={`flex justify-between items-center p-2 mb-1 cursor-pointer hover:n-bg-neutral-40 rounded ${
                                    isAlternateBackground ? ALTERNATE_BG_COLOR : ""
                                }`}
                            >
                                <NameComponent
                                    name={favorite.name}
                                    saveName={(newName) => updateName(newName, favorite.id)}
                                    onSelectFavorite={() => onSelectFavorite(favorite.typeDefs)}
                                />

                                <IconButton
                                    aria-label="Delete favorite"
                                    className="border-none h-5 w-5 n-text-danger-30 ml-3"
                                    clean
                                    onClick={() => deleteFavorite(favorite.id)}
                                >
                                    <TrashIconOutline />
                                </IconButton>
                            </li>
                        );
                    })}
                </ul>
            ) : null}
        </div>
    );
};

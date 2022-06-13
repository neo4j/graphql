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

import { HeroIcon } from "@neo4j-ndl/react";
import { Storage } from "../../utils/storage";
import { Favorite } from "../../types";
import { LOCAL_STATE_FAVORITES } from "src/constants";
import { Fragment, useState } from "react";

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
            <div className="w-full" onClick={() => onSelectFavorite()}>
                {editMode ? (
                    <input
                        className="w-64"
                        value={nameValue}
                        onChange={(event) => setNameValue(event.currentTarget.value)}
                        onKeyDown={_handleKeyDown}
                    />
                ) : (
                    <div className="truncate w-64">{name}</div>
                )}
            </div>
            {editMode ? (
                <HeroIcon
                    className="h-5 w-5"
                    iconName="CheckIcon"
                    type="outline"
                    onClick={() => {
                        setEditMode(false);
                        saveName(nameValue);
                    }}
                />
            ) : (
                <HeroIcon className="h-5 w-5" iconName="PencilIcon" type="outline" onClick={() => setEditMode(true)} />
            )}
        </Fragment>
    );
};

export const Favorites = ({ favorites, setFavorites, onSelectFavorite }: FavoritesProps) => {
    const deleteFavorite = (id: string): void => {
        const nextFavs = favorites?.filter((fav) => fav.id !== id) || null;
        setFavorites(nextFavs);
        Storage.storeJSON(LOCAL_STATE_FAVORITES, nextFavs);
    };

    const updateName = (newName: string, id: string): void => {
        const nextFavs = favorites?.map((fav) => (fav.id === id ? { ...fav, name: newName } : fav)) || null;
        setFavorites(nextFavs);
        Storage.storeJSON(LOCAL_STATE_FAVORITES, nextFavs);
    };

    return (
        <div className="flex flex-col w-full">
            <span className="h5">Favorites</span>
            {favorites?.length ? (
                <ul className="pt-2">
                    {favorites.map((favorite, idx) => {
                        return (
                            <li
                                key={favorite.id}
                                className={`flex justify-between items-center p-2 mb-1 cursor-pointer hover:n-bg-neutral-40 rounded ${
                                    idx % 2 === 1 ? "n-bg-neutral-20" : ""
                                }`}
                            >
                                <NameComponent
                                    name={favorite.name}
                                    saveName={(newName) => updateName(newName, favorite.id)}
                                    onSelectFavorite={() => onSelectFavorite(favorite.typeDefs)}
                                />

                                <HeroIcon
                                    className="h-5 w-5 n-text-danger-30 ml-3"
                                    iconName="TrashIcon"
                                    type="outline"
                                    onClick={() => deleteFavorite(favorite.id)}
                                />
                            </li>
                        );
                    })}
                </ul>
            ) : null}
        </div>
    );
};

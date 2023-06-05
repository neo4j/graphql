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

import { tokens } from "@neo4j-ndl/base";
import { IconButton } from "@neo4j-ndl/react";
import { StarIconOutline, TrashIconOutline } from "@neo4j-ndl/react/icons";

import { useStore } from "../../store";
import type { Favorite } from "../../types";
import { FavoriteNameEdit } from "./FavoriteNameEdit";

const ALTERNATE_BG_COLOR = "n-bg-neutral-20";

interface FavoritesProps {
    favorites: Favorite[] | null;
    onSelectFavorite: (typeDefs: string) => void;
}

export const Favorites = ({ favorites, onSelectFavorite }: FavoritesProps) => {
    const deleteFavorite = (id: string): void => {
        const nextFavs = favorites?.filter((fav) => fav.id !== id) || null;
        useStore.setState({ favorites: nextFavs });
    };

    const updateName = (newName: string, id: string): void => {
        const nextFavs = favorites?.map((fav) => (fav.id === id ? { ...fav, name: newName } : fav)) || null;
        useStore.setState({ favorites: nextFavs });
    };

    const EmptyState = (): JSX.Element => {
        return (
            <div className="flex flex-col items-center justify-center leading-6 n-text-neutral-60">
                <p>No favorites to display.</p>
                <p className="flex">
                    Click{" "}
                    <StarIconOutline
                        className="h-5 w-5 mx-1"
                        style={{
                            color: tokens.colors.neutral[60],
                        }}
                    />{" "}
                    to save type
                </p>
                <p>definitions as favorite.</p>
            </div>
        );
    };

    return (
        <div className="flex flex-col w-full px-6 pt-6">
            <span className="h5">Favorites</span>
            {favorites?.length ? (
                <ul className="py-4 h-favorite overflow-y-auto">
                    {favorites.map((favorite, idx) => {
                        const isAlternateBackground = idx % 2 === 1;
                        return (
                            <li
                                key={favorite.id}
                                className={`flex justify-between items-center p-2 mb-1 cursor-pointer hover:n-bg-neutral-40 rounded ${
                                    isAlternateBackground ? ALTERNATE_BG_COLOR : ""
                                }`}
                            >
                                <FavoriteNameEdit
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
            ) : (
                <div className="flex items-center justify-center pt-40">
                    <EmptyState />
                </div>
            )}
        </div>
    );
};

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
import { StarIconOutline } from "@neo4j-ndl/react/icons";

import { useStore } from "../../../store";
import { FavoriteEntry } from "./FavoriteEntry";

interface FavoritesProps {
    onSelectFavorite: (typeDefs: string) => void;
}

export const Favorites = ({ onSelectFavorite }: FavoritesProps) => {
    const favorites = useStore((store) => store.favorites);

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
                    {favorites.map((favorite, index) => (
                        <FavoriteEntry
                            onSelectFavorite={onSelectFavorite}
                            updateName={updateName}
                            deleteFavorite={deleteFavorite}
                            key={favorite.id}
                            favorite={favorite}
                            index={index}
                        />
                    ))}
                </ul>
            ) : (
                <div className="flex items-center justify-center pt-40">
                    <EmptyState />
                </div>
            )}
        </div>
    );
};

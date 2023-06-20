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

import type { DragEndEvent, UniqueIdentifier } from "@dnd-kit/core";
import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis, restrictToWindowEdges } from "@dnd-kit/modifiers";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { tokens } from "@neo4j-ndl/base";
import { IconButton } from "@neo4j-ndl/react";
import { ArrowDownTrayIconOutline, StarIconOutline, TrashIconOutline } from "@neo4j-ndl/react/icons";
import classNames from "classnames";

import { tracking } from "../../../analytics/tracking";
import { Screen } from "../../../contexts/screen";
import { useStore } from "../../../store";
import { useFavoritesStore } from "../../../store/favorites";
import type { Favorite } from "../../../types";
import { announcements } from "./announcements";
import { DeleteFavoritesDialog } from "./DeleteFavoritesDialog";
import { DragHandle } from "./DragHandle";
import { FavoriteEntry } from "./FavoriteEntry";
import { screenReaderInstructions } from "./screenReaderInstructions";

interface FavoritesProps {
    onSelectFavorite: (typeDefs: string) => void;
}

function favoritesToUniqueIdentifier(favorites: Favorite[] | null) {
    return favorites === null ? [] : favorites.map((favorite) => favorite.id);
}

export const Favorites = ({ onSelectFavorite }: FavoritesProps) => {
    const favorites = useStore((store) => store.favorites);
    const selectedFavorites = useFavoritesStore((store) => store.selectedFavorites);
    const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
    const [items, setItems] = useState<UniqueIdentifier[]>(favoritesToUniqueIdentifier(favorites));
    const [showConfirm, setShowConfirm] = useState<boolean>(false);
    const isFirstAnnouncement = useRef(true);
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
        useSensor(TouchSensor)
    );

    const updateName = (newName: string, id: string): void => {
        const updatedFavorites = favorites?.map((fav) => (fav.id === id ? { ...fav, name: newName } : fav)) || null;
        useStore.setState({ favorites: updatedFavorites });
    };

    const deleteSelectedFavorites = (): void => {
        const remainingFavorites = favorites?.filter((fav) => !selectedFavorites.includes(fav.id)) || null;
        tracking.trackDeleteFavorite({ screen: Screen.TYPEDEFS, numberOfDeleted: selectedFavorites.length });
        useFavoritesStore.setState({ selectedFavorites: [] });
        useStore.setState({ favorites: remainingFavorites });
    };

    const downloadSelectedFavorites = (): void => {
        const favoritesToDownload = favorites?.filter((fav) => selectedFavorites.includes(fav.id)) || [];
        favoritesToDownload.forEach((favorite) => {
            const file = new Blob([favorite.typeDefs], {
                type: "text/plain",
            });
            const downloadLink = document.createElement("a");
            downloadLink.href = URL.createObjectURL(file);
            downloadLink.download = `${encodeURI(favorite.name)}.txt`;
            document.body.appendChild(downloadLink); // Required for this to work in FireFox
            downloadLink.click();
            downloadLink.remove();
        });
        tracking.trackDownloadFavorites({ screen: Screen.TYPEDEFS, numberOfFiles: favoritesToDownload.length });
    };

    useEffect(() => {
        if (!activeId) {
            isFirstAnnouncement.current = true;
        }
    }, [activeId]);

    useEffect(() => {
        setItems(favoritesToUniqueIdentifier(favorites));
    }, [favorites]);

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

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveId(null);

        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = items.indexOf(active.id);
            const newIndex = items.indexOf(over.id);

            const newOrder = arrayMove(items, oldIndex, newIndex);
            const newFavorites: Favorite[] = [];
            for (const id of newOrder) {
                const favorite = favorites?.find((fav) => fav.id === id);
                if (favorite) {
                    newFavorites.push(favorite);
                }
            }
            useStore.setState({ favorites: newFavorites });
            setItems(newOrder);
        }
    };

    const SortableItem = ({ id }: { id: UniqueIdentifier }) => {
        const { attributes, listeners, setNodeRef, transform, setActivatorNodeRef, transition } = useSortable({ id });

        const style = {
            transform: CSS.Transform.toString(transform),
            transition,
        };

        const favorite = favorites?.find((favorite) => favorite.id === id);

        if (!favorite) {
            return null;
        }

        return (
            <div
                className={classNames(activeId === id && "item-dragging")}
                ref={setNodeRef}
                style={style}
                {...attributes}
            >
                <FavoriteEntry
                    dragHandle={
                        favorites && favorites.length > 1 ? (
                            <DragHandle {...listeners} ref={setActivatorNodeRef} />
                        ) : (
                            <div className="w-6"></div>
                        )
                    }
                    onSelectFavorite={onSelectFavorite}
                    updateName={updateName}
                    key={favorite.id}
                    favorite={favorite}
                />
            </div>
        );
    };

    return (
        <>
            <DeleteFavoritesDialog
                deleteSelectedFavorites={deleteSelectedFavorites}
                showConfirm={showConfirm}
                setShowConfirm={setShowConfirm}
            />

            <div className="flex flex-col w-full pl-4 pr-5 pt-6">
                <div className="flex h-9 justify-between">
                    <span className="h5 pl-6">Favorites</span>{" "}
                    <div>
                        <IconButton
                            aria-label="Download selected favorites"
                            className="border-none h-5 w-5 ml-3"
                            clean
                            disabled={selectedFavorites.length === 0}
                            onClick={() => downloadSelectedFavorites()}
                        >
                            <ArrowDownTrayIconOutline />
                        </IconButton>
                        <IconButton
                            aria-label="Delete selected favorites"
                            className="border-none h-5 w-5 n-text-danger-30 ml-3"
                            clean
                            disabled={selectedFavorites.length === 0}
                            onClick={() => setShowConfirm(true)}
                        >
                            <TrashIconOutline />
                        </IconButton>
                    </div>
                </div>
                {favorites?.length ? (
                    <DndContext
                        accessibility={{
                            announcements: announcements({ isFirstAnnouncement, items }),
                            screenReaderInstructions,
                        }}
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={({ active }) => {
                            if (!active) {
                                return;
                            }

                            setActiveId(active.id);
                        }}
                        onDragEnd={handleDragEnd}
                        onDragCancel={() => setActiveId(null)}
                        modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
                    >
                        <ul className="pb-4 h-favorite">
                            <SortableContext items={items}>
                                {items.map((id) => (
                                    <SortableItem key={id} id={id} />
                                ))}
                            </SortableContext>
                        </ul>
                    </DndContext>
                ) : (
                    <div className="flex items-center justify-center pt-40">
                        <EmptyState />
                    </div>
                )}
            </div>
        </>
    );
};

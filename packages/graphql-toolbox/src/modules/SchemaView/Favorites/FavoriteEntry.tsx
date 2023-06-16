import { useEffect, useRef, useState } from "react";

import { Checkbox, IconButton } from "@neo4j-ndl/react";
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
        updateName(nameValue, favorite.id);
    };

    const _handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
        if (event.key === "Enter") {
            finishEditingName();
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
                <div className="hover-show">{dragHandle}</div>
                {editMode ? (
                    <input
                        className="w-60"
                        value={nameValue}
                        ref={inputRef}
                        onChange={(event) => setNameValue(event.currentTarget.value)}
                        onKeyDown={_handleKeyDown}
                    />
                ) : (
                    <Checkbox
                        onChange={(event) => {
                            if (event.target.checked) {
                                useFavoritesStore.getState().addSelectedFavorite(favorite.id);
                            } else {
                                useFavoritesStore.getState().removeSelectedFavorite(favorite.id);
                            }
                        }}
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
                className="hover-show"
            >
                <PlayCircleIconOutline color={"#006FD6"} />
            </IconButton>

            {editMode ? (
                <IconButton
                    aria-label="Finish editing favorite name"
                    className={`hover-show border-none h-5 w-5`}
                    clean
                    onClick={() => finishEditingName()}
                >
                    <CheckIconOutline />
                </IconButton>
            ) : (
                <IconButton
                    aria-label="Edit favorite name"
                    className={`hover-show border-none h-5 w-5`}
                    clean
                    onClick={() => setEditMode(true)}
                >
                    <PencilIconOutline />
                </IconButton>
            )}
        </li>
    );
};

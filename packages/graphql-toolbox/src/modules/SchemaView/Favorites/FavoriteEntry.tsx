import { IconButton } from "@neo4j-ndl/react";
import { TrashIconOutline } from "@neo4j-ndl/react/icons";
import classNames from "classnames";

import type { Favorite } from "../../../types";
import { FavoriteNameEdit } from "../FavoriteNameEdit";

const ALTERNATE_BG_COLOR = "n-bg-neutral-20";

interface FavoriteEntryProps {
    favorite: Favorite;
    index: number;
    onSelectFavorite: (typeDefs: string) => void;
    deleteFavorite: (id: string) => void;
    updateName: (newName: string, id: string) => void;
}

export const FavoriteEntry = ({
    onSelectFavorite,
    favorite,
    index,
    deleteFavorite,
    updateName,
}: FavoriteEntryProps) => {
    const isAlternateBackground = index % 2 === 1;
    return (
        <li
            className={classNames(
                "flex justify-between items-center p-2 mb-1 cursor-pointer hover:n-bg-neutral-40 rounded",
                isAlternateBackground && ALTERNATE_BG_COLOR
            )}
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
};

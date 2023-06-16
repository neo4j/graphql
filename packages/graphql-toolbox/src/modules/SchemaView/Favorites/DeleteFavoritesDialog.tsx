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

import { Button, Dialog } from "@neo4j-ndl/react";

interface DeleteFavoritesDialogProps {
    showConfirm: boolean;
    setShowConfirm: React.Dispatch<React.SetStateAction<boolean>>;
    deleteSelectedFavorites: () => void;
}

export const DeleteFavoritesDialog = ({
    showConfirm,
    setShowConfirm,
    deleteSelectedFavorites,
}: DeleteFavoritesDialogProps) => {
    return (
        <Dialog open={showConfirm} id="default-menu" type="danger">
            <Dialog.Header>Delete selected favorites?</Dialog.Header>
            <Dialog.Content>Deleting saved favorites can not be undone.</Dialog.Content>
            <Dialog.Actions>
                <Button color="neutral" fill="outlined" onClick={() => setShowConfirm(false)} size="large">
                    Cancel
                </Button>
                <Button
                    onClick={() => {
                        deleteSelectedFavorites();
                        setShowConfirm(false);
                    }}
                    size="large"
                >
                    Delete
                </Button>
            </Dialog.Actions>
        </Dialog>
    );
};

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
            <Dialog.Header>Delete selected items?</Dialog.Header>
            <Dialog.Content>Deleting saved snippets can not be undone.</Dialog.Content>
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

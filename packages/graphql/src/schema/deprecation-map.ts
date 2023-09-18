import { CreateInfo } from "../graphql/objects/CreateInfo";
import { DeleteInfo } from "../graphql/objects/DeleteInfo";
import { UpdateInfo } from "../graphql/objects/UpdateInfo";

export const deprecationMap = new Map<
    string,
    {
        field: string;
        reason: string;
        deprecatedFromVersion: string;
        toBeRemovedInVersion: string;
    }[]
>([
    [
        CreateInfo.name,
        [
            {
                field: "bookmark",
                reason: "This field has been deprecated because bookmarks are now handled by the driver.",
                deprecatedFromVersion: "",
                toBeRemovedInVersion: "",
            },
        ],
    ],
    [
        UpdateInfo.name,
        [
            {
                field: "bookmark",
                reason: "This field has been deprecated because bookmarks are now handled by the driver.",
                deprecatedFromVersion: "",
                toBeRemovedInVersion: "",
            },
        ],
    ],
    [
        DeleteInfo.name,
        [
            {
                field: "bookmark",
                reason: "This field has been deprecated because bookmarks are now handled by the driver.",
                deprecatedFromVersion: "",
                toBeRemovedInVersion: "",
            },
        ],
    ],
]);

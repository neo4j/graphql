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

import type { Announcements, UniqueIdentifier } from "@dnd-kit/core";

interface AnnouncementsProps {
    isFirstAnnouncement: React.MutableRefObject<boolean>;
    items: UniqueIdentifier[];
}

export const announcements = ({ isFirstAnnouncement, items }: AnnouncementsProps): Announcements => {
    const getIndex = (id: UniqueIdentifier) => items.indexOf(id);
    const getPosition = (id: UniqueIdentifier) => getIndex(id) + 1;
    return {
        onDragStart({ active: { id } }) {
            return `Picked up sortable item ${String(id)}. Sortable item ${id} is in position ${getPosition(id)} of ${
                items.length
            }`;
        },
        onDragOver({ active, over }) {
            // In this specific use-case, the picked up item's `id` is always the same as the first `over` id.
            // The first `onDragOver` event therefore doesn't need to be announced, because it is called
            // immediately after the `onDragStart` announcement and is redundant.
            if (isFirstAnnouncement.current === true) {
                isFirstAnnouncement.current = false;
                return;
            }

            if (over) {
                return `Sortable item ${active.id} was moved into position ${getPosition(over.id)} of ${items.length}`;
            }

            return;
        },
        onDragEnd({ active, over }) {
            if (over) {
                return `Sortable item ${active.id} was dropped at position ${getPosition(over.id)} of ${items.length}`;
            }

            return;
        },
        onDragCancel({ active: { id } }) {
            return `Sorting was cancelled. Sortable item ${id} was dropped and returned to position ${getPosition(
                id
            )} of ${items.length}.`;
        },
    };
};

import { forwardRef } from "react";

import { IconButton } from "@neo4j-ndl/react";
import { DragIcon } from "@neo4j-ndl/react/icons";

export const DragHandle = forwardRef<HTMLButtonElement>(function DragHandle(props, ref) {
    const { ...rest } = props;

    return (
        <IconButton
            aria-label="Reorder favorite snippet"
            ref={ref}
            clean
            size="extra-small"
            style={{ cursor: "grab" }}
            {...rest}
        >
            <DragIcon />
        </IconButton>
    );
});

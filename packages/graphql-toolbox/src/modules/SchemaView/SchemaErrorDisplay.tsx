import { Fragment } from "react";
import { GraphQLError } from "graphql";

interface Props {
    error: string | GraphQLError;
}

export const SchemaErrorDisplay = ({ error }: Props) => {
    if (!error) return null;

    return (
        <div
            className="mt-1 mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative"
            role="alert"
        >
            {typeof error === "string" ? (
                <span className="block">{error}</span>
            ) : (
                <Fragment>
                    <span className="block">{error.message}</span>
                    {error.locations ? (
                        <span className="block">Locations: {JSON.stringify(error.locations)}</span>
                    ) : null}
                </Fragment>
            )}
        </div>
    );
};

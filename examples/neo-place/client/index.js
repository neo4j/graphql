import { createClient, defaultExchanges, subscriptionExchange, gql } from "urql";
import { pipe, subscribe } from "wonka";
import { createClient as createWSClient } from "graphql-ws";

import CanvasApi from "./canvas-api";

let color = "#FFFFFF";
const buttons = [
    ["red-button", "#FF0000"],
    ["blue-button", "#0000FF"],
    ["white-button", "#FFFFFF"],
    ["black-button", "#000000"],
    ["green-button", "#00FF00"],
];

for (const buttonAndColor of buttons) {
    const button = document.getElementById(buttonAndColor[0]);
    button.onclick = () => {
        selectColor(buttonAndColor[1]);
    };
}

function selectColor(newColor) {
    color = newColor;
}

let wsUrl = "ws://localhost:4000/graphql";

if (process.env.NODE_ENV === "production") {
    wsUrl = "ws://team-graphql.uc.r.appspot.com/graphql";
}

console.log(wsUrl);

const wsClient = createWSClient({
    url: wsUrl,
});

const client = createClient({
    url: "/graphql",
    exchanges: [
        ...defaultExchanges,
        subscriptionExchange({
            forwardSubscription: (operation) => ({
                subscribe: (sink) => ({
                    unsubscribe: wsClient.subscribe(operation, sink),
                }),
            }),
        }),
    ],
});

const updatePixelQuery = gql`
    mutation UpdatePixels($update: PixelUpdateInput, $where: PixelWhere) {
        updatePixels(update: $update, where: $where) {
            pixels {
                position
                color
            }
        }
    }
`;

const canvasApi = new CanvasApi("place", 10, (pixelClicked) => {
    canvasApi.drawPixel(pixelClicked, color);
    const params = {
        update: {
            color: color,
        },
        where: {
            position: [pixelClicked[0], pixelClicked[1]],
        },
    };
    client.mutation(updatePixelQuery, params).toPromise();
});

const canvasQuery = gql`
    query Canvas {
        canvas
    }
`;

client
    .query(canvasQuery)
    .toPromise()
    .then((result) => {
        console.log(result.data.canvas);
        let i = 0;
        let j = 0;
        for (const pixel of result.data.canvas) {
            canvasApi.drawPixel([i, j], pixel);
            j++;
            if (j === 30) {
                i++;
                j = 0;
            }
        }
    });

const pixelsSubscription = gql`
    subscription Subscription {
        pixelUpdated {
            updatedPixel {
                position
                color
            }
        }
    }
`;

const { unsubscribe } = pipe(
    client.subscription(pixelsSubscription),
    subscribe((result) => {
        const updatedPixel = result.data.pixelUpdated.updatedPixel;

        canvasApi.drawPixel(updatedPixel.position, updatedPixel.color);
    })
);

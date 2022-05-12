import {
    createClient,
    defaultExchanges,
    subscriptionExchange,
    gql
} from 'urql';
import {
    pipe,
    subscribe
} from 'wonka';
import {
    createClient as createWSClient
} from 'graphql-ws';

import CanvasApi from './canvas-api';

let color = "#000000"
const buttons = [
    ["red-button", "#FF0000"],
    ["blue-button", "#0000FF"]
]

for (const buttonAndColor of buttons) {
    const button = document.getElementById(buttonAndColor[0]);
    console.log(buttonAndColor, button);
    button.onclick = () => {
        selectColor(buttonAndColor[1])
    }
}


function selectColor(newColor) {
    color = newColor
}

const wsClient = createWSClient({
    url: 'ws://localhost:4000/graphql',
    url: 'ws://04b1-217-138-127-202.ngrok.io/graphql',
});

const client = createClient({
    url: '/graphql',
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
    canvasApi.drawPixel(pixelClicked, color)
    const params = {
        update: {
            color: color
        },
        where: {
            position: [`${pixelClicked[0]}`, `${pixelClicked[1]}`]
        }
    }
    client
        .mutation(updatePixelQuery, params)
        .toPromise()
        .then(result => {
            console.log(result)

        });
})


const pixelsQuery = gql`
query Pixels {
  pixels {
    position
    color
  }
}
`;

client
    .query(pixelsQuery)
    .toPromise()
    .then(result => {

        for (const pixel of result.data.pixels) {
            canvasApi.drawPixel(pixel.position, pixel.color)
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

const {
    unsubscribe
} = pipe(
    client.subscription(pixelsSubscription),
    subscribe(result => {
        const updatedPixel = result.data.pixelUpdated.updatedPixel

        canvasApi.drawPixel(updatedPixel.position, updatedPixel.color)
    })
);

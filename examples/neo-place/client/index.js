import CanvasApi from "./canvas-api";
import GraphQLServerApi from "./graphql-server-api";

const LOCAL_GRAPHQL_SERVER_URI_BASE = "localhost:4000/graphql";

let selectedColor = "#FFFFFF";
const buttons = ["#000000", "#FFFFFF", "#CC254B", "#018BFF", "#327D60", "#FFDE63"];

function setupButtons() {
    function selectColor(newColor) {
        selectedColor = newColor;
    }

    for (const buttonColor of buttons) {
        const buttonWrapper = document.querySelector(".buttons-wrap");
        const button = document.createElement("button");
        button.classList.add("button-class");
        buttonWrapper.appendChild(button);
        button.style.backgroundColor = buttonColor;

        button.onclick = () => {
            selectColor(buttonColor);
        };
    }
}

let wsUrl = `ws://${LOCAL_GRAPHQL_SERVER_URI_BASE}`;
let url = `http://${LOCAL_GRAPHQL_SERVER_URI_BASE}`;

if (process.env.NODE_ENV === "production") {
    wsUrl = "wss://team-graphql.uc.r.appspot.com/graphql";
    url = "/graphql";
}

console.log("Url:", url);
console.log("WS Url:", wsUrl);

const serverApi = new GraphQLServerApi({
    url,
    wsUrl,
});
const canvasApi = new CanvasApi("place", 10);

async function setupCanvas() {
    const canvasState = await serverApi.getCanvas();

    let i = 0,
        j = 0;
    for (const pixelColor of canvasState) {
        canvasApi.drawPixel([i, j], pixelColor);
        j++;
        if (j === 30) {
            i++;
            j = 0;
        }
    }
}

let eventsBackflow = [];
let canvasLock = true;

serverApi.onPixelUpdate((updatedEvent) => {
    const updatedPixel = updatedEvent.updatedPixel;
    eventsBackflow.push(updatedPixel);
    if (!canvasLock) drawBackflow(eventsBackflow);
});

let errored = false;
serverApi.onConnected(async () => {
    canvasLock = true;
    await setupCanvas();
    drawBackflow(eventsBackflow);
    if (!errored) handleConnect();
});

function handleDisconnect() {
    errored = true;
    canvasLock = true;
    const buttonWrapper = document.querySelector(".buttons-wrap");
    const disconnectedMessage = document.querySelector(".disconnected-message");
    buttonWrapper.style.display = "none";
    disconnectedMessage.hidden = false;
    canvasApi.grayscale();
}

function handleConnect() {
    const buttonWrapper = document.querySelector(".buttons-wrap");
    const loader = document.querySelector(".loader");
    const canvas = document.querySelector("#place");
    buttonWrapper.style.display = "flex";
    loader.hidden = true;
    canvas.hidden = false;
    canvasLock = false;
}

serverApi.onClosed(async () => {
    handleDisconnect();
});

function drawBackflow(pixels) {
    for (const pixel of pixels) {
        canvasApi.drawPixel(pixel.position, pixel.color);
    }
    eventsBackflow = [];
}

setupButtons();
canvasApi.onPixelClicked((pixelClicked) => {
    if (!canvasLock) {
        canvasApi.drawPixel(pixelClicked, selectedColor);
        serverApi.updatePixel(pixelClicked, selectedColor).then((res) => {
            if (res.error) {
                handleDisconnect();
            }
        });
    }
});

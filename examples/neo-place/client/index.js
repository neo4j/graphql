import CanvasApi from "./canvas-api";
import GraphQLServerApi from "./graphql-server-api";

let selectedColor = "#FFFFFF";
const buttons = [
    "#000000",
    "#FFFFFF",
    "#CC254B",
    "#018BFF",
    "#327D60",
    "#FFDE63",
];

function setupButtons() {
    function selectColor(newColor) {
        selectedColor = newColor;
    }

    for (const buttonColor of buttons) {
        const buttonWrapper = document.querySelector(".buttons-wrap");
        const button = document.createElement("button");
        button.classList.add("button-class")
        buttonWrapper.appendChild(button);
        button.style.backgroundColor = buttonColor;

        button.onclick = () => {
            selectColor(buttonColor);
        };
    }

}

let wsUrl = "ws://localhost:4000/graphql";
const url = "/graphql"
if (process.env.NODE_ENV === "production") {
    wsUrl = "ws://team-graphql.uc.r.appspot.com/graphql";
}

console.log("Url:", url)
console.log("WS Url:", wsUrl);
const serverApi = new GraphQLServerApi({
    url,
    wsUrl,
    onConnected:()=>{}
});
const canvasApi = new CanvasApi("place", 10)

async function setupCanvas() {
    const canvas = await serverApi.getCanvas();

    let i = 0;
    let j = 0;
    for (const pixel of canvas) {
        canvasApi.drawPixel([i, j], pixel);
        j++;
        if (j === 30) {
            i++;
            j = 0;
        }
    }
}

let eventsBackflow = [];
let canvasReady = false

serverApi.onPixelUpdate((updatedEvent) => {
    const updatedPixel = updatedEvent.updatedPixel;
    eventsBackflow.push(updatedPixel);
    drawBackflow(eventsBackflow);
})

function drawBackflow() {
    if (canvasReady) {
        for (pixel of pixels) {
            canvasApi.drawPixel(pixel.position, pixel.color);
        }
        eventsBackflow = [];
    }
}

setupButtons()
setupCanvas().then(() => {
    drawBackflow();
    canvasApi.onPixelClicked((pixelClicked) => {
        canvasApi.drawPixel(pixelClicked, selectedColor);
        serverApi.updatePixel(pixelClicked, selectedColor);
    })

    serverApi.onPixelUpdate((updatedEvent) => {
        const updatedPixel = updatedEvent.updatedPixel;

        canvasApi.drawPixel(updatedPixel.position, updatedPixel.color);
    })
})

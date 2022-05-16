module.exports = class CanvasApi {
    constructor(id, pixelScale, onPixelClicked) {
        this.canvas = document.getElementById(id);
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        this.pixelScale = pixelScale
        this.onPixelClicked = onPixelClicked

        this.canvas.addEventListener('click', (ev) => this.onClick(ev), false);
    }


    drawPixel(pixel, color) {
        const x0 = pixel[0] * this.pixelScale;
        const y0 = pixel[1] * this.pixelScale;
        this.ctx.fillStyle = color
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.fillRect(x0, y0, this.pixelScale, this.pixelScale);
    }

    onClick(ev) {
        const pixelClicked = this.getCanvasPixel([event.clientX, event.clientY])
        this.onPixelClicked(pixelClicked)
    }


    getCanvasPixel(screenPixel) {
        let rect = this.canvas.getBoundingClientRect();
        let x = screenPixel[0] - parseInt(rect.left);
        let y = screenPixel[1] - parseInt(rect.top);

        return [parseInt(x / this.pixelScale), parseInt(y / this.pixelScale)]
    }
}

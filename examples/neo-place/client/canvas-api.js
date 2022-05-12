module.exports = class CanvasApi {
    constructor(id, pixelScale, onPixelClicked) {
        this.canvas = document.getElementById(id);
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        this.pixelScale = pixelScale
        this.onPixelClicked = onPixelClicked
        // ctx.fillStyle = 'green';
        // ctx.fillRect(0, 0, canvas.width, canvas.height);
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
        let rect = this.canvas.getBoundingClientRect();
        let x = event.clientX - parseInt(rect.left);
        let y = event.clientY - parseInt(rect.top);

        const pixelClicked = [parseInt(x / this.pixelScale), parseInt(y / this.pixelScale)]
        this.onPixelClicked(pixelClicked)
    }


}

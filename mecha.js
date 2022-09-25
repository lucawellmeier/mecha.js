class Game {
    constructor(canvasID) {
        var canvas = document.getElementById(canvasID);
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
    }
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }
    drawRect(color,x,y,w,h) {
        this.ctx.beginPath();
        this.ctx.rect(x, y, w, h);
        this.ctx.fillStyle = color;
        this.ctx.fill();
        this.ctx.closePath();
    }
    drawBall(color,x,y,r) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, Math.PI*2);
        this.ctx.fillStyle = color;
        this.ctx.fill();
        this.ctx.closePath();
    }
    write(color,font,x,y,text) {
        this.ctx.font = font;
        this.ctx.fillStyle = color;
        this.ctx.fillText(text, x, y);
    }
}
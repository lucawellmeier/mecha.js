class Entity {
    constructor(game) {
        this.game = game;
        this.components = {}
    }

    update() {
        Object.values(this.components).forEach(comp => {
            comp.update();
        });
    }
    draw() {
        Object.values(this.components).forEach(comp => {
            comp.draw();
        });
    }

    add(compObj) {
        compObj.entity = this;
        this.components[compObj.name] = compObj;
    }
    get(comp) {
        return this.components[comp];
    }
    remove(comp) {
        delete this.components[comp];
    }
    has(comp) {
        return Object.keys(this.components).includes(comp);
    }
}

class Component {
    constructor(name) {
        this.name = name;
        this.game = game;
        this.entity = null;
    }
    update() {}
    draw() {}
}

class Transform extends Component {
    constructor(cx, cy, vx = 0, vy = 0) {
        super('transform');
        this.cx = cx; this.cy = cy;
        this.vx = vx; this.vy = vy;
    }
    update() {
        this.cx += this.vx;
        this.cy += this.vy;
    }
}

class AABB extends Component {
    constructor(w, h) {
        super('aabb');
        this.w = w; this.h = h;
    }
    get x() { return this.entity.get('transform').cx - this.w/2 }
    get y() { return this.entity.get('transform').cy - this.h/2 }
    intersects(other) {
        return other.x <= this.x + this.w
            && other.x + other.w >= this.x 
            && other.y <= this.y + this.h
            && other.y + other.h >= this.y;
    }
}

class BoxShape extends Component {
    constructor(color) { 
        super('boxshape');
        this.color = color;
    }
    draw() {
        var aabb = this.entity.get('aabb');
        this.game.drawRect(this.color, aabb.x, aabb.y, aabb.w, aabb.h);
    }
}

class BallShape extends Component {
    constructor(color) { 
        super('ballshape');
        this.color = color;
    }
    draw() {
        var transform = this.entity.get('transform');
        var w = this.entity.get('aabb').w;
        this.game.drawBall(this.color, transform.cx, transform.cy, w/2);
        // TODO: this should be code for creating an ellipse... height could be different from width
    }
}

class Game {
    constructor(canvasID) {
        var canvas = document.getElementById(canvasID);
        this.ctx = canvas.getContext("2d");
        this.width = canvas.width;
        this.height = canvas.height;
        this.keyState = {};
        this.entities = [];
    }

    createEntity() {
        var entity = new Entity(this);
        this.entities.push(entity);
        return entity;
    }
    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.entities.forEach(e => {
            e.draw();
        });
    }

    registerKey(key) {
        this.keyState[key] = false;
    }
    _keyDownHandler(e) {
        if (Object.keys(this.keyState).includes(e.key)) {
            this.keyState[e.key] = true
        }
    }
    _keyUpHandler(e) {
        if (Object.keys(this.keyState).includes(e.key)) {
            this.keyState[e.key] = false
        }
    }
    initKeyListeners() {
        document.addEventListener("keydown", this._keyDownHandler.bind(this), false);
        document.addEventListener("keyup", this._keyUpHandler.bind(this), false);
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
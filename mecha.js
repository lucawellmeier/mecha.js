class Entity {
    constructor(game, type) {
        this.game = game;
        this.type = type;
        this.components = {}
    }

    init() {
        Object.values(this.components).forEach(comp => {
            comp.init();
        });
    }
    logic() {
        Object.values(this.components).forEach(comp => {
            comp.logic();
        });
    }
    transform() {
        Object.values(this.components).forEach(comp => {
            comp.transform();
        });
        // TODO: transform components need to be the last in these loop
    }
    draw() {
        Object.values(this.components).forEach(comp => {
            comp.draw();
        });
    }

    add(compObj) {
        compObj.game = this.game;
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
        this.game = null;
        this.entity = null;
    }
    init() {}
    logic() {}
    transform() {}
    draw() {}
}

// TODO: make transform must-have for every object and provide quick access
// in entities and components
class Transform extends Component {
    constructor(cx, cy, angle = 0) {
        super("transform");
        this.cx = cx; this.cy = cy;
        this.vx = 0; this.vy = 0;
        this.angle = angle;
        this.dangle = 0;
    }
    transform() {
        this.cx += this.vx;
        this.cy += this.vy;
        this.vx = 0;
        this.vy = 0;

        this.angle += this.dangle;
        this.dangle = 0;
    }
}

class BoxGeometry extends Component {
    constructor(halfW, halfH, color=null) {
        super("boxgeometry");
        this.halfW = halfW;
        this.halfH = halfH;
        this.color = color;
    }

    get collider() {
        var t = this.entity.get("transform");
        var x = new Vector(1, 0);
        x.rotate(t.angle);
        return new Box(new Vector(t.cx, t.cy), this.halfW, this.halfH, x);
    }

    draw() {
        if (this.color !== null) {
            var t = this.entity.get("transform");
            this.game.drawRect(this.color, 
                t.cx - this.halfW, t.cy - this.halfH, 
                2*this.halfW, 2*this.halfH, t.angle);
        }
    }
}

class BallGeometry extends Component {
    constructor(radius, color=null) {
        super("ballgeometry");
        this.radius = radius;
        this.color = color;
    }

    get collider() {
        var t = this.entity.get("transform");
        return new Ball(new Vector(t.cx, t.cy), this.radius);
    }

    draw() {
        if (this.color !== null) {
            var t = this.entity.get("transform");
            this.game.drawBall(this.color, t.cx, t.cy, this.radius);
        }
    }
}



class AABB extends Component {
    constructor(w, h) {
        super("aabb");
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
    sweepInto(other) {
        var t = this.entity.get("transform");
        var ot = other.entity.get("transform");
        var scaleX = 1.0 / t.vx;
        var scaleY = 1.0 / t.vy;
        var signX = Math.sign(scaleX);
        var signY = Math.sign(scaleY);
        var nearTimeX = (ot.cx - signX * (this.w/2 + other.w/2) - t.cx) * scaleX;
        var nearTimeY = (ot.cy - signY * (this.h/2 + other.h/2) - t.cy) * scaleY;
        var farTimeX = (ot.cx + signX * (this.w/2 + other.w/2) - t.cx) * scaleX;
        var farTimeY = (ot.cy + signY * (this.h/2 + other.h/2) - t.cy) * scaleY;     

        if (nearTimeX > farTimeY || nearTimeY > farTimeX) return 1;
        var nearTime = nearTimeX > nearTimeY ? nearTimeX : nearTimeY;
        var farTime = farTimeX < farTimeY ? farTimeX : farTimeY;
        if (nearTime >= 1 || farTime <= 0) return 1;
        return Math.max(nearTime, 0);
    }
}

class BoxShape extends Component {
    constructor(color) { 
        super("boxshape");
        this.color = color;
    }
    draw() {
        var aabb = this.entity.get("aabb");
        this.game.drawRect(this.color, aabb.x, aabb.y, aabb.w, aabb.h, 0);
    }
}

class BallShape extends Component {
    constructor(color) { 
        super("ballshape");
        this.color = color;
    }
    draw() {
        var transform = this.entity.get('transform');
        var w = this.entity.get("aabb").w;
        this.game.drawBall(this.color, transform.cx, transform.cy, w/2);
        // TODO: this should be code for creating an ellipse... height could be different from width
    }
}

class TextDisplay extends Component {
    constructor(color, font, text) {
        super("textdisplay");
        this.color = color;
        this.font = font;
        this.text = text;
    }
    draw() {
        var transform = this.entity.get('transform');
        this.game.drawText(this.color, this.font, this.text, transform.cx, transform.cy);
    }
}

class Game {
    constructor(canvasID) {
        var canvas = document.getElementById(canvasID);
        this.ctx = canvas.getContext("2d");
        this.ctx.textAlign = "center";
        this.width = canvas.width;
        this.height = canvas.height;
        this.keyState = {};
        this.entities = [];
        this.toBeDeleted = [];
    }

    createEntity(type="") {
        var entity = new Entity(this, type);
        this.entities.push(entity);
        return entity;
    }
    destroyEntity(target) {
        this.toBeDeleted.push(target);
        
    }
    init() {
        this.entities.forEach(e => {
            e.init();
        });
    }
    // TODO: pass a renderer object as parameter to each draw function
    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.entities.forEach(e => {
            e.draw();
        });
    }
    logic() {
        this.entities.forEach(e => {
            e.logic();
        });
    }
    transform() {
        this.entities.forEach(e => {
            e.transform();
        });
    }
    _mainloop() {
        this.draw();
        this.logic();

        this.toBeDeleted.forEach(target => {
            this.entities = this.entities.filter(e => e !== target);
            Object.keys(target.components).forEach(c => {
                target.remove(c);
            });
            target.game = null;
            target.type = "";
        });
        this.toBeDeleted = [];

        this.transform();
        requestAnimationFrame(this._mainloop.bind(this));
    }
    run() {
        document.addEventListener("keydown", this._keyDownHandler.bind(this), false);
        document.addEventListener("keyup", this._keyUpHandler.bind(this), false);
        this.init();
        this._mainloop();
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

    drawRect(color,x,y,w,h,angle) {
        this.ctx.save();
        this.ctx.translate(x + w/2, y + h/2);
        this.ctx.rotate(angle);
        this.ctx.beginPath();
        this.ctx.rect(-w/2, -h/2, w, h);
        this.ctx.fillStyle = color;
        this.ctx.fill();
        this.ctx.closePath();
        this.ctx.restore();
    }
    drawBall(color,x,y,r) {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, Math.PI*2);
        this.ctx.fillStyle = color;
        this.ctx.fill();
        this.ctx.closePath();
        this.ctx.restore();
    }
    drawText(color,font,text,x,y) {
        this.ctx.save();
        this.ctx.font = font;
        this.ctx.fillStyle = color;
        this.ctx.fillText(text, x, y);
        this.ctx.restore();
    }
}
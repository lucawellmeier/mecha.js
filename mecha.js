class Entity {
    constructor(game, type, transform = new Transform()) {
        this.game = game;
        this.type = type;
        this.transform = transform;
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
        this.transform.update();
    }
    draw() {
        Object.values(this.components).forEach(comp => {
            comp.draw();
        });
    }

    add(compObj) {
        compObj.game = this.game;
        compObj.entity = this;
        compObj.transform = this.transform;
        this.components[compObj.name] = compObj;
    }
    get(c) { return this.components[c]; }
    remove(c) { delete this.components[c]; }
    has(c) { return Object.keys(this.components).includes(c); }
}

class Component {
    constructor(name) {
        this.name = name;
        this.game = null;
        this.entity = null;
        this.transform = null;
    }
    init() {}
    logic() {}
    draw() {}
}

// TODO: make transform must-have for every object and provide quick access
// in entities and components
class Transform {
    constructor(cx = 0, cy = 0, angle = 0) {
        this.cx = cx; this.cy = cy;
        this.vx = 0; this.vy = 0;
        this.angle = angle;
        this.dangle = 0;
    }
    update() {
        this.cx += this.vx;
        this.cy += this.vy;
        this.angle += this.dangle;
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
        var x = new Vector(1, 0);
        x.rotate(this.transform.angle);
        return new Box(new Vector(this.transform.cx, this.transform.cy), 
            this.halfW, this.halfH, x);
    }

    draw() {
        if (this.color !== null) {
            var t = this.entity.get("transform");
            this.game.drawRect(this.color, 
                this.transform.cx - this.halfW, 
                this.transform.cy - this.halfH, 
                2*this.halfW, 2*this.halfH, 
                this.transform.angle);
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
        return new Ball(new Vector(this.transform.cx, this.transform.cy), 
            this.radius);
    }

    draw() {
        if (this.color !== null) {
            this.game.drawBall(this.color, 
                this.transform.cx, this.transform.cy, this.radius);
        }
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
        this.game.drawText(this.color, this.font, this.text, 
            this.transform.cx, this.transform.cy);
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

    createEntity(cx, cy, angle=0, type="") {
        var entity = new Entity(this, type, new Transform(cx, cy, angle));
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
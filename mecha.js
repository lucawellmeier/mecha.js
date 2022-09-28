class Transform {
    constructor(pos = Vector.zero, angle = 0) {
        this.pos = pos.clone;
        this.v = Vector.zero.clone;
        this.angle = angle;
        this.dangle = 0;
    }

    update() {
        this.pos.add(this.v);
        this.angle += this.dangle;
    }
}

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

class BoxGeometry extends Component {
    constructor(halfW, halfH, color=null) {
        super("boxgeometry");
        this.halfW = halfW;
        this.halfH = halfH;
        this.color = color;
    }

    get collider() {
        return new Box(this.transform.pos, 
            this.halfW, this.halfH, 
            Vector.e1.clone.rotate(this.transform.angle));
    }

    draw() {
        if (this.color !== null) {
            var half = new Vector(this.halfW, this.halfH);
            this.game.drawRect(this.color, 
                subtract(this.transform.pos, half), 
                2 * this.halfW, 2 * this.halfH, 
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
        return new Ball(this.transform.pos, this.radius);
    }

    draw() {
        if (this.color !== null) {
            this.game.drawBall(this.color, 
                this.transform.pos, this.radius);
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
        this.game.drawText(this.color, this.font, 
            this.text, this.transform.pos);
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

    createEntity(pos=Vector.zero, angle=0, type="") {
        var entity = new Entity(this, type, new Transform(pos, angle));
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

    drawRect(color,pos,w,h,angle) {
        this.ctx.save();
        this.ctx.translate(pos.x + w/2, pos.y + h/2);
        this.ctx.rotate(angle);
        this.ctx.beginPath();
        this.ctx.rect(-w/2, -h/2, w, h);
        this.ctx.fillStyle = color;
        this.ctx.fill();
        this.ctx.closePath();
        this.ctx.restore();
    }
    drawBall(color,pos,r) {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, r, 0, Math.PI*2);
        this.ctx.fillStyle = color;
        this.ctx.fill();
        this.ctx.closePath();
        this.ctx.restore();
    }
    drawText(color,font,text,pos) {
        this.ctx.save();
        this.ctx.font = font;
        this.ctx.fillStyle = color;
        this.ctx.fillText(text, pos.x, pos.y);
        this.ctx.restore();
    }
}
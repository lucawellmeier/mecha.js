function clamp(x, min, max) { return Math.max(Math.min(x, max), min); }

class Vector {
    constructor(x, y) { this.x = x; this.y = y; }
    get clone() { return new Vector(this.x, this.y); }
    get normSq() { return this.x * this.x + this.y * this.y; }
    get norm() { return Math.sqrt(this.normSq); }
    get rightPerp() { return new Vector(-this.y, this.x); }
    get leftPerp() { return new Vector(this.y, -this.x); }
    add(other) { this.x += other.x; this.y += other.y; return this; }
    subtract(other) { this.x -= other.x; this.y -= other.y; return this; }
    scale(lambda) { this.x *= lambda; this.y *= lambda; return this; }
    rotate(angle) {
        var x = this.x; var y = this.y;
        var c = Math.cos(angle);
        var s = Math.sin(angle);
        this.x = c * x - s * y;
        this.y = s * x + c * y;
        return this;
    }
    normalize() { this.scale(1 / this.norm); return this; }

    static zero = new Vector(0,0);
    static e1 = new Vector(1,0);
    static e2 = new Vector(0,1);
}

function dot(v1, v2) { return v1.x * v2.x + v1.y * v2.y; }
function add(v1, v2) { return v1.clone.add(v2); }
function subtract(v1, v2) { return v1.clone.subtract(v2); }
function scale(lambda, v) { return v.clone.scale(lambda); }
function rotate(theta, v) { return v.clone.rotate(theta); }
function normalize(v) { return v.clone.normalize(); }

class RaycastHit {
    constructor(hit) {
        this.hit = hit;
        this.time = null;
        this.surfaceNormal = null;
    }
}
class Ray {
    constructor(origin, direction) {
        this.origin = origin.clone;
        this.direction = direction.clone;
    }

    pointFromTime(t) {
        return add(this.origin, scale(t, this.direction));
    }

    castAtSegment(segment) {
        var ao = subtract(this.origin, segment.a);
        var ab = subtract(segment.b, segment.a);
        var ortho = this.direction.rightPerp;
        var proj = dot(ab, ortho);
        if (proj == 0) return new RaycastHit(false);

        var t1 = (ab.x * ao.y - ao.x * ab.y) / proj;
        var t2 = dot(ao, ortho) / proj;
        if (t1 < 0 || t2 < 0 || t2 > 1) return new RaycastHit(false);

        var hit = new RaycastHit(true);
        hit.time = t1;
        var orientation = Math.sign(dot(ab, this.direction));
        if (orientation > 0) {
            hit.surfaceNormal = normalize(ab.rightPerp);
        } else {
            hit.surfaceNormal = normalize(ab.leftPerp);
        }
        return hit;
    }

    castAtBox(box) {
        var result = null;
        var minT = Number.POSITIVE_INFINITY;
        for (var i = 0; i < 4; i++) {
            var r = this.castAtSegment(box.edges[i]);
            if (r.hit && r.time < minT) {
                result = r;
                minT = r.time;
            }
        }
        if (result === null) return new RaycastHit(false);
        return result;
    }

    // https://noonat.github.io/intersect/
    castAtAABox(aabb) {
        var signX = Math.sign(this.direction.x);
        var signY = Math.sign(this.direction.y);
        var nearTimeX = (aabb.center.x - signX * aabb.halfW - this.origin.x) / this.direction.x;
        var nearTimeY = (aabb.center.y - signY * aabb.halfH - this.origin.y) / this.direction.y;
        var farTimeX = (aabb.center.x + signX * aabb.halfW - this.origin.x) / this.direction.x;
        var farTimeY = (aabb.center.y + signY * aabb.halfH - this.origin.y) / this.direction.y;

        if (nearTimeX > farTimeY || nearTimeY > farTimeX) {
            return new RaycastHit(false);
        }
        
        var nearTime = Math.max(nearTimeX, nearTimeY);
        var farTime = Math.min(farTimeX, farTimeY);

        if (farTime <= 0) {
            return new RaycastHit(false);
        }
        
        var hit = new RaycastHit(true);
        hit.time = nearTime;
        if (nearTimeX > nearTimeY) {
            hit.surfaceNormal = new Vector(-signX, 0);
        } else {
            hit.surfaceNormal = new Vector(0, -signY);
        }
        return hit;
    }

    // http://kylehalladay.com/blog/tutorial/math/2013/12/24/Ray-Sphere-Intersection.html
    castAtBall(ball) {
        var normScale = this.direction.norm;
        var oc = subtract(ball.center, this.origin);
        var tc = dot(this.direction, oc) / normScale;
        if (tc < 0) return new RaycastHit(false);

        var tcsq = tc * tc;
        var dsq = oc.normSq - tcsq;
        var rsq = ball.radius * ball.radius;
        if (dsq > rsq) return new RaycastHit(false);


        var t1c = Math.sqrt(rsq - dsq);
        var t1 = (tc - t1c) / normScale;

        var hit = new RaycastHit(true);
        hit.time = t1;
        var point = this.pointFromTime(hit.time);
        hit.surfaceNormal = subtract(point, ball.center);
        hit.surfaceNormal.normalize();
        return hit;
    }
}

class Segment {
    constructor(a, b) {
        this.a = a;
        this.b = b;
    }

    get direction() {
        return subtract(this.b, this.a);
    }

    get length() {
        return this.direction.norm;
    }

    get center() {
        return scale(0.5, add(this.a, this.b));
    }

    pointFromTime(t) {
        return add(this.a, scale(t, this.direction));
    }

    timeClosestTo(point) {
        var v = subtract(point, this.a);
        var projTime = dot(v, this.direction) / (this.direction.normSq);
        return clamp(projTime, 0, 1);
    }
}

class Ball {
    constructor(center, radius) {
        this.center = center;
        this.radius = radius;
    }

    contains(point) {
        var rSq = this.radius*this.radius;
        var rel = subtract(point, this.center);
        return rel.normSq <= rSq;
    }

    sweepIntoSegment(v, segment) {
        // compute Minkowski sum of segment: ball + aabb + ball
        var b1 = new Ball(segment.a, this.radius);
        var rx = normalize(subtract(segment.b, segment.a));
        var r = new Box(segment.center, segment.length/2, this.radius, rx);
        var b2 = new Ball(segment.b, this.radius);
        
        // consider this ball as point and raycast with velocity
        var ray = new Ray(this.center, v);
        var b1r = ray.castAtBall(b1);
        var b2r = ray.castAtBall(b2);
        var rr = ray.castAtBox(r);
        if (!b1r.hit && !b2r.hit && !rr.hit) return new RaycastHit(false);

        // find the first hit among the raycasts
        var minT = Number.POSITIVE_INFINITY;
        var effectiveHit = null;
        var tempArray = [b1r, b2r, rr];
        for (var i = 0; i < 3; i++) {
            var curHit = tempArray[i];
            if (curHit.hit && curHit.time < minT) {
                minT = curHit.time;
                effectiveHit = curHit;
            }
        }
        
        if (effectiveHit === null) return new RaycastHit(false);
        else return effectiveHit;
    }

    sweepIntoBoxHull(v, box) {
        var minT = Number.POSITIVE_INFINITY;
        var effectiveHit = null;
        for (var i = 0; i < 4; i++) {
            var r = this.sweepIntoSegment(v, box.edges[i]);
            if (r.hit && r.time < minT) {
                minT = r.time;
                effectiveHit = r;
            }
        }

        if (effectiveHit === null) return new RaycastHit(false);
        else return effectiveHit;
    }
}

class Box {
    constructor(center, halfW, halfH, x) {
        this.center = center;
        this.halfW = halfW;
        this.halfH = halfH;
        this.x = normalize(x);
        this.y = this.x.rightPerp;

        this.vertices = [
            add(this.center, add(scale(-halfW, this.x), scale(-halfH, this.y))),
            add(this.center, add(scale(halfW, this.x), scale(-halfH, this.y))),
            add(this.center, add(scale(halfW, this.x), scale(halfH, this.y))),
            add(this.center, add(scale(-halfW, this.x), scale(halfH, this.y))),
        ];
        this.edges = []
        this.normals = [];
        for (var i = 0; i < 4; i++) {
            if (i != 3) {
                this.edges.push(new Segment(this.vertices[i], this.vertices[i+1]))
            } else {
                this.edges.push(new Segment(this.vertices[3], this.vertices[0]));
            }

            var n = this.edges[i].direction.leftPerp;
            this.normals.push(normalize(n));
        }
    }

    closestEdgeTime(point) {
        var minDistSq = Number.POSITIVE_INFINITY;
        var minT = null;
        var minEdge = null;
        for (var i = 0; i < 4; i++) {
            var t = this.edges[i].timeClosestTo(point);
            var pointOnEdge = this.edges[i].pointFromTime(t);
            var distSq = subtract(pointOnEdge, point).normSq;
            if (distSq < minDistSq) {
                minDistSq = distSq;
                minT = t;
                minEdge = i;
            }
        }
        return { "edge": minEdge, "time": minT };
    }
}

class AABox {
    constructor(center, halfW, halfH) {
        this.center = center;
        this.halfW = halfW;
        this.halfH = halfH;
    }

    topLeft() { return add(this.center, new Vector(-halfW, -halfH)); }
    topRight() { return add(this.center, new Vector(halfW, -halfH)); }
    bottomRight() { return add(this.center, new Vector(halfW, halfH)); }
    bottomLeft() { return add(this.center, new Vector(-halfW, halfH)); }

    top() { return Segment(this.topLeft(), this.topRight()); }
    right() { return Segment(this.topRight(), this.bottomRight()); }
    bottom() { return Segment(this.bottomRight(), this.bottomLeft()); }
    left() { return Segment(this.bottomLeft(), this.bottomRight()); }

    contains(point) {
        var rel = subtract(point, this.center);
        var insideX = Math.abs(rel.x) <= this.halfW;
        var insideY = Math.abs(rel.y) <= this.halfH;
        return insideX && insideY;
    }

    sweepIntoAABox(v, other) {
        var inflated = new Box(other.center, 
            other.halfW + this.halfW, other.halfH + this.halfH, new Vector(1,0));
        var ray = new Ray(this.center, v);
        return ray.castAtBox(inflated);
    }

    closestEdgeAndTimeTo(point) {
        edges = [this.top(), this.right(), this.bottom(), this.left()];
        normals = [new Vector(0,-1), new Vector(1,0), new Vector(0,1), new Vector(-1,0)];

        minDistSq = Number.POSITIVE_INFINITY;
        minT = null;
        minEdge = null;
        for (var i = 0; i < 4; i++) {
            t = edges[i].timeClosestTo(point);
            pointOnEdge = edges[i].pointFromTime(t);
            distSq = subtract(pointOnEdge, point).normSq;
            if (distSq < minDistSq) {
                minDistSq = distSq;
                minT = t;
                minEdge = edges[i];
            }
        }

        return [minEdge, minT];
    }
}
/**
 * Vector2.js
 * A 2D vector class with an x and y component
 */

class Vector2{

    constructor(_x, _y){
        this.x = _x;
        this.y = _y;
    }

    GetX() {
        return this.x;
    }

    GetY() {
        return this.y;
    }

    SetX(_x) {
        this.x = _x;
    }

    SetY(_y) {
        this.y = _y;
    }

    Set(_x, _y) {
        this.x = _x;
        this.y = _y;
    }

    Add(_x, _y) {
        this.x += _x;
        this.y += _y;
    }

    AddVector(_vector) {
        this.x += _vector.GetX();
        this.y += _vector.GetY();
    }
}
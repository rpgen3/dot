import {Observe} from 'https://rpgen3.github.io/maze/mjs/sys/Observe.mjs';
export class LayeredCanvas {
    static html = null;
    static unit = -1;
    static width = -1;
    static height = -1;
    static observe = new Observe(3);
    constructor(color){
        const {html, unit, width, height} = LayeredCanvas;
        this.color = color;
        const param = {
            width: width * unit + 1,
            height: height * unit + 1
        };
        this.cv = $('<canvas>').prop(param).css({
            position: 'absolute',
            left: 0,
            top: 0
        }).appendTo(html);
        this.ctx = this.cv.get(0).getContext('2d');
        this.constructor.html.css(param);
    }
    draw(x, y, color){
        const {unit} = LayeredCanvas;
        this.ctx.fillStyle = color || this.color;
        this.ctx.fillRect(...[x, y, 1, 1].map(v => v * unit));
        return this;
    }
    erase(x, y){
        const {unit} = LayeredCanvas;
        this.ctx.clearRect(...[x, y, 1, 1].map(v => v * unit));
        return this;
    }
    clear(){
        const {width, height} = this.ctx.canvas;
        this.ctx.clearRect(0, 0, width, height);
        return this;
    }
    onDraw(callback, isErase){
        this.cv.bind('contextmenu', () => false).on('mousedown mousemove touchstart touchmove', e => {
            const {unit, observe} = LayeredCanvas;
            e.preventDefault();
            const {clientX, clientY, buttons, type, originalEvent} = e;
            let _x = clientX,
                _y = clientY;
            if(type.includes('touch')){
                const {clientX, clientY} = originalEvent.touches[0];
                _x = clientX;
                _y = clientY;
            }
            else if((buttons&1)===0) return;
            const {left, top} = originalEvent.target.getBoundingClientRect(),
                  [x, y] = [
                      _x - left,
                      _y - top
                  ].map(v => v / unit | 0),
                  erase = buttons === 2 || isErase();
            if(observe.changed(x, y, erase)) callback(x, y, erase);
        });
    }
    drawScale(){
        const {html, unit, width, height} = LayeredCanvas,
              max = Math.max(width, height),
              [w, h] = [width, height].map(v => v * unit),
              {ctx, color} = this;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.translate(0.5, 0.5);
        ctx.beginPath();
        for(let i = -1; i <= max; i++) {
            const _ = i * unit;
            if(i <= w) ctx.moveTo(_, 0), ctx.lineTo(_, h);
            if(i <= h) ctx.moveTo(0, _), ctx.lineTo(w, _);
        }
        ctx.stroke();
    }
    static toI(x, y){
        return x + y * this.width;
    }
    static toXY(i){
        const x = i % this.width,
              y = i / this.width | 0;
        return [x, y];
    }
    static init({html, unit, width, height}){
        this.html = html.css({
            position: 'relative',
            display: 'inline-block'
        }).empty().append($('<canvas>'));
        this.unit = unit;
        this.width = width;
        this.height = height;
    }
}

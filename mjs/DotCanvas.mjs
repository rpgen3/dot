import {LayeredCanvas} from 'https://rpgen3.github.io/maze/mjs/sys/LayeredCanvas.mjs';
import {bfs} from 'https://rpgen3.github.io/dot/mjs/bfs.mjs';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms)),
      colors = [];
export class DotCanvas extends LayeredCanvas {
    static get colors(){
        return colors;
    }
    constructor(...arg){
        super(...arg);
        const {width, height, unit} = LayeredCanvas;
        this.cv.prop({
            width: width * unit + 1,
            height: height * unit + 1
        });
        this.data = [...new Array(width * height).fill(-1)];
    }
    clear(){
        super.clear();
        this.data.fill(-1);
    }
    update(){
        const {toXY} = LayeredCanvas;
        super.clear();
        for(const [i, v] of this.data.entries()) if(v !== -1) super.draw(...toXY(i), colors[v]);
    }
    draw(x, y, value = -1){
        const {toI} = LayeredCanvas,
              {data} = this,
              i = toI(x, y);
        if(data[i] === value) return;
        data[i] = value;
        super.erase(x, y);
        if(value !== -1) super.draw(x, y, colors[value]);
    }
    async fill(x, y, value = -1){ // 塗りつぶし
        const {toI, toXY} = LayeredCanvas;
        if(this.data[toI(x, y)] === value) return;
        const {width, height} = LayeredCanvas;
        let cnt = 0;
        return bfs({
            maze: this.data.slice(),
            start: [x, y],
            width, height,
            update: async i => {
                this.draw(...toXY(i), value);
                if(!(++cnt % 1000)) await sleep(0);
            }
        });
    }
}

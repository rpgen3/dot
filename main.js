(async () => {
    const {importAll, getScript, importAllSettled} = await import(`https://rpgen3.github.io/mylib/export/import.mjs`);
    await getScript('https://code.jquery.com/jquery-3.3.1.min.js');
    const $ = window.$;
    const html = $('body').empty().css({
        'text-align': 'center',
        padding: '1em',
        'user-select': 'none'
    });
    const head = $('<dl>').appendTo(html),
          body = $('<dl>').appendTo(html).hide(),
          foot = $('<dl>').appendTo(html).hide();
    const rpgen3 = await importAll([
        'input',
        'util',
        'random',
        'css'
    ].map(v => `https://rpgen3.github.io/mylib/export/${v}.mjs`));
    const {LayeredCanvas, lerp} = await importAll([
        'LayeredCanvas',
        'lerp'
    ].map(v => `https://rpgen3.github.io/maze/mjs/sys/${v}.mjs`));
    const rpgen4 = await importAll([
        'bfs'
    ].map(v => `https://rpgen3.github.io/dot/mjs/${v}.mjs`));
    const addBtn = (h, ttl, func) => $('<button>').appendTo(h).text(ttl).on('click', func);
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    $('<div>').appendTo(head).text('作成するドット絵の幅と高さを入力');
    const [inputW, inputH] = ['幅', '高さ'].map(label => rpgen3.addInputNum(head,{
        label, save: true,
        max: 256,
        min: 1,
        value: 16
    }));
    addBtn(head, 'キャンバスを新規作成', () => {
        const [width, height] = [inputW(), inputH()],
              w = $(window).width();
        let unit = -1;
        const divide = 0.9 / width;
        if(w > 500) unit = Math.max(500, w * 0.5) * divide | 0;
        if(unit < 5) unit = w * divide | 0;
        LayeredCanvas.resize({width, height, unit});
        cvScale.drawScale();
        head.hide();
        body.add(foot).show();
    });
    //-----------------------------------------------------
    const leftUI = $('<dl>').appendTo(body), // レイヤーの選択など
          centerUI = $('<dl>').appendTo(body), // canvas用
          rightUI = $('<dl>').appendTo(body); // パレットなど
    class Layer {
        constructor(){
            this.list = [];
        }
        add(){
            const tmp = new DotCanvas();
            cvScale.cv.before(tmp.cv);
            this.list.push(tmp);
            return tmp;
        }
    }
    const inputOpacity = rpgen3.addInputNum(leftUI, {
        label: 'レイヤーの不透明度',
        max: 1,
        min: 0,
        step: 0.1
    });
    inputOpacity.elm.on('input', () => {
        g_nowCanvas && g_nowCanvas.cv.css('opacity', inputOpacity());
    });
    const updateInputOpacity = () => inputOpacity(rpgen3.getCSS(g_nowCanvas.cv).opacity);
    const selectCanvas = rpgen3.addSelect(leftUI, {
        label: 'レイヤーの選択',
        list: []
    });
    selectCanvas.elm.on('change', () => {
        g_nowCanvas = selectCanvas();
        updateInputOpacity();
    });
    let g_nowLayer = new Layer();
    addBtn(leftUI, 'レイヤーを追加', () => {
        g_nowCanvas = g_nowLayer.add();
        const {list} = g_nowLayer;
        selectCanvas.update([...list.entries()]);
        selectCanvas(list.length - 1);
        updateInputOpacity();
    });
    LayeredCanvas.init($('<div>').appendTo(centerUI));
    const eraseFlag = rpgen3.addInputBool(rightUI, {
        label: '消しゴム'
    });
    const fillFlag = rpgen3.addInputBool(rightUI, {
        label: '塗りつぶす'
    });
    const hideScale = rpgen3.addInputBool(rightUI, {
        label: '目盛りを非表示'
    });
    hideScale.elm.on('change', () => cvScale.cv.css('opacity', Number(!hideScale())));
    const color = new class {
        constructor(){
            this.elm = $('<div>').appendTo(rightUI);
            this.list = [];
            this.inputs = [];
            this.covers = [];
        }
        add(){
            const id = this.list.length;
            const holder = $('<div>').appendTo(this.elm).css({
                position: 'relative',
                display: 'inline-block'
            });
            const input = $('<input>').appendTo(holder).prop({
                type: 'color'
            }).on('change', ({target}) => {
                this.list[id] = $(target).val();
                for(const cv of g_nowLayer.list){
                    if(cv.data.includes(id)) cv.update();
                }
            });
            const cover = $('<div>').appendTo(holder).css({
                position: 'absolute',
                left: 0,
                top: 0,
                width: input.outerWidth(),
                height: input.outerHeight()
            }).on('click', () => {
                g_nowColorID = id;
                const activeCover = 'activeCover';
                $(`.${activeCover}`).removeClass(activeCover);
                this.covers[g_nowColorID].addClass(activeCover);
            });
            this.inputs.push(input);
            this.covers.push(cover);
            this.list.push([]);
            cover.trigger('click');
        }
        set(id){
            if(id === -1) return;
            this.inputs[id].click();
        }
    };
    $('<style>').appendTo(body).text(`
    .activeCover {
    outline: double 5px #4ec4d3;
    outline-offset: -5px;
}
    `);
    addBtn(rightUI, '色定義を追加', () => {
        color.add();
    });
    addBtn(rightUI, '色定義を設定', () => {
        color.set(g_nowColorID);
    });
    //-----------------------------------------------------
    const cvMaze = new LayeredCanvas('rgba(127, 127, 127, 1)'),
          cvScale = new LayeredCanvas('rgba(0, 0, 0, 1)');
    let g_nowCanvas = null,
        g_nowColorID = -1;
    {
        const xyLast = [-1, -1],
              deltaTime = 100;
        let lastTime = -1,
            busy = false;
        cvScale.onDraw(async (x, y, erase) => {
            if(!g_nowCanvas || busy) return;
            const now = performance.now(),
                  v = erase ? -1 : g_nowColorID;
            if(fillFlag()) {
                busy = true;
                await g_nowCanvas.fill(x, y, v);
                busy = false;
            }
            else {
                for(const [_x, _y] of now - lastTime > deltaTime ? [[x, y]] : lerp(x, y, ...xyLast)) {
                    g_nowCanvas.draw(_x, _y, v);
                }
                xyLast[0] = x;
                xyLast[1] = y;
                lastTime = now;
            }
        }, () => eraseFlag());
    }
    const {toI, toXY} = LayeredCanvas;
    class DotCanvas extends LayeredCanvas {
        constructor(...arg){
            super(...arg);
            const {width, height, unit} = LayeredCanvas;
            this.cv.prop({
                width: width * unit + 1,
                height: height * unit + 1
            });
            this.data = this.make();
        }
        make(){
            const {width, height} = LayeredCanvas;
            return [...new Array(width * height).fill(-1)];
        }
        clear(){
            this.data = this.make();
            super.clear();
        }
        update(){
            super.clear();
            for(const [i, v] of this.data.entries()) if(v !== -1) super.draw(...toXY(i), color.list[v]);
        }
        draw(x, y, value = -1){
            const {data} = this,
                  i = toI(x, y);
            if(data[i] === value) return;
            data[i] = value;
            super.erase(x, y);
            if(value !== -1) super.draw(x, y, color.list[value]);
        }
        async fill(x, y, value = -1){ // 塗りつぶし
            if(this.data[toI(x, y)] === value) return;
            const {width, height} = LayeredCanvas;
            let cnt = 0;
            return rpgen4.bfs({
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
})();

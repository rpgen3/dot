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
        'random'
    ].map(v => `https://rpgen3.github.io/mylib/export/${v}.mjs`));
    const {LayeredCanvas, lerp} = await importAll([
        'LayeredCanvas',
        'lerp'
    ].map(v => `https://rpgen3.github.io/maze/mjs/sys/${v}.mjs`));
    const addBtn = (h, ttl, func) => $('<button>').appendTo(h).text(ttl).on('click', func);
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
    let g_nowFlame = null;
    class Flame {
        constructor(){
            this.list = [];
        }
        add(){
            const tmp = new DotCanvas();
            cvScale.before(tmp.cv);
            this.list.push(tmp);
            g_nowCanvas = tmp;
        }
    }
    addBtn(leftUI, 'レイヤーを追加', () => {
        g_nowFlame.add();
    });
    LayeredCanvas.init($('<div>').appendTo(centerUI));
    const eraseFlag = rpgen3.addInputBool(rightUI, {
        label: '消しゴム'
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
            });
            $('<div>').appendTo(holder).css({
                position: 'absolute',
                left: 0,
                top: 0,
                width: input.width(),
                height: input.height()
            }).on('click', () => {
                g_nowColorID = id;
            });
            this.inputs.push(input);
            this.list.push([]);
        }
        set(id){
            if(id === -1) return;
            this.inputs[id].click();
        }
    };
    addBtn(leftUI, '色定義を追加', () => {
        color.add();
    });
    addBtn(leftUI, '色定義を設定', () => {
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
        let lastTime = -1;
        cvScale.onDraw((x, y, erase) => {
            if(!g_nowCanvas) return;
            const now = performance.now(),
                  v = erase ? -1 : g_nowColorID;
            for(const [_x, _y] of now - lastTime > deltaTime ? [[x, y]] : lerp(x, y, ...xyLast)) {
                g_nowCanvas.draw(_x, _y, v);
            }
            xyLast[0] = x;
            xyLast[1] = y;
            lastTime = now;
        }, () => eraseFlag());
    }
    const {toI, toXY} = LayeredCanvas;
    class DotCanvas extends LayeredCanvas {
        constructor(...arg){
            super(...arg);
            const {width, height} = LayeredCanvas;
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
            if(data[i] === i) return;
            data[i] = value;
            super.erase(x, y);
            if(value !== -1) super.draw(x, y, color.list[value]);
        }
        fill(x, y, value = -1){ // 塗りつぶし
            const {data, ctx} = this,
                  {width, height, unit} = LayeredCanvas;
            ctx.beginPath();
            for(const [_x, _y] of dfs(x, y)) {
                data[toI(_x, _y)] = value;
                ctx.rect(...[_x, _y, 1, 1].map(v => v * unit));
            }
            ctx.clip();
            if(value !== -1) {
                ctx.fillStyle = color.list[value];
                ctx.fill();
            }
        }
    }
})();

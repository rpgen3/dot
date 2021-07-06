(async()=>{
    const {importAll, getScript} = await import('https://rpgen3.github.io/mylib/export/import.mjs');
    await getScript('https://rpgen3.github.io/lib/lib/jquery-3.5.1.min.js');
    const rpgen3 = await importAll([
        'input',
        'imgur',
        'strToImg'
    ].map(v => `https://rpgen3.github.io/mylib/export/${v}.mjs`));
    const undef = void 0;
    const html = $('body').empty().css({
        'text-align': 'center',
        padding: '1em',
        'user-select': 'none'
    });
    const header = $('<div>').appendTo(html),
          body = $('<div>').appendTo(html),
          footer = $('<div>').appendTo(html);
    class SimpleText {
        constructor({text = '', color = 'black', size = 16}){
            this.x = this.y = 0;
            this.text = text;
            this.color = color;
            this.size = size;
            layer.set(this, 999);
        }
        update(ctx){
            const {x, y, text, color, size} = this;
            ctx.fillStyle = color;
            ctx.font = `bold ${size}px 'ＭＳ ゴシック'`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(text, x, y);
        }
        goto(x, y){
            this.x = x;
            this.y = y;
            return this;
        }
    }
    const rpgen4 = await importAll([
        'Canvas'
    ].map(v => `https://rpgen3.github.io/game/export/${v}.mjs`));
    const unit = rpgen3.addInputNum(header,{
        label: '単位ピクセルの大きさ',
        save: true,
        value: 20,
        min: 1,
        max: 40
    });
    const cvHolder = $('<div>').appendTo(footer).css({position: 'relative'});
    const makeLayer = () => {
        const cv = new rpgen4.Canvas(cvHolder);
        $(cv.ctx.canvas).css({
            position: 'absolute',
            left: 0,
            top: 0
        });
        return cv;
    };
    const scale = makeLayer();
    const drawScale = () => {
        const {ctx, w, h} = scale;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        for(let i = 0; i < w; i += unit) ctx.fillRect(i, 0, 1, h);
        for(let i = 0; i < h; i += unit) ctx.fillRect(0, i, w, 1);
    };
    const mainCv = makeLayer();
    $(window).on('mousedown mousemove touchstart touchmove', e => draw(e)).on('contextmenu', () => false);
    let activCv = mainCv;
    const draw = e => {
        if(!e.which) return;
        const {ctx} = activCv;
        ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
        const {left, top} = $(ctx.canvas).offset(),
              x = quantize(e.clientX - left),
              y = quantize(e.clientY - top),
              erase = e.buttons === 2;
        ctx[erase ? 'clearRect' : 'fillRect'](x, y, unit, unit);
    };
    const quantize = v => (v / unit | 0) * unit;
    unit.elm.on('input', drawScale).trigger('input');
})();

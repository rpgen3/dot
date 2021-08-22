(async()=>{
    const {importAll, getScript} = await import('https://rpgen3.github.io/mylib/export/import.mjs');
    await getScript('https://rpgen3.github.io/lib/lib/jquery-3.5.1.min.js');
    const rpgen3 = await importAll([
        'input'
    ].map(v => `https://rpgen3.github.io/mylib/export/${v}.mjs`));
    const html = $('body').empty().css({
        'text-align': 'center',
        padding: '1em',
        //'user-select': 'none'
    });
    const header = $('<div>').appendTo(html),
          body = $('<div>').appendTo(html),
          footer = $('<div>').appendTo(html);
    const cvHolder = $('<div>').appendTo(body).css({
        position: 'relative',
        overflow: 'scroll',
        width: $(window).width() * 0.7,
        height: $(window).height() * 0.7
    });
    const inputZoom = rpgen3.addInputNum(header, {
        label: 'zoom rate[%]',
        value: 1,
        min: 1,
        max: 9
    });
    inputZoom.elm.on('change', () => {
        $('canvas').css('width', inputZoom * 400);
    });
    class Canvas {
        constructor(parentNode){
            const zoom = inputZoom * 400;
            const ctx = $('<canvas>').appendTo(parentNode).prop({
                width: 400, height: 200
            }).css({
                position: 'absolute',
                //display: 'block',
                left: 0, top: 0, width: zoom
            }).get(0).getContext('2d');
            // ドットを滑らかにしないおまじない
            ctx.mozImageSmoothingEnabled = false;
            ctx.webkitImageSmoothingEnabled = false;
            ctx.msImageSmoothingEnabled = false;
            ctx.imageSmoothingEnabled = false;
            this.ctx = ctx;
            $(ctx.canvas).on('mousedown mousemove touchstart touchmove', e => this.draw(e))
            //ctx.fillRect(0, 0, 500, 500);
        }
        draw(e){
            if(!e.which) return;
            const {offsetX, offsetY} = e.originalEvent;
            console.log(e);
            const unit = 1, erase = 0;
            this.ctx[erase ? 'clearRect' : 'fillRect'](offsetX / inputZoom | 0, offsetY / inputZoom | 0, unit, unit);
        }
    }
    for(const i of new Array(5)) new Canvas(cvHolder);
})();

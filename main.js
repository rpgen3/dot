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
    const msg = (() => {
        const elm = $('<div>').appendTo(body);
        return (str, isError) => $('<span>').appendTo(elm.empty()).text(str).css({
            color: isError ? 'red' : 'blue',
            backgroundColor: isError ? 'pink' : 'lightblue'
        });
    })();
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    const [inputW, inputH] = ['幅', '高さ'].map(label => rpgen3.addInputNum(head,{
        label, save: true,
        step: 2,
        max: 299,
        min: 5,
        value: 25
    }));
    let g_maze = [],
        g_w = -1,
        g_h = -1;
    const toI = (x, y) => x + y * g_w;
    const toXY = i => {
        const x = i % g_w,
              y = i / g_w | 0;
        return [x, y];
    };
    addBtn(head, '初期化', () => {
        [g_w, g_h] = [inputW(), inputH()];
        g_maze = [...Array(g_w * g_h).fill(false)];
        const w = $(window).width();
        let unit = -1;
        const divide = 0.9 / inputW;
        if(w > 500) unit = Math.max(500, w * 0.5) * divide | 0;
        if(unit < 5) unit = w * divide | 0;
        LayeredCanvas.update(unit, g_w, g_h);
        cvScale.drawScale();
        body.add(foot).show();
    });
    const eraseFlag = rpgen3.addInputBool(foot, {
        label: '消しゴム'
    });
    const hideScale = rpgen3.addInputBool(foot, {
        label: '目盛りを非表示'
    });
    hideScale.elm.on('change', () => cvScale.cv.css('opacity', Number(!hideScale())));
    LayeredCanvas.init($('<div>').appendTo(foot));
    addBtn($('<div>').appendTo(foot), '画像として保存', () => {
        const {width, height} = cvScale.ctx.canvas,
              cv = $('<canvas>').prop({width, height}),
              ctx = cv.get(0).getContext('2d');
        for(const {cv} of [
            cvMaze,
            hideScale() ? [] : cvScale
        ].flat()) ctx.drawImage(cv.get(0), 0, 0);
        $('<a>').attr({
            href: cv.get(0).toDataURL(),
            download: 'maze.png'
        }).get(0).click();
    });
    const cvMaze = new LayeredCanvas('rgba(127, 127, 127, 1)'),
          cvScale = new LayeredCanvas('rgba(0, 0, 0, 1)');
    const xyStart = [-1, -1],
          xyGoal = [-1, -1];
    {
        const xyLast = [-1, -1],
              deltaTime = 100;
        let lastTime = -1;
        cvScale.onDraw((x, y, erase) => {
            const now = performance.now();
            for(const [_x, _y] of now - lastTime > deltaTime ? [[x, y]] : lerp(x, y, ...xyLast)) {
                cvMaze.draw(_x, _y, erase);
                g_maze[toI(_x, _y)] = !erase;
            }
            xyLast[0] = x;
            xyLast[1] = y;
            lastTime = now;
        }, () => eraseFlag());
    }
})();

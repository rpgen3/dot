export const bfs = async ({maze, start, width, height, update}) => {
    const toI = (x, y) => x + y * width;
    const toXY = i => {
        const x = i % width,
              y = i / width | 0;
        return [x, y];
    };
    const getAbled = i => {
        const [x, y] = toXY(i);
        const way = [];
        if(x !== 0) way.push([-1, 0]);
        if(x !== width - 1) way.push([1, 0]);
        if(y !== 0) way.push([0, -1]);
        if(y !== height - 1) way.push([0, 1]);
        return way.flatMap(([_x, _y]) => {
            const _i = toI(_x + x, _y + y);
            return maze[_i] !== road || done.has(_i) ? [] : [_i];
        });
    };
    const _start = toI(...start),
          road = maze[_start],
          queue = [_start],
          done = new Set;
    while(queue.length) {
        const _i = queue.shift();
        await update(_i);
        for(const i of getAbled(_i)) {
            queue.push(i);
            done.add(i);
        }
    }
};

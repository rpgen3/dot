export class HistoryList {
    constructor() {
        this.now = null;
        this.add(null);
    }
    get(){
        return this.now.data;
    }
    add(data) {
        this.now = {
            data, prev: this.now
        };
        if(this.now.prev) this.now.prev.next = this.now;
    }
    undo() {
        return this.now.prev ? (this.now = this.now.prev).data : null;
    }
    redo() {
        return this.now.next ? (this.now = this.now.next).data : null;
    }
}

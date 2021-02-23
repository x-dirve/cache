class MemoCache {
    protected store: object = Object.create(null);
    getItem<T>(key:string):T {
        return this.store[key];
    }

    setItem(key:string, value:any):void {
        this.store[key] = value;
    }

    removeItem(key:string):void {
        this.store[key] = null;
        delete this.store[key];
    }
}

export default MemoCache

import { CacheMod } from "../index";

class MemoCache implements CacheMod {
    protected store: object = Object.create(null);

    getItem<T = any>(key:string):T {
        return this.store[key];
    }

    setItem(key:string, value:any) {
        this.store[key] = value;
    }

    removeItem(key:string) {
        this.store[key] = null;
        delete this.store[key];
    }
}

export default MemoCache

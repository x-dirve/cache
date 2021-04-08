import { CacheMod } from "../index";
declare class MemoCache implements CacheMod {
    protected store: object;
    getItem<T = any>(key: string): T;
    setItem(key: string, value: any): void;
    removeItem(key: string): void;
}
export default MemoCache;

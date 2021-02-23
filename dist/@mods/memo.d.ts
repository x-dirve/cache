declare class MemoCache {
    protected store: object;
    getItem<T>(key: string): T;
    setItem(key: string, value: any): void;
    removeItem(key: string): void;
}
export default MemoCache;

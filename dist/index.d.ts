/**存储类型定义 */
declare enum CacheType {
    /**localStorage */
    lStorage 
    /**sessionStorage */
    = 0
    /**sessionStorage */
    ,
    sStorage 
    /**内存 */
    = 1
    /**内存 */
    ,
    memo = 2
}
export { CacheType };
/**
 * 缓存配置
 */
interface CacheConf {
    /** 缓存类型 */
    type?: CacheType;
    /** 全局过期时间 */
    expires?: number;
    /** 缓存key前缀*/
    prefix?: string;
    /** 限制上限 */
    maxStack?: number;
}
/**单条数据缓存配置 */
interface DataConf {
    /**单条数据过期时间 */
    expires?: number;
    /**缓存生效条件 */
    conditions?: object;
}
declare class Cache {
    /**实例配置 */
    config: CacheConf;
    /**实例存储键前缀 */
    protected prefix: string;
    /**存储数据堆键名 */
    private stackKey;
    /**实例内部存储对象 */
    protected store: any;
    /**当前实例已存储的数据堆栈 */
    protected stack: string[];
    constructor(conf?: CacheConf);
    /**同步堆栈信息 */
    private syncStack;
    /**当前缓存类型存储的数据数量 */
    get length(): number;
    /**当前存储是否已经超出上限 */
    get isStackOOM(): boolean;
    /**
     * 存储数据
     * @param key   数据键值
     * @param value 数据
     * @param conf  数据缓存配置
     * @returns     模块实例对象
     * @example
     * ```tsx
     * // 存储数据
     * Cache.set("test", 123456)
     * Cache.set("test", 123456, {expires: 10})
     * ```
     */
    set(key: string, value: any, conf?: DataConf): this;
    /**
     * 获取存储的数据
     * @param key 存储数据的键值
     * @example
     * ```tsx
     * // 获取存储数据
     * Cache.get("test")
     * ```
     */
    get(key: string): any;
    /**
     * 删除已经存储的数据
     * @param   key 存储数据的键值
     * @returns     模块实例对象
     * @example
     * ```tsx
     * // 获取存储数据
     * Cache.del("test")
     * ```
     */
    del(key: string): this;
}
export default Cache;

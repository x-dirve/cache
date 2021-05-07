interface CacheType {
    [type: string]: number;
}
/**自定义缓存模块 */
interface CacheMod {
    /**获取数据 */
    getItem<T = any>(key: string): T;
    /**设置数据 */
    setItem(key: string, value: any): any;
    /**删除数据 */
    removeItem(key: string): any;
}
export { CacheMod };
/**
 * 缓存配置
 */
interface CacheConf {
    /** 缓存类型 */
    type?: number;
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
    conditions?: any;
}
/**存储类型定义 */
declare const CacheType: CacheType;
export { CacheType };
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
    /**生效条件特征 */
    static CONDITION_REGEXP: RegExp;
    /**
     * 通过 key 与生效条件判断数据是否可以被缓存
     * @param conditions 生效条件
     * @param key        存储 key
     */
    private checkConditions;
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
     * Cache.set("test@123", 123, {conditions: 123})
     * Cache.set("test@123", 234, {conditions: [123, 234]})
     * Cache.set("test@a=123", 123456, {conditions: {a:123}})
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
/**
 * 注册一个缓存类型
 * @param name 缓存类型名称
 * @param mod  自定义缓存模块
 * @param type 缓存类型值，不传入时则在当前最大的取值上自动生成
 */
declare function register(name: string, mod: any, type?: number): void;
export { register };
export default Cache;

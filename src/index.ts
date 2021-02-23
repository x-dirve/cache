import { merge } from "@x-drive/utils";
import MemoCache from "./@mods/memo";

/**存储类型定义 */
enum CacheType {
    /**localStorage */
    lStorage
    /**sessionStorage */
    , sStorage
    /**内存 */
    , memo
};

export { CacheType };

/**
 * 缓存配置
 */
interface CacheConf {
    /** 缓存类型 */
    type?: CacheType
    /** 全局过期时间 */
    expires?: number
    /** 缓存key前缀*/
    prefix?: string
    /** 限制上限 */
    maxStack?: number
};

/**单条数据缓存配置 */
interface DataConf {
    /**单条数据过期时间 */
    expires?: number

    /**缓存生效条件 */
    conditions?: object
};

/**缓存前缀键名 */
const PREFIX: string = "__F_CACHE__";

/**缓存堆键名 */
const STACK_KEY: string = "_STACK__";

class Cache {
    /**实例配置 */
    config: CacheConf = {
        "type": 0
        , "expires": 0
        , "prefix": ""
        , "maxStack": 200
    }

    /**实例存储键前缀 */
    protected prefix: string = "";

    /**存储数据堆键名 */
    private stackKey: string = "";

    /**实例内部存储对象 */
    protected store: any;

    /**当前实例已存储的数据堆栈 */
    protected stack: string[] = [];

    constructor(conf: CacheConf = {}) {
        this.config = merge(this.config, conf);
        this.prefix = `${PREFIX}${this.config.prefix}_`;

        // 获取缓存类型
        switch (conf.type) {
            case CacheType.lStorage:
                this.store = localStorage;
                break;
            case CacheType.sStorage:
                this.store = sessionStorage;
                break;
            case CacheType.memo:
                this.store = new MemoCache();
                break;
            default:
                this.store = sessionStorage;
        }
        this.stackKey = `${this.prefix}${STACK_KEY}`;
        var stack = this.store.getItem(this.stackKey);
        if (stack) {
            try {
                stack = JSON.parse(stack);
            } catch (err) {
                stack = [];
            }
        } else {
            stack = [];
        }

        this.stack = stack;

        conf = stack = null;

        return this;
    }

    /**同步堆栈信息 */
    private syncStack() {
        this.store.setItem(this.stackKey, JSON.stringify(this.stack));
    }

    /**当前缓存类型存储的数据数量 */
    get length(): number {
        return this.stack.length;
    }

    /**当前存储是否已经超出上限 */
    get isStackOOM(): boolean {
        return this.stack.length >= this.config.maxStack;
    }

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
    set(key: string, value:any, conf?: DataConf) {
        const datConf: DataConf = merge(
            {
                "expires": this.config.expires
            }
            , conf
        );

        let expires = datConf.expires;
        if (expires) {
            expires = Date.now() + (datConf.expires * 1000);
        }

        const innerKey = `${this.prefix}${key}`;

        this.store.setItem(
            innerKey
            , JSON.stringify({
                value,
                expires
            })
        );

        const index = this.stack.indexOf(innerKey);
        if (index === -1) {
            if (this.isStackOOM) {
                this.store.removeItem(this.stack.shift());
            }
            this.stack.push(innerKey);
            this.syncStack();
        }

        return this;
    }

    /**
     * 获取存储的数据
     * @param key 存储数据的键值
     * @example
     * ```tsx
     * // 获取存储数据
     * Cache.get("test")
     * ```
     */
    get(key: string) {
        const innerKey = `${this.prefix}${key}`;
        let item = this.store.getItem(innerKey);
        const now = Date.now();
        if (item) {
            item = JSON.parse(item);
            if (item.expires && now > item.expires) {
                this.del(
                    innerKey.slice(this.prefix.length)
                );
                return null;
            } else {
                return item.value;
            }
        }
        return null;
    }

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
    del(key: string) {
        const innerKey = `${this.prefix}${key}`;
        const index = this.stack.indexOf(innerKey);
        if (index !== -1) {
            this.store.removeItem(innerKey);
            this.stack.splice(index, 1);
            this.syncStack();
        }
        return this;
    }
}
export default Cache;
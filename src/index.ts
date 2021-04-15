import { isNumber, isString, isUndefined, merge } from "@x-drive/utils";
import MemoCache from "./@mods/memo";

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
    type?: number
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


/**存储类型定义 */
const CacheType: CacheType = {
    /**localStorage */
    "lStorage": 0
    /**sessionStorage */
    , "sStorage": 1
    /**内存 */
    , "memo": 2
};

const CacheTypeMap = Object.keys(CacheType).reduce(
    (sub, key) => {
        sub[CacheType[key]] = key;
        return sub;
    }
    , Object.create(null)
);

export { CacheType };

/**自行注册的缓存类型 */
const RegCacheMod:{[name:string]: any} = {};

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
                if (isUndefined(RegCacheMod.memo)) {
                    // 注册内存类型
                    register("memo", MemoCache, 2);
                }
                this.store = new RegCacheMod.memo();
            break;

            default:
                const typeName = CacheTypeMap[conf.type];
                if (typeName && RegCacheMod[typeName]) {
                    this.store = new RegCacheMod[typeName]();
                } else {
                    this.store = sessionStorage;
                }
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

/**获取当前的类型对应的类型值 */
function getNowCacheType() {
    return Object.keys(CacheType).map(name => CacheType[name]);
}

/**
 * 注册一个缓存类型
 * @param name 缓存类型名称
 * @param mod  自定义缓存模块
 * @param type 缓存类型值，不传入时则在当前最大的取值上自动生成
 */
function register(name: string, mod: any, type?: number) {
    if (isString(name) && isUndefined(RegCacheMod[name]) && mod) {
        if (!isNumber(type)) {
            type = Math.max.apply(Math, getNowCacheType());
            type += 1;
        }
        CacheTypeMap[type] = name;
        CacheType[name] = type;
        RegCacheMod[name] = mod;
    }
}
export { register };

export default Cache;
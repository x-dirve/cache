import { isArray, isFunction, isNumber, isObject, isString, isUndefined, merge } from "@x-drive/utils";
import MemoCache from "./@mods/memo";

interface CacheType {
    /**localStorage */
    lStorage:0;

    /**sessionStorage */
    sStorage : 1;

    /**内存 */
    memo:2;

    /**其他类型 */
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
    /**
     * 缓存类型
     * 默认：0 localStorage, 1 sessionStorage, 2 内存, 使用者可以自己定义其他类型
     */
    type?: number;

    /** 全局过期时间 */
    expires?: number;

    /** 缓存key前缀*/
    prefix?: string;

    /** 限制上限 */
    maxStack?: number;
};

/**单条数据缓存配置 */
interface DataConf {
    /**单条数据过期时间 */
    expires?: number;

    /**缓存生效条件 */
    conditions?: any;

    /**是否一次性数据 */
    once?: boolean;
};


/**存储类型定义 */
const CacheType: CacheType = {
    "lStorage": 0
    , "sStorage": 1
    , "memo": 2
};

const CacheTypeMap:Record<number, string> = Object.keys(CacheType).reduce(
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

    /**生效条件特征 */
    static CONDITION_REGEXP = /@([\w\,\s\=]+)$/;

    /**
     * 通过 key 与生效条件判断数据是否可以被缓存
     * @param conditions 生效条件
     * @param key        存储 key
     */
    private checkConditions(conditions: any, key:string) {
        const keyParts = key.match(Cache.CONDITION_REGEXP)?.[1];
        if (keyParts && conditions) {
            // 是对象，条件都是且，任何一条无效就会认为判定失败
            if (isObject(conditions)) {
                for (let n in conditions) {
                    if (conditions.hasOwnProperty(n)) {
                        const condition = conditions[n];
                        let re = false;
                        switch (true) {
                            // 条件为数组时表示或
                            case isArray(condition):
                                for (let i = 0; i < condition.length; i++) {
                                    if (keyParts.indexOf(condition[i]) !== -1) {
                                        // 任何一条满足
                                        re  = true;
                                        break;
                                    }
                                }
                            break;
    
                            // 条件为对象时表示且
                            case isObject(condition):
                                for (let m in condition) {
                                    if (condition.hasOwnProperty(m)) {
                                        let checkKey = `${m}=${condition[m]}`;
                                        if (keyParts.indexOf(checkKey) === -1) {
                                            // 任何一条不满足
                                            re = false;
                                            break;
                                        }
                                    }
                                }
                            break;
    
                            // 条件为函数时则以函数返回值为准
                            case isFunction(condition):
                                re = (condition as Function)(keyParts, key);
                            break;
    
                            // 其他类型则默认用 kv 对进行匹配
                            default:
                                const defCheckKey = `${n}=${condition}`;
                                if (keyParts.indexOf(defCheckKey) === -1) {
                                    re = false;
                                }
                        }
                        if (re === false) {
                            // 外部定义的数据结构是对象，所以只要有一个条件无效则认为判定失败
                            return false;
                        }
                    }
                }
                return true;
            }

            // 是数组，任何一条成功即可
            if (isArray(conditions)) {
                for (let i = 0; i < conditions.length; i++) {
                    if (keyParts.indexOf(conditions[i]) !== -1) {
                        return true;
                    }
                }
                return false;
            }

            // 不是对象也不是数组则直接判断
            if (!isObject(conditions) && !isArray(conditions)) {
                return keyParts.indexOf(conditions) !== -1;
            }

            // 其他的不支持
            return false;
        }
        // 条件不支持则全都认为成功
        return true;
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
     * Cache.set("test@123", 123, {conditions: 123})
     * Cache.set("test@123", 234, {conditions: [123, 234]})
     * Cache.set("test@a=123", 123456, {conditions: {a:123}})
     * ```
     */
    set(key: string, value:any, conf?: DataConf) {
        const datConf: DataConf = merge(
            {
                "expires": this.config.expires
                ,"once": false
            }
            , conf
        );

        // 条件
        if (datConf.conditions) {
            const checkRe = this.checkConditions(datConf.conditions, key);
            if (checkRe === false) {
                return null;
            }
        }

        // 有效期
        let expires = datConf.expires;
        if (isNumber(expires) && expires) {
            expires = Date.now() + (datConf.expires * 1000);
        }

        const innerKey = `${this.prefix}${key}`;

        this.store.setItem(
            innerKey
            , JSON.stringify({
                value
                ,expires
                , "once": datConf.once
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
    get<T = any>(key: string) {
        const innerKey = `${this.prefix}${key}`;
        let item = this.store.getItem(innerKey);
        const now = Date.now();
        if (item) {
            item = JSON.parse(item);
            if (item.expires && now > item.expires) {
                this.del(key);
                return null;
            } else {
                if (item.once) {
                    this.del(key);
                }
                return item.value as T;
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

    /**
     * 存储一条一次性消费的数据，配置中的 once 字段会被强制设置为 true
     * @param key   数据键值
     * @param value 数据
     * @param conf  数据缓存配置
     * @returns     模块实例对象
     */
    once(key: string, value: any, conf?: DataConf) {
        if (isObject(conf)) {
            conf.once = true;
        } else {
            conf = {
                "once": true
            };
        }
        return this.set(key, value, conf);
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
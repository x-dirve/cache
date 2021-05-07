/**
 * 数据类型判断
 * @param  subject 待判断的数据
 * @param  type    数据类型名字
 * @return         判断结果
 */
function is(subject, type) {
    return Object.prototype.toString.call(subject).substr(8, type.length).toLowerCase() === type;
}

/**
 * 是否是数组
 * @param  subject 待判断的数据
 */
function isObject(subject) {
    return is(subject, "object");
}

/**
 * 是否 undefined
 * @param  subject 待判断的数据
 */
function isUndefined(subject) {
    return is(subject, "undefined");
}

/**
 * 是否是函数
 * @param  subject 待判断的数据
 */
function isFunction(subject) {
    return is(subject, "function");
}

/**
 * 是否是数组
 * @param  subject 待判断的数据
 */
function isArray(subject) {
    return Array.isArray(subject);
}

/**
 * 合并
 * @param target  合并基准对象
 * @param sources 后续合并对象
 */
function merge(target) {
    var obj, obj$1;

    var sources = [], len = arguments.length - 1;
    while ( len-- > 0 ) sources[ len ] = arguments[ len + 1 ];
    if (!sources.length)
        { return target; }
    var source = sources.shift();
    if (isObject(target) && isObject(source)) {
        for (var key in source) {
            if (isObject(source[key])) {
                if (!target[key]) {
                    Object.assign(target, ( obj = {}, obj[key] = {}, obj ));
                }
                merge(target[key], source[key]);
            }
            else {
                Object.assign(target, ( obj$1 = {}, obj$1[key] = source[key], obj$1 ));
            }
        }
    }
    return merge.apply(void 0, [ target ].concat( sources ));
}

/**
 * 是否是字符串
 * @param  subject 待判断的数据
 */
function isString(subject) {
    return is(subject, "string");
}

/**
 * 是否是数字
 * @param  subject 待判断的数据
 */
function isNumber(subject) {
    return !isNaN(subject) && is(subject, "number");
}

class MemoCache {
    constructor() {
        this.store = Object.create(null);
    }
    getItem(key) {
        return this.store[key];
    }
    setItem(key, value) {
        this.store[key] = value;
    }
    removeItem(key) {
        this.store[key] = null;
        delete this.store[key];
    }
}

/**存储类型定义 */
const CacheType = {
    /**localStorage */
    "lStorage": 0
    /**sessionStorage */
    ,
    "sStorage": 1
    /**内存 */
    ,
    "memo": 2
};
const CacheTypeMap = Object.keys(CacheType).reduce((sub, key) => {
    sub[CacheType[key]] = key;
    return sub;
}, Object.create(null));
/**自行注册的缓存类型 */
const RegCacheMod = {};
/**缓存前缀键名 */
const PREFIX = "__F_CACHE__";
/**缓存堆键名 */
const STACK_KEY = "_STACK__";
class Cache {
    constructor(conf = {}) {
        /**实例配置 */
        this.config = {
            "type": 0,
            "expires": 0,
            "prefix": "",
            "maxStack": 200
        };
        /**实例存储键前缀 */
        this.prefix = "";
        /**存储数据堆键名 */
        this.stackKey = "";
        /**当前实例已存储的数据堆栈 */
        this.stack = [];
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
                }
                else {
                    this.store = sessionStorage;
                }
        }
        this.stackKey = `${this.prefix}${STACK_KEY}`;
        var stack = this.store.getItem(this.stackKey);
        if (stack) {
            try {
                stack = JSON.parse(stack);
            }
            catch (err) {
                stack = [];
            }
        }
        else {
            stack = [];
        }
        this.stack = stack;
        conf = stack = null;
        return this;
    }
    /**同步堆栈信息 */
    syncStack() {
        this.store.setItem(this.stackKey, JSON.stringify(this.stack));
    }
    /**当前缓存类型存储的数据数量 */
    get length() {
        return this.stack.length;
    }
    /**当前存储是否已经超出上限 */
    get isStackOOM() {
        return this.stack.length >= this.config.maxStack;
    }
    /**
     * 通过 key 与生效条件判断数据是否可以被缓存
     * @param conditions 生效条件
     * @param key        存储 key
     */
    checkConditions(conditions, key) {
        var _a;
        const keyParts = (_a = key.match(Cache.CONDITION_REGEXP)) === null || _a === void 0 ? void 0 : _a[1];
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
                                        re = true;
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
                                re = condition(keyParts, key);
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
    set(key, value, conf) {
        const datConf = merge({
            "expires": this.config.expires
        }, conf);
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
        this.store.setItem(innerKey, JSON.stringify({
            value,
            expires
        }));
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
    get(key) {
        const innerKey = `${this.prefix}${key}`;
        let item = this.store.getItem(innerKey);
        const now = Date.now();
        if (item) {
            item = JSON.parse(item);
            if (item.expires && now > item.expires) {
                this.del(innerKey.slice(this.prefix.length));
                return null;
            }
            else {
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
    del(key) {
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
/**生效条件特征 */
Cache.CONDITION_REGEXP = /@([\w\,\s\=]+)$/;
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
function register(name, mod, type) {
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

export default Cache;
export { CacheType, register };
//# sourceMappingURL=index.esm.js.map

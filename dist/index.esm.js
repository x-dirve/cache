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
var CacheType;
(function (CacheType) {
    /**localStorage */
    CacheType[CacheType["lStorage"] = 0] = "lStorage";
    CacheType[CacheType["sStorage"] = 1] = "sStorage";
    CacheType[CacheType["memo"] = 2] = "memo";
})(CacheType || (CacheType = {}));
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
    set(key, value, conf) {
        const datConf = merge({
            "expires": this.config.expires
        }, conf);
        let expires = datConf.expires;
        if (expires) {
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

export default Cache;
export { CacheType };
//# sourceMappingURL=index.esm.js.map

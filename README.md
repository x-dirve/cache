# 页端缓存模块

缓存数据统一调用模块，支持不同实例使用不同的缓存类型，目前支持 localStorage、sessionStorage、内存缓存。

## 配置
- `type` 缓存类型，可直接传入类型值或者通过 `import {CacheType} from "@x-drive/cache"` 后使用 `CacheType` 中的名称指定，默认使用 `sessionStorage`
    - `0` localStorage
    - `1` sessionStorage
    - `2` 内存。内存型的缓存在第一次被实例化的时候才会被注册到模块中，因此使用者可以在一开始的时候使用 `register` 注册自己的内存型缓存，默认内存缓存的取值是 `2`
- `expires` 全局过期时间
- `prefix` 缓存key前缀
- `maxStack` 限制上限

## 使用

### 存储数据
**set(key: string, value: any, conf?: DataConf): this;**

- `key` 数据键值
- `value` 数据
- `conf` 数据缓存配置
    - `expires` 单条数据过期时间
    - `conditions` 缓存生效条件

```ts
Cache.set("test", 123456);
```

### 获取存储的数据
**get(key: string): any;**

- `key` 存储数据的键值

```ts
Cache.get("test");
```

### 删除已经存储的数据
**del(key: string): this;**

- `key` 存储数据的键值

```ts
Cache.del("test");
```

## 注册缓存模块
模块提供了 `register` 方法用于注册新的缓存模块
```ts
import Cache, { CacheType, register } from "@x-drive/cache";
// 业务使用的特殊缓存
import TaroCache from "@components/cache/@mods/t-cache";
// 注册缓存
register("taro", TaroCache);
// 使用
const TaroCache = new Cache({
    // 通过 CacheType 指定使用的缓存类型
    "type": CacheType.taro
});
```
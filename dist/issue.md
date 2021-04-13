## 说明

> 该文档用于记录WFU 上各浏览器的兼容问题和开发过程中遇到的较为棘手的问题
> 请开发人员按照统一格式编写！

```
1.1 问题描述

- Cause：问题原因
- Solution：解决方法
```
---

## 一、浏览器

### 1.1 Edge


----
### 1.2 Chrome

----
### 1.3 Opera

----
### 1.4 Firefox

#### 1.4.1  Firefox 一个PeerConnection携带三个M行时，演示流中没有携带candidate 问题

- Cause：使用bundle 时，同类型的M行只有一个M行会有candidate
- Solution：创建 RTCPeerConnection 时设置 `bundlePolicy=max-compat`


#### 1.4.2 Firefox 开启共享，收流正常，但是video无法显示远端视频流，stream 大小为0x0 问题

- Cause：解码器的原因。开启协商H264（pt=97），解码不成功，导致显示有问题。去除97的PT后使用126（仍然协商H264），显示正常。
- Solution：去除97编码


#### 1.4.3 Firefox 开演示后不发流，抓包显示只发送了stun包的问题

- Cause：gs_phone 返回的SDP中携带的 `profile-level-id=4280xx` ，浏览器无法成功编码。
- Solution：修改为 `profile-level-id=42e0xx`

----
### 1.5 Safari

#### 1.5.1 Safari 报错：getDisplayMedia must be called from a user gesture handler

- Cause：需要手动点击屏幕共享`getDisplayMedia` 获取流
- Solution：建立websocket之前，先通过手动点击获取流，然后再建立websocket连接，判断是否有流，接着发送开启演示信令，更新会话。
   - 正常浏览器开启演示流程：建立websocket连接 -> 取流 -> 发送开启演示信令 ->  更新会话
   - safari首次开启演示流程：  取流  -> 建立websocket连接 -> 判断是否有流（没有流就取流） -> 发送开启演示信令 -> 更新会话
   - <font color=red>注意：</font> safari 浏览器首次取流的参数是从页面端获取的

#### 1.5.2 Safari 出现现象：开启屏幕共享后最小化窗口，在一定时间内websocket会断开连接

- Cause：最小化窗口后，safari浏览器具有自我安全性的设置，导致websocket在一定时间内断开
- Solution：暂时没有解决办法

----
### 1.6 其他

#### 1.6.1 不同浏览器在共享标签页或窗口后，缩小窗口时会出现黑屏现象

- Cause：是H264的编解码问题导致的。
- Solution：暂时还没有解决办法

## FAQ




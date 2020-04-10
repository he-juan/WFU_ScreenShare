

### 浏览器支持版本

- Chrome 72+ 
- Opera 60+
- Firefox 33+
- Safari 13+

> 说明：
> 1、getDisplayMedia 接口，72版本开始支持。以上版本主要为unified-plan支持版本。
> 2、针对不支持getDisplayMedia的浏览器，WFU不做支持
> 3、使用该时必须使用HTTPS，因为webRTC的接口在非https下，无法访问。


### webRTC 分辨率控制

- gs_phone为对称协商，携带的分辨率根据webRTC 能力决定

- 对于webRTC没有携带的字段，gs_phone认为是不支持的


### webRTC 码率控制

参数：

- b=AS
- b=TIAS
- google私有字段：x-google-min-bitrate、x-google-start-bitrate、x-google-max-bitrate等

> webRTC 发送的码率由gs_phone能力决定。如果gs_phone没有携带控制带宽的参数，webRTC会发送比较低的码率。
> gs_phone 根据web端携带情况添加b行，web端需携带b行参数，web且为了兼容不同浏览器，需同时携带b=AS、b=TIAS
> gs_phone 不支持x-google字段，需web端添加


### 逻辑说明

- 建立通话：
    + 通过 createMediaSession 交换sdp（类似INVITE），建立点对点连接
- 开演示：
    + 通过 updateMediaSession 交换sdp（类似RE-INVITE）
    + sdp处理完成后，再发送 ctrlPresentation 信令，告知gs_phone开启发送演示流
- 暂停演示：
   + 通过操作track enabled 属性实现静音和非静音切换，信令上不做任何操作
- 关演示：
    + 发送 ctrlPresentation 信令告知 gs_phone关闭演示
    + webRTC端不重新协商sdp。关闭演示后删除PC中的演示流
- 结束通话：
    + 通过 destoryMediaSession 结束通话
    + 关闭peerConnection，关闭webSocket连接


### mid 和content 说明

- audio
    - a=mid:0
- main
    - a=mid:1
    - a=content:main
- slides
    - a=mid:2
    - a=content:slides
- gui
    - a=mid:3
    - a=content:gui


> 通过mid标识媒体行，content区分主流、演示流、gui视频流

### FAQ

1、开演示发送 updateMediaSession 和 ctrlPresentation，并处理成功后，遇到ice failed，再次重新updateMediaSession，没有发送ctrlPresentation，此时gs_phone不显示演示流

2、使用captureStream创建三个m行时，audio会在最后面，sdp处理就会出现错误

- 修改 BUNDLE 信息：[done]

```
a=group:BUNDLE 0 1 2
a=msid-semantic: WMS c18e53b4-248f-4502-9ad2-1b147e638883

// 替换为：每路流单独发送
a=msid-semantic: WMS
a=msid-semantic: WMS
a=msid-semantic: WMS
a=group:BUNDLE 0
a=group:BUNDLE 1
a=group:BUNDLE 2
```

- 如果没有流，则删除sdp中的ssrc等相应字段 [done]

- 合并sdp [done]

- 修改mid [done]

- 根据编解码名称去除对应编解码[done]

- Failed to set remote description: InvalidAccessError: Failed to execute 'setRemoteDescription' on 'RTCPeerConnection': 
Failed to set remote answer sdp: The order of m-lines in answer doesn't match order in offer. Rejecting answer.

处理：收到sdp后，设置时，要修改mid为原来的值













> 使用该时必须使用HTTPS，因为webRTC的接口在非https下，无法访问。

### 浏览器支持版本

- Chrome 72+ 
- Opera 60+
- Firefox 33+
- Safari 13+

> 说明：
> 1、getDisplayMedia 接口，72版本开始支持。以上版本主要为unified-plan支持版本。
> 2、针对不支持getDisplayMedia的浏览器，WFU不做支持


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


### FAQ

1、开演示发送 updateMediaSession 和 ctrlPresentation，并处理成功后，遇到ice failed，再次重新updateMediaSession，没有发送ctrlPresentation，此时gs_phone不显示演示流











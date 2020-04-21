

### 浏览器支持版本

- Chrome 72+ 
- Opera 60+
- Firefox 33+
- Safari 13+

> 说明：
> 1、getDisplayMedia 接口，72版本开始支持。以上版本主要为unified-plan支持版本。
> 2、针对不支持getDisplayMedia的浏览器，WFU不做支持
> 3、使用该时必须使用HTTPS，因为webRTC的接口在非https下，无法访问。

----

### webRTC 码率控制

参数：

- b=AS
- b=TIAS
- google私有字段：x-google-min-bitrate、x-google-start-bitrate、x-google-max-bitrate等

> webRTC 发送的码率由gs_phone能力决定。如果gs_phone没有携带控制带宽的参数，webRTC会发送比较低的码率。
> ~~gs_phone 根据web端携带情况添加b行，web端需携带b行参数，web且为了兼容不同浏览器，需同时携带b=AS、b=TIAS~~
> gs_phone 不支持x-google字段，webRTC收到sdp添加x-google等字段控制码率

-----

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

----

#### mid 注意事项

- offer answer中每个m行的mid需对应，例如：offer audio mid=0，answer audio mid=0

- offer answer中每个m行顺序需要一致，如offer audio为第一个m行，answer中的audio也需要在第一个m行

- 需要保存一开始offer中。各个m行的顺序

> 发送invite之前，修改自己的sdp，调整m位置，保持audio在第一个m行。收到对端的sdp后，setRemoteDescription之前，需要修改mid，与offer端创建出来的mid保持一致。


### 功能描述
   
#### web 端
1、建立通话：
    - 通过 createMediaSession 交换sdp（类似INVITE），建立点对点连接
       +  Web->GsPhone ：createMediaSession
       +  GsPhone->Web：createMediaSessionRet
    
    
2、开演示：
    - 通过 updateMediaSession 交换sdp（类似RE-INVITE）,sdp处理完成后，再发送 ctrlPresentation 信令，告知gs_phone开启发送演示流
         +  Web->GsPhone ：updateMediaSession
         +  GsPhone->Web：updateMediaSessionRet 
         +  Web->GsPhone ：ctrlPresentation
         +  GsPhone->Web：ctrlPresentationRet 
        
    
3、暂停演示：
   - 通过操作track enabled 属性实现静音和非静音切换，信令上不做任何操作


4、关演示：
    - 发送 ctrlPresentation 信令告知 gs_phone关闭演示，webRTC端不重新协商sdp。关闭演示后删除PC中的演示流
        +  Web->GsPhone ：ctrlPresentation
        +  GsPhone->Web：ctrlPresentationRet 


5、结束通话：
    - 通过 destoryMediaSession 结束通话，关闭peerConnection，关闭webSocket连接
        + Web->GsPhone: destoryMediaSession
    
----

#### gs_phone

1、请求开启演示
    - 通过 ctrlPresentation 请求开启演示
         +  GsPhone->Web：ctrlPresentation 
    - 允许开启：
         +  Web->GsPhone ：updateMediaSession
         +  GsPhone->Web：updateMediaSessionRet 
         +  Web->GsPhone ：ctrlPresentationRet
    - 拒绝开启：
         + Web->GsPhone ：ctrlPresentationRet

2、请求关闭演示：
    - 通过 ctrlPresentation 请求关闭演示
         +  GsPhone->Web：ctrlPresentation 
    - 允许关闭：
        + 还需要再发送一次 ctrlPresentation 来关闭吗？[思考]
        + Web->GsPhone ：ctrlPresentationRet
    - 拒绝关闭：
        + Web->GsPhone ：ctrlPresentationRet

----
  
#### 逻辑说明

- invite 或 re-invite
    + 收到4xx时直接调用回调
    + 收到2xx时，setRemoteDescriptionSuccess后判断是否需要发送 ctrlPresentation：
        - 需要：发送ctrlPresentation，收到ctrlPresentationRet调用回调
        - 不需要：直接调用回调



-----

### 页面端注册事件说明

- gsRTC.on 修改为 addEventHandler，例如：

- web开演示的回调：addEventHandler('shareScreen', shareScreenHandler)

- web暂停演示：addEventHandler('pauseShareScreen', pauseShareScreenHandler)

- web关闭演示的回调：addEventHandler('stopShareScreen', stopShareScreenHandler)

- web结束通话: addEventHandler('hangup', hangupHandler)

- gs_phone请求开启演示: addEventHandler('shareScreenRequest', shareScreenRequestHandler)

- gs_phone请求关闭演示: addEventHandler('stopShareScreenRequest', stopShareScreenRequestHandler)

- gs_phone请求结束通话: addEventHandler('hangupRequest', hangupRequestHandler)


- shareScreenRequestHandler 或 stopShareScreenRequestHandler调用的时候会传一个 底层的callback(confirm)给你，confirm参数为true表示同意请求，false表示拒绝


----

### 待处理

- 要通过初始invite获取演示的分辨率和帧率


----

### 注意事项

- ~~gs_phone为对称协商，携带的分辨率根据webRTC 能力决定，对于webRTC没有携带的字段，gs_phone认为是不支持的~~   已修改为非对称协商，因为浏览器只支持非对称


----
### FAQ

- 开演示发送 updateMediaSession 和 ctrlPresentation，并处理成功后，遇到ice failed，再次重新updateMediaSession，没有发送ctrlPresentation，此时gs_phone不显示演示流 [待处理]

- 信令交互设计里面，没有带action标识本次请求做的事情[应该优化]


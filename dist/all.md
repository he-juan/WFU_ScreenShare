## Browser compatibility

| Browser |  Edge | Chrome | Opera |  Firefox  |  Safari   |
|:-------:|:-----:|:------:|:-----:|:---------:|:---------:|
| Version |  79+  |  72+   | 60+   |  60+      |   13.0 +  |

注： 强制要求 `Https`。因为 webRTC 取流接口在非安全环境下无法访问，无法取流。

---

## 一、信令交互流程说明

### 1.1 webUI 页面端请求

#### 1.1.1 建立通话

- 通过 `createMediaSession` 交换sdp
```
webUI页面端                            gs_phone设备端
    |---------- createMediaSession ------------>|
    |<--------- createMediaSessionRet ----------|
```

#### 1.1.2 开启屏幕共享

- 通过 `ctrlPresentation` 告知 gs_phone 当前请求开启演示
- 通过 `updateMediaSession` 交换sdp

```
webUI页面端                            gs_phone设备端
    |---------- ctrlPresentation(1) ----------->|
    |<--------- ctrlPresentationRet ------------|
    |---------- updateMediaSession ------------>|
    |<--------- updateMediaSessionRet ----------|
```

#### 1.1.3 停止桌面共享

- 通过 `ctrlpresentation` 告知 gs_phone 当前请求关闭演示
```
webUI页面端                            gs_phone设备端
    |---------- ctrlPresentation(0) --------->|
    |<--------- ctrlPresentationRet ----------|
```

#### 1.1.4 暂停或恢复演示

- 通过操作track enabled 属性实现静音和非静音切换，`不需要进行信令交互`

#### 1.1.5 结束通话

- 通过 `destroyMediaSession` 结束通话
```
webUI页面端                            gs_phone设备端
    |---------- destroyMediaSession(5) ----------->|
    |<--------- destroyMediaSessionRet ------------|
```

---

### 1.2 gs_phone 设备端请求

#### 1.2.1 gs_phone 请求开演示

- 通过 `ctrlPresentation` 告知页面端请求开启演示
- 通过 `updateMediaSession` 交换sdp

```
webUI页面端                            gs_phone设备端
    |<---------- ctrlPresentation(3) -----------|
    |--------- ctrlPresentationRet ------------>|
    |<---------- updateMediaSession ------------|
    |---------- updateMediaSessionRet --------->|
```


#### 1.2.2 gs_phone 请求关闭演示

- 通过 `ctrlPresentation` 告知页面端请求关闭演示
```
webUI页面端                            gs_phone设备端
    |<---------- ctrlPresentation(2) -----------|
    |--------- ctrlPresentationRet ------------>|
```

#### 1.2.3 gs_phone 请求结束通话

- 通过 `destroyMediaSession` 告知页面端请求结束通话
```
webUI页面端                            gs_phone设备端
    |<--------- destroyMediaSession(4) -----------|
    |--------- destroyMediaSessionRet ----------->|
```


## 二、实现逻辑说明

### 2.1 开启屏幕共享

#### 2.1.1 【场景一】webUI页面端 开启演示
- 逻辑
```
取流 => 取流失败？ => 开启失败 => 结束
        取流成功？ => webUI 发送 `ctrlPresentation(1)`
                   => gs_phone 回复ctrlPresentationRet(非200 ok) => 开启失败 => 结束
                   => gs_phone 回复ctrlPresentationRet(200 ok)   => webUI发送 `updateMediaSession` 更新会话信息
                   => gs_phone回复`updateMediaSessionRet`         => 开启成功 => 结束
```

#### 2.1.2 【场景二】gs_phone 设备端请求开启演示

```
gs_pghone 开启演示 => 发送 `ctrlPresentation(3)`
                   => webUI 拒绝开启演示？ => webUI 回复ctrlPresentationRet(非200 ok) => 请求开启失败 => 结束
                   => webUI 同意开启演示？ => 取流 => 取流失败？ => 请求开启失败 => 结束
                                                      取流成功？ =>  请求超时？  => webUI 回复ctrlPresentationRet(非200 ok) => 请求开启失败 => 结束
                                                                 => 请求未超时？ => webUI 回复 ctrlPresentationRet(200 ok)
                                                                 => webUI 发送 updateMediaSession
                                                                 => gs_phone回复`updateMediaSessionRet`
                                                                 => 开启成功 => 结束
```

---


## 三、特殊处理

### 3.1 生成多个 m 行

- 对于支持 `addTransceiver` 接口的浏览器版本，使用 `addTransceiver` 生成M行
```javascript
// 添加m行是为了createOffer时始终保持 audio 行在前面
pc.addTransceiver('audio')
pc.addTransceiver('video')
pc.addTransceiver('video')
```

- 对于不支持 `addTransceiver`接口的浏览器版本，使用 `captureStream` 生成假流，创建M行
```javascript
function getCaptureStream(number){
    let captureStreamArray = []
    let canvas = document.createElement("canvas");
    canvas.id = 'canvasForCaptureStream'
    canvas.style.cssText = "display: none"

    function gum() {
        let stream = null
        if(canvas.captureStream){
            stream = canvas.captureStream(5);
        }else if(canvas.mozCaptureStream){
            stream = canvas.mozCaptureStream(5);
        }else {
            log.warn('Current browser does not support captureStream!!')
            return
        }
        log.info("get captureStream: ", stream)
        return stream
    }

    for(let i = 0; i<number; i++){
        let stream = gum();
        captureStreamArray.push(stream)
    }
    canvas = null
    return captureStreamArray
}

let streamArray = getCaptureStream(2)
if(streamArray && streamArray.length){
    for(let i = 0; i<streamArray.length; i++){
        let stream = streamArray[i]
        log.info('add stream to peerConnection: ' + stream.id)
        pc.addStream(stream)
    }
}else {
    log.warn('Browser is not support captureStream!')
    return
}
```


---
### 3.2 mid 处理逻辑

 1.成功创建SDP后，保存所有m行的原本MID为 `ORIGINAL_MID`

 2.发送SDP前修改MID为 0(audio) 1(main) 2(slides) 3(gui) ，并保留修改后的MID为 `MODIFIED_MID`

 3.收到gs_phone 返回的SDP后，setRemoteDescription 之前，修改MID为原本的 `ORIGINAL_MID`

---

- mid 和content 说明

|类型        | 音频       | 视频       | 演示       | 带控制的主流 |
|:-----------|:-----------|:-----------|:-----------|:-------------|
|content 值  |audio       | video      | slides     | gui          |
|mid         |0           | 1          | 2          | 3            |

注：示例 `a=content:main`


说明：

- mid 修改一方面是为了统一mid格式，另一方面是为了区分多个视频流
- SDP 中M行对应的mid顺序依次递增，如 0 1 2 3， 不能乱序。

---

### 3.3 码率控制

控制参数：

- b=AS
- b=TIAS
- google私有字段：x-google-min-bitrate、x-google-start-bitrate、x-google-max-bitrate等

> 初始入会时gs_phone 携带自己能力，开启共享时根据gs_phone能力获取桌面流



## 四、异常处理

### 4.1 超时处理

 1. 超时第一种情况：
     - gsPhone请求开启演示时，在弹出【是否确定开启屏幕共享】对话框，判断是否存在超时情况；若超时，webUI 回复ctrlPresentationRet(408)；

 2. 超时第二种情况：
     - 弹出【是否确定开启屏幕共享】对话框后，点击【确定】；判断是否存在超时情况；若超时，webUI 回复ctrlPresentationRet(408)；再次弹出浏览器的【共享页面标签】选项框；

 3. 超时第三种情况：
     - 弹出【是否确定开启屏幕共享】对话框后，点击【确定】；弹出浏览器的【共享页面标签】选项框，在取流时判断是否存在超时情况；若超时，webUI 回复ctrlPresentationRet(408)；

  ![gs_phone请求开启演示](/api/file/getImage?fileId=5f46499009eb7d0509000cb5)


### 4.2 gsPhone多次请求开启/关闭屏幕共享（异常处理）

 1. 情况一：正在开启/关闭演示中，再次请求发送开启开启/关闭演示:
      - 采用sendCtrlPresentation做判断处理，若再次发送请求，即sendCtrlPresentation为true，webUI 回复ctrlPresentationRet(104(open shareScreen)/105(stop shareScreen))；

 2. 情况二：请求关闭演示的回复信令后，再次收到关闭演示的信令：
      - 采用openSharing做判断处理，当openSharing为false时，若再次接收到发送关闭演示的请求，webUI 回复ctrlPresentationRet(106)；


### 4.3 错误码处理

 1. 1.错误码说明(GVC3220_Beta)

       |   classification   | Code      | Description                                                                                       |
       |:-------------------|:----------|:--------------------------------------------------------------------------------------------------|
       |  共有错误码         |           |                                                                                                   |
       |                    |  200      |  operate success                                                                                  |
       |                    |  408      |  open shareScreen timeout                                                                         |
       |  上层错误码         |           |                                                                                                   |
       |                    |  100      |  webSocket address is not a valid address                                                         |
       |                    |  301      |  The current browser version does not support Screen share                                        |
       |                    |  403      |  refuse to shareScreen    (cancel shareScreen)                                                    |
       |                    |  405      |  the call in Hold status  (refuse to shareScreen)                                                 |
       |                    |  488      |  Media information ERROR                                                                          |
       |                    |  466      |  Websocket automatically disconnected                                                             |
       |  底层错误码         |           |                                                                                                   |
       |                    |  104      |  Share screen is being turned on                                                                  |
       |                    |  105      |  Stop Share Screen is being turned on                                                             |
       |                    |  106      |  Reject shareScreen or stopShareScreen request again after replying to the signaling              |
       |                    |  201      |  Present turn On Request denied                                                                   |
       |                    |  202      |  Present turn Off Request denied                                                                  |
       |                    |  203      |  hang up Request denied                                                                           |

    - 错误说明：
         - 底层错误码情况：
             - 若错误码为2XX,表示此信令为正常处理；
             - 若错误码为4XX,表示此信令为异常处理；
             - 若错误码为1xx,表示此信令无效，不采取任何动作（表示此信令是重复操作）

 2. 2.修改后错误码说明（GVC3220）
    - (1) 2XX 错误码
         > 2XX错误码均代表请求执行成功，仅在响应中携带。

          |Code   | Description   |
          |:------|:--------------|
          |200    | 请求执行成功    |


    - (2) 3XX 错误码
           > 3XX错误码是webRTC的JS层内部的错误码，该错误码的产生和GVC无关，由webRTC的JS层内部自定义。
          |  Code     |   Description                                                                       |
          |:----------|:------------------------------------------------------------------------------------|
          |  300      |   webSocket address is not a valid address                        (对应之前的100)   |
          |  301      |   The current browser version does not support Screen share                         |
          |  302      |   Websocket automatically disconnected                           (对应之前的466)    |
          |  303      |   refuse to shareScreen                        (cancel shareScreen，对应之前的403)  |
          |  308      |   open shareScreen timeout                                       （对应之前的408）  |

    - (3) 4XX 错误码

         > 4XX是请求执行失败的错误码，仅在响应中携带。
         |  Code     | Description                                                                                                 |
         |:--------|:--------------------------------------------------------------------------------------------------------------|
         |  400      |  the request is supported, but the paramter format error                                                    |
         |  403      |  reject to run the request (请求开演示拒绝/请求关演示拒绝/请求挂断拒绝)                                                                                 |
         |  405      |  request isn't supported                                                                                     |
         |  408      |  the request run time out, when the request don't receive response, this will created by local autoly        |
         |  481      |  the user isn't in the call                                                                                  |
         |  486      |  device can't provide line to process the call                                                               |
         |  487      |  the user has already in the call                                                                            |
         |  488      |  media infomation error, this error will be created when local can't provide media stream process capability |
         |  489      |  request canceled                                                                                                    |

    - (4) 5XX 错误码
         > 5XX错误码仅在请求中携带，该错误码表示发出该请求的原因，一般来说，请求不会携带该错误码。
         |  Code     |   Description                                                               |
         |:----------|:----------------------------------------------------------------------------|
         |  501      |   other web browser use the same user name, and replace the call             |
         |  502      |   device need more line, and hangUp the call with the browser               |

    - (5) 1XX 错误码
         > 1XX错误码仅在响应中携带，该错误表示支持处理相关的请求，但是请求的执行是无效的，即目前已经是执行过相关请求的状态，请求重复。
         |Code       |    Description                                                                                          |
         |:----------|:--------------------------------------------------------------------------------------------------------|
         |  104      |   Share screen is being turned on                                                                       |
         |  105      |   Share Screen is being turned off                                                                      |
         |  106      |   No stream or Reject shareScreen or stopShareScreen request again after replying to the signaling       |


    - 错误说明：
          - 底层错误码情况：
              - 若错误码为2XX,表示此信令为正常处理；
              - 若错误码为4XX,表示此信令为异常处理；
              - 若错误码为1xx,表示此信令无效，不采取任何动作（表示此信令是重复操作）



----------

 **4.4 添加cancel流程**

 1. cancel处理流程

   - <font color =red>针对类别区分场景处理：</font>
   - 1. 发送`ctrlPresentation`后，用户不点击浏览器【停止共享】按钮
     - (1) gsPhone没有回复`ctrlPresentationRet`
              - 直到超时后gsPhone回复`ctrlPresentationRet`为408;(超时)
      - (2) gsPhone回复`ctrlPresentationRet`
             - 若回复`ctrlPresentationRet`为4xx, 直接关闭流即可;  回复之后清除定时器，当为4xx后重置状态位
             - 若回复`ctrlPresentationRet`为200, 直接进行update流程；
      注：可能gsPhone可发送cancel过来，如果存在，则需要根据发送cancel和回复的`ctrlPresentationRet`来处理
             - 回复`ctrlPresentationRet`为4XX
                 -  如果gsPhone先发cancel后回复 `ctrlPresentationRet` ,可根据`ctrlPresentationRet`或者回复的`cancelRequest`去清除 状态；
                 -  如果gsPhone先回复`ctrlPresentationRet` 后发送cancel，则根据回复的`cancelRequest`去清除 状态
             - 回复`ctrlPresentationRet`为200，直接走update流程；

   - 2. 发送`ctrlPresentation`后，用户点击浏览器【停止共享】按钮
      - 2.1 gsPhone没有回复`ctrlPresentationRet`
             - 用户点击后,webUI 发送`cancelRequest`,gsPhone回复`ctrlPresentationRet`为489（表示取消请求）且回复`cancelRequestRet`为200；
      - 2.2 gsPhone回复`ctrlPresentationRet`
             - (1) 此时开启演示未成功（openSharing字段）（可不要）(此时回复只能是4xx)
                  - 若回复`ctrlPresentationRet`为4xx 且用户点击后发送了`cancelRequest`;(这个要看先后顺序)
                      - 若gsPhone先回复`ctrlPresentationRet` 后webUI发送`cancelRequest`,则在回复错误码为4xx时已经处理了关闭流；则在回复`cancelRequestRet`时清除状态
                      - 若webUI先发送`cancelRequest` gsPhone后回复`ctrlPresentationRet`,则错误码为489时清除状态
                  - 若回复`ctrlPresentationRet`为200，直接进行update流程；
                      - 如若用户此时点击【停止共享】，则直接stopScreen
             - (2) 此时开启演示成功（openSharing字段）
                 - 若用户点击后发送了`cancelRequest`且回复了`ctrlPresentationRet`（需要看先后顺序）
                     - 若gsPhone先回复`ctrlPresentationRet`,用户后点击【停止共享】发送`cancelRequest`，则在回复`cancelRequestRet`时清除状态
                     - 若用户先点击【停止共享】发送`cancelRequest`,后回复`ctrlPresentationRet`,则在200时判断是否发送`cancelRequest`,若是则重置状态；若不是则继续update流程

  ![title](/api/file/getImage?fileId=6066916e09eb7d05090058d3)
  【webUI】
   1. 在发起`ctrlPresentation`信令时，可以随时发送`cancelRequest`请求（即取消开启演示信令），gsPhone回复取消开启演示信令（`cancelRequestRet`）后，会针对之前的发送开启演示信令`ctrlPresentation`回复响应`ctrlPresentationRet`且codeType为4XX；


## Browser compatibility

| Browser |  Edge | Chrome | Opera |  Firefox  |  Safari   | 
|:-------:|:-----:|:------:|:-----:|:---------:|:---------:|
| Version |  79+  |  72+   | 60+   |  60+      | 13.0+     |

注： 强制要求 `Https`。因为 webRTC 取流接口在非安全环境下无法访问，无法取流。

---

## 对外接口说明

1、preInit()

- 初始化 GsRTC 参数

----

2、建立通话

- call(wsAddr, callback)
- 和gs_phone 建立呼叫
- 参数
    + wsAddr： ws连接地址，例：ws://192.168.131.172:10200   
    + callback(codeType)： 回调函数。codeType=200时表示成功，其他表示失败

---

3、开启屏幕共享

- beginScreen(callback)
- 开启屏幕共享
- 参数
    - callback：回调函数。参数codeType=200 表示开演示成功，其他表示失败

---

4、暂停演示

- pausePresent(isMute, callback)
- 共享过程中暂停演示或恢复演示
- 参数
    + isMute: true 表示暂停，false 表示回复演示。
    + callback：回调函数，参数为codeType=200时表示成功，其他表示失败。

---

5、停止桌面共享

- stopScreen(callback)
- 停止桌面共享。
- 参数说明：
    + callback：回调函数，参数codeType=200时表示成功，其他表示失败。

---

6、结束通话

- hangUP(callback)
- 结束通话
- 参数
    + callback：回调函数


7、开启远程会控
- openRemoteControl(callback)
- 开启远程会控
- 参数
   + callback： 回调函数，参数为codeType=200时表示成功，其他表示失败。
   
8、关闭远程会控

- stopRemoteControl(callback)
- 关闭远程会控
- 参数
     + callback： 回调函数，参数为codeType=200时表示成功，其他表示失败。   
   

## 注册事件说明

1、web开演示的回调
```
window.gsRTC.on('shareScreen', (res) => {
    console.log('BEGIN_SCREEN ************************')
})
```

2、web关闭演示的回调
```
window.gsRTC.on('stopShareScreen', (res) => {
  console.log('STOP_SCREEN ************************')
})
```

3、web暂停演示
```
window.gsRTC.on('pauseShareScreen', (res) => {
  console.log('pauseShareScreen ************************')
})
```

4、web结束通话
```
window.gsRTC.on('hangup', (res) => {
  console.log('hangup ************************')
})
```

5、gs_phone请求开启演示
```
window.gsRTC.on('shareScreenRequest', (res) => {
  console.log('shareScreenRequest ************************')
})
```

6、gs_phone请求关闭演示
```
window.gsRTC.on('stopShareScreenRequest', (res) => {
  console.log('stopShareScreenRequest ************************')
})
```

7、gs_phone请求结束通话
```
window.gsRTC.on('hangupRequest', (res) => {
  console.log('hangupRequest ************************')
})
```

8、web开启远程会控

```
window.gsRTC.on('openRemoteControl', (res) => {
  console.log('openRemoteControl ************************')
})
```

9、web关闭远程会控

```
window.gsRTC.on('stopRemoteControl', (res) => {
  console.log('stopRemoteControl ************************')
})
```

10、监听远端流：
   
 ```
 window.gsRTC.on('onStreamChange', (data) => {
   console.log('获取流 ************************')
 })
 ```  

## 错误码说明

  - 1.错误码说明(GVC3220_Beta)

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


  - 2.修改后错误码说明（GVC3220）
     - (1) 2XX 错误码
          > 2XX错误码均代表请求执行成功，仅在响应中携带。

           |Code   | Description   |
           |:------|:--------------|
           |200    | 请求执行成功    |

     - (2) 3XX 错误码
            > 3XX错误码是webRTC的JS层内部的错误码，该错误码的产生和GVC无关，由webRTC的JS层内部自定义。

           |  Code     |   Description                                                                       |
           |:----------|:------------------------------------------------------------------------------------|
           |  300      |   webSocket address is not a valid address                        (对应之前的100)    |
           |  301      |   The current browser version does not support Screen share                         |
           |  302      |   Websocket automatically disconnected                           (对应之前的466)     |
           |  303      |   refuse to shareScreen                        (cancel shareScreen，对应之前的403)   |
           |  308      |   open shareScreen timeout                                       （对应之前的408）    |

     - (3) 4XX 错误码

          > 4XX是请求执行失败的错误码，仅在响应中携带。

          |  Code     | Description                                                                                                 |
          |:--------|:--------------------------------------------------------------------------------------------------------------|
          |  400      |  the request is supported, but the paramter format error                                                    |
          |  403      |  reject to run the request (请求开演示拒绝/请求关演示拒绝/请求挂断拒绝)                                           |
          |  405      |  request isn't supported                                                                                     |
          |  408      |  the request run time out, when the request don't receive response, this will created by local autoly        |
          |  481      |  the user isn't in the call                                                                                  |
          |  486      |  device can't provide line to process the call                                                               |
          |  487      |  the user has already in the call                                                                            |
          |  488      |  media infomation error, this error will be created when local can't provide media stream process capability |
          |  489      |  request canceled                                                                                            |

     - (4) 5XX 错误码
          > 5XX错误码仅在请求中携带，该错误码表示发出该请求的原因，一般来说，请求不会携带该错误码。

          |  Code     |   Description                                                               |
          |:----------|:----------------------------------------------------------------------------|
          |  501      |   other web browser use the same user name, and replace the call            |
          |  502      |   device need more line, and hangUp the call with the browser               |

     - (5) 1XX 错误码
          > 1XX错误码仅在响应中携带，该错误表示支持处理相关的请求，但是请求的执行是无效的，即目前已经是执行过相关请求的状态，请求重复。

          |Code       |    Description                                                                                          |
          |:----------|:--------------------------------------------------------------------------------------------------------|
          |  104      |   Share screen is being turned on                                                                       |
          |  105      |   Share Screen is being turned off                                                                      |
          |  106      |   No stream or Reject shareScreen or stopShareScreen request again after replying to the signaling      |

     - 错误说明：
         - 底层错误码情况：
            - 若错误码为2XX,表示此信令为正常处理；
            - 若错误码为4XX,表示此信令为异常处理；
            - 若错误码为1xx,表示此信令无效，不采取任何动作（表示此信令是重复操作）
               
               
 -----------
 
 **前端调用底层接口逻辑**     
 
  1. 创建通话：
  
     - 首先创建通话,调用接口`window.call()`
     
  2.  开启共享 或者 关闭共享：
      - 调用接口`window.beginScreen()`  或者 `window.stopScreen()`
  
  3. 开启会控 或者 关闭会控：
      - 调用接口`window.openRemoteControl()`  或者 `window.stopRemoteControl()`  
      
  4. 关闭通话：  
     - 调用接口`window.hangUP()`
     
  -------------------------------------------
     
  - P21V4 与GVC3220 在sdp 的区别：
       - GVC3220:(共享功能)
         - createMediaSession时 默认方向都是recvonly; updateMediaSession时修改演示流方向为sendrecv，对端回复的是recvonly。
       - P21V4:（共享功能和会控功能）
         - createMediaSession时 默认方向都是inactive; 更新sdp（reinvite）时根据对应的功能修改方向。
         - 开启演示时 updateMediaSession修改演示流方向为sendonly，对端回复是recvonly;  关闭演示采用ctrlPresentation流程，不采用sdp处理。
         - 开启会控时 updateMediaSession修改主流方向为recvonly，对端回复是sendonly; 关闭会控时 updateMediaSession修改主流方向为inactive，对端回复是inactive；
         - 同时开启演示和开启会控互不影响。    
      
            
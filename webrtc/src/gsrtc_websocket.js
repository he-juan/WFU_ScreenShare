/*Log Debug Start*/
var log = {
    debug: window.debug("WebSocket:DEBUG"),
    log: window.debug("WebSocket:LOG"),
    info: window.debug("WebSocket:INFO"),
    warn: window.debug("WebSocket:WARN"),
    error: window.debug("WebSocket:ERROR")
};
/*Log Debug End*/


/**
 * create webSocket instance
 * @param data
 * @returns {WebSocket|*}
 * @constructor
 */
let WebSocketInstance = function (data) {
    log.info('create new webSocket.')
    if (GsRTC.prototype.tskStringIsNullOrEmpty(data.url)) {
        throw new Error("ERR_INVALID_PARAMETER_VALUE: '" + data.url + "' is not valid as webSocket url value");
    }
    if (GsRTC.prototype.tskStringIsNullOrEmpty(data.protocol)) {
        throw new Error("ERR_INVALID_PARAMETER_VALUE: '" + data.protocol + "' is not valid as protocol value");
    }

    if(this instanceof WebSocketInstance){
        this.ws = this.createWebSocket(data)
    }else {
        return new WebSocketInstance(data)
    }
}

/**
 * create new webSocket
 * @param data
 * @returns {WebSocket}
 */
WebSocketInstance.prototype.createWebSocket = function(data){
    log.info('create webSocket')
    if (GsRTC.prototype.tskStringIsNullOrEmpty(data.url)) {
        throw new Error("ERR_INVALID_PARAMETER_VALUE: '" +data. url + "' is not valid as webSocket url value");
    }

    let This = this
    log.info('Connecting to \'' + data.url);
    let ws = new WebSocket(data.url, data.protocol)

    ws.onopen = function (event) {
        log.info('websocket onopen, prepare call...')
        gsRTC.sokect.ws.websocketTimer = setInterval(function(){
            if(gsRTC.sokect.ws.readyState == 1){
                let wsData = "\r\n"
                gsRTC.sokect.ws.send(wsData)
            }else{
               log.info("websocket 建立失败")
            }
        },5000)
        This.isChannelOpen = true;
        gsRTC.inviteCall({callback: data.callback});
    }

    ws.onmessage = function (event) {
        if(event.data !== "\r\n\r\n"){
            This.handleIncomingMessage(event.data)
        }
    }

    ws.onclose = function (event) {
        log.info('websocket onclose')
        This.isChannelOpen = false
        if(gsRTC.RTCSession.sharingPermission !== 4  && gsRTC.RTCSession.sharingPermission !== 5){
            log.warn("同步按钮状态")
            gsRTC.trigger("error", {
                codeType: gsRTC.CODE_TYPE.WEBSOCKET_CLOSE.codeType,
                message: gsRTC.CODE_TYPE.WEBSOCKET_CLOSE
            });
            gsRTC.cleanGsRTC()
        }

    }

    ws.onerror =function(error) {
        log.info('websocket onerror:',error)
    }
    return ws
}

/**
 * 处理收到的 webSocket消息
 * @param message
 */
WebSocketInstance.prototype.handleIncomingMessage = function(message){
    let This = this
    let code = null
    let showCode = null
    let messageObj = JSON.parse(message)
    let action = Object.keys(messageObj)[0]
    log.info('handleIncomingMessage of: ' + action)

    let data = messageObj[action]
    if(data.rspInfo) {
        code = data.rspInfo.rspCode;
    }
    if(data.rspInfo){
        showCode = data.rspInfo.showCode
    }

    if(action === 'ctrlPresentation'){
        if(data.sendPermission === 3){
            gsRTC.RTCSession.openSharingTimeoutstartTime = (new Date()).getTime()
        }
        log.info("receive "+ action +" message:",JSON.stringify(messageObj, null, '  '))
    } else{
        if(action === 'ctrlPresentationRet'){
            gsRTC.RTCSession.isOpenSharingReceiveReply = true
            gsRTC.clearTimer()
        } else if(action === 'cancelRequest'){
            //暂时没有
        } else if(action === 'updateMediaSessionRet'){
            gsRTC.RTCSession.cancelReqCmd = null
            gsRTC.RTCSession.cancelReqId = null
            gsRTC.RTCSession.reqId = null
        }
        log.info("receive "+ action +" message:",JSON.stringify(data.rspInfo, null, '  '))
    }

    switch (action) {
        case gsRTC.SIGNAL_EVENT_TYPE.INVITE_RET.name:
        case gsRTC.SIGNAL_EVENT_TYPE.RE_INVITE_RET.name:
            if (gsRTC.isNxx(2, code)) {
                let sdp = data.sdp.data
                log.info(gsRTC.action + ' success')
                gsRTC.RTCSession.handleRemoteSDP(sdp)
            } else if (gsRTC.isNxx(4, code)) {
                let stream = gsRTC.shareScreenStream
                if (gsRTC.getBrowserDetail().browser === 'safari') {
                    gsRTC.RTCSession.stopTrack(stream)
                } else {
                    stream = null
                }
                gsRTC.RTCSession.peerConnection.close()
                gsRTC.CODE_TYPE.REFUSE_CALL.isCallSuccess = 'false'
                log.error(code + ', ' + data.rspInfo.rspMsg)
                gsRTC.trigger('error', {
                    codeType: code,
                    message: data.rspInfo.rspMsg,
                    showCode: showCode,
                    isCallSuccess: gsRTC.CODE_TYPE.REFUSE_CALL.isCallSuccess
                });
            }
            break;
        case gsRTC.SIGNAL_EVENT_TYPE.PRESENT.name:
            // gs_phone请求开演示
            gsRTC.RTCSession.reqId = data.reqId
            if (data.sendPermission === 2) {
                if(gsRTC.RTCSession.sendCtrlPresentation === true){
                    log.info("Stop Share Screen is being turned on")
                    gsRTC.sokect.sendMessage({type: gsRTC.SIGNAL_EVENT_TYPE.PRESENT_RET, ctrlPresentationRet: gsRTC.CODE_TYPE.PRESENT_OFF_SHARING, reqId: gsRTC.RTCSession.reqId})
                }else{
                    log.warn('receive request to turn off desktop sharing')
                    gsRTC.RTCSession.sendCtrlPresentation = true
                    gsRTC.serverAction = 'stopShareScreenRequest'
                    gsRTC.trigger('stopShareScreenRequest', gsRTC.serverPresentRequest)
                }

            } else if (data.sendPermission === 3) {
                if( gsRTC.RTCSession.sendCtrlPresentation === true ){
                    log.info("Share Screen is being turned on")
                    gsRTC.sokect.sendMessage({type: gsRTC.SIGNAL_EVENT_TYPE.PRESENT_RET, ctrlPresentationRet: gsRTC.CODE_TYPE.PRESENT_ON_SHARING, reqId: gsRTC.RTCSession.reqId})
                }else{
                    log.warn('receive request to turn on desktop sharing')
                    gsRTC.RTCSession.sendCtrlPresentation = true
                    gsRTC.openSharingTimeout(data)
                    gsRTC.serverAction = 'shareScreenRequest'
                    gsRTC.trigger('shareScreenRequest', gsRTC.serverPresentRequest)
                }
            }
            break
        case gsRTC.SIGNAL_EVENT_TYPE.PRESENT_RET.name:
            if (gsRTC.isNxx(2, code)) {
                if (gsRTC.RTCSession.sharingPermission === 1) {
                    log.info('present on request ' + code)
                    if(gsRTC.RTCSession.isSendCancelRequest){
                        let stream = gsRTC.MEDIA_STREAMS.LOCAL_PRESENT_STREAM
                        if(stream){
                            gsRTC.RTCSession.closeStream(stream)
                        }
                        gsRTC.sokect.sendMessage({type: gsRTC.SIGNAL_EVENT_TYPE.CLOSE, close: { value: gsRTC.sharingPermission, reqId: gsRTC.reqId}})
                        gsRTC.RTCSession.isOpenSharingReceiveReply = false
                        gsRTC.RTCSession.isSendCancelRequest = false
                        gsRTC.RTCSession.sharingPermission = 0
                        gsRTC.RTCSession.reqId = null
                    }else{
                        gsRTC.RTCSession.openSharing = true
                        gsRTC.RTCSession.reqId = null
                        log.info('get Present stream success ')
                        let stream = gsRTC.MEDIA_STREAMS.LOCAL_PRESENT_STREAM
                        let pc = gsRTC.RTCSession.peerConnection
                        log.info('prepare do offer!')
                        gsRTC.RTCSession.processAddStream(stream, pc, 'slides')
                        gsRTC.RTCSession.doOffer(pc)
                    }
                } else {
                    if(gsRTC.RTCSession.sharingPermission === 0){
                        gsRTC.RTCSession.openSharing = false
                    }
                    log.info('present off request ' + code)
                    log.info('codeType:', code + ', ' + 'message:', data.rspInfo.rspMsg)
                    gsRTC.trigger(gsRTC.action, {
                        codeType: code,
                        message: data.rspInfo.rspMsg,
                        showCode: showCode,
                    });
                }
            } else if (gsRTC.isNxx(4, code)) {
                let stream = gsRTC.MEDIA_STREAMS.LOCAL_PRESENT_STREAM
                if(stream){
                    gsRTC.RTCSession.closeStream(stream)
                }
                gsRTC.RTCSession.cancelReqCmd = null
                gsRTC.RTCSession.cancelReqId = null
                gsRTC.RTCSession.openSharing = false
                if(code === 408 ||code === 489){
                    log.error(code + ', ' + data.rspInfo.rspMsg)
                    if(gsRTC.RTCSession.isSendCancelRequest){
                        gsRTC.RTCSession.sharingPermission = 0
                        gsRTC.RTCSession.isSendCancelRequest = false
                        gsRTC.RTCSession.isOpenSharingReceiveReply = false
                        gsRTC.RTCSession.reqId = null
                    }
                }
                gsRTC.trigger('error', {
                    codeType: code,
                    message: data.rspInfo.rspMsg,
                    showCode: showCode,
                });
            }
            break
        case gsRTC.SIGNAL_EVENT_TYPE.CANCEL.name:
            gsRTC.RTCSession.reqId = data.reqId
            gsRTC.RTCSession.sharingPermission = 0
            gsRTC.RTCSession.reqId = null
            log.info("cancel:" + code + ', ' + data.rspInfo.rspMsg)
            if(gsRTC.isNxx(2, code)){
                gsRTC.sokect.sendMessage({type: gsRTC.SIGNAL_EVENT_TYPE.CANCEL_RET, cancelRequestRet: code, reqId: data.reqId})
            }
            break
        case gsRTC.SIGNAL_EVENT_TYPE.CANCEL_RET.name:
            gsRTC.RTCSession.reqId = data.reqId
            gsRTC.RTCSession.cancelReqId = null
            gsRTC.RTCSession.cancelReqCmd = null
            gsRTC.RTCSession.sharingPermission = 0
            gsRTC.RTCSession.isOpenSharingReceiveReply = false
            gsRTC.RTCSession.reqId = null
            log.info("cancel_ret:" + code + ', ' + data.rspInfo.rspMsg)
            break
        case gsRTC.SIGNAL_EVENT_TYPE.BYE.name:
            if(gsRTC.isNxx(5, code)){
                gsRTC.trigger('error', {
                    codeType:code,
                    message: data.rspInfo.rspMsg,
                    showCode: showCode
                })
            }
            //gs_phone 请求挂断
            gsRTC.reqId = data.reqId
            log.warn('receive request to hangup')
            gsRTC.RTCSession.openSharingTimeoutstartTime = null
            gsRTC.serverAction = 'hangupRequest'
            gsRTC.trigger('hangupRequest', gsRTC.serverPresentRequest)
            break
        case gsRTC.SIGNAL_EVENT_TYPE.BYE_RET.name:
            gsRTC.cleanGsRTC()
            gsRTC.trigger(gsRTC.action, {
                codeType: code,
                message: data.rspInfo.rspMsg,
                showCode: showCode
            });
            break
        default:
            break
    }
}

/**
 * 根据交互设计协议，发送不同结构体信息
 * @param data
 */
WebSocketInstance.prototype.sendMessage = function (data) {
    let This = this
    if(!This.ws){
        log.warn('websocket has not been created yet to send message')
        return
    }

    let reqId = parseInt(Math.round(Math.random()*100));
    let info = {
        userName: gsRTC.conf.userName,
        reqId: data.reqId ? data.reqId : reqId,
    }
    let signalType = data.type.name
    let message = {}
    message[signalType] = info
    if(data.mediaSession){
        info.sdp = {
            length: data.mediaSession.length,
            data: data.mediaSession,
        }
        log.info('Establish or update a session')
    }else if(data.ctrlPresentation){
        info.sendPermission = data.ctrlPresentation.value
        if(data.ctrlPresentation.value === 1){
            gsRTC.RTCSession.cancelReqCmd = signalType
            gsRTC.RTCSession.cancelReqId = info.reqId
        }
        log.info('send present control message: \n' + JSON.stringify(info))
    }else if(data.ctrlPresentationRet) {
        info.rspInfo = {
            rspCode: data.ctrlPresentationRet.codeType,
            rspMsg: data.ctrlPresentationRet.message
        }
        gsRTC.RTCSession.reqId = null
        log.info('send present control response message: \n' + JSON.stringify(info))
    }else if(data.cancelRequest){
        info.sendPermission = data.cancelRequest.value
        info.cancelReqId =  gsRTC.RTCSession.cancelReqId
        info.cancelReqCmd =  gsRTC.RTCSession.cancelReqCmd
        log.info('send cancel shareScreen signaling message: \n' + JSON.stringify(info))
    }else if(data.cancelRequestRet){
        info.rspInfo = {
            rspCode: data.cancelRequestRet.codeType,
            rspMsg: data.cancelRequestRet.message
        }
        gsRTC.RTCSession.reqId = null
        log.info('send cancel shareScreen signaling response message: \n' + JSON.stringify(info))
    }else if(data.destroyMediaSession){
        info.sdp = {
            length: data.destroyMediaSession.length,
            data: data.destroyMediaSession,
        }
        log.info('send hangup control message: \n' + JSON.stringify(info))
    }else if(data.destroyMediaSessionRet){
        info.rspInfo = {
            rspCode: data.destroyMediaSessionRet.codeType,
            rspMsg: data.destroyMediaSessionRet.message
        }
        gsRTC.RTCSession.reqId = null
        log.info('send hangup control response message: \n' + JSON.stringify(info))
    }

    log.warn("ws send message");

    This.ws.send(JSON.stringify(message))
    if(data.ctrlPresentation && data.ctrlPresentation.value === 1){
        gsRTC.RTCSession.openSharingTimeoutstartTime = (new Date()).getTime()
        gsRTC.replyOpenSharingTimeout()
    }
}


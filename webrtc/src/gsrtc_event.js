var log = {};
log.debug = window.debug("GSRTC_EVENT:DEBUG");
log.log = window.debug("GSRTC_EVENT:LOG");
log.info = window.debug("GSRTC_EVENT:INFO");
log.warn = window.debug("GSRTC_EVENT:WARN");
log.error = window.debug("GSRTC_EVENT:ERROR");
/*Log Debug End*/

/**
 * Event registration
 */
GsRTC.prototype.eventBindings = function(){
    log.info('event binding.')
    let This = this
}

/**
 * 获得授权后处理
 * @param confirm: true 表示同意， false表示拒绝
 */
GsRTC.prototype.serverPresentRequest = function (confirm) {
    log.info("confirm:",confirm)
    let This = this
    switch (This.serverAction) {
        case 'shareScreenRequest':
            if(confirm){
                This.RTCSession.sharingPermission = 3
                beginScreen()
            }else {
                This.sokect.sendMessage({type: This.SIGNAL_EVENT_TYPE.PRESENT_RET, ctrlPresentationRet: This.CODE_TYPE.SHARE_SCREEN_REQUEST_REFUSE, reqId: This.RTCSession.reqId})
                if(This.RTCSession.timeBox){
                    clearInterval(This.RTCSession.timeBox)
                    This.RTCSession.timeBox = null
                }
                This.RTCSession.openSharingTimeoutstartTime = null
                This.RTCSession.openSharingTimestamp = null
                This.RTCSession.sendCtrlPresentation = false
            }
            break
        case 'stopShareScreenRequest':
            if(confirm){
                This.RTCSession.sharingPermission = 2
                stopScreen()
            }else {
                This.sokect.sendMessage({type: This.SIGNAL_EVENT_TYPE.PRESENT_RET, ctrlPresentationRet: This.CODE_TYPE.STOP_SHARE_SCREEN_REQUEST_REFUSE, reqId: This.RTCSession.reqId})
                This.RTCSession.sendCtrlPresentation = false
            }
            break
        case 'hangupRequest':
            if(confirm){
                This.RTCSession.sharingPermission = 4
                hangUP()
            }else{
                This.sokect.sendMessage({type: This.SIGNAL_EVENT_TYPE.BYE_RET, destroyMediaSessionRet: This.CODE_TYPE.HANG_UP_REQUEST_REFUSE, reqId: This.RTCSession.reqId})
            }
            break
        default:
            break
    }

    This.serverAction = null
}
/**
 * 从发送演示信令到取流的过程中计算时间，查看是否超时（针对远程遥控处理）
 *
 */
GsRTC.prototype.openSharingTimeout = function(data){
    log.info("Whether share desktop time out")
    let  This = this
    let session = This.RTCSession
    session.timeBox = setInterval(function(){
        session.openSharingTimestamp = Math.round(((new Date()).getTime() - session.openSharingTimeoutstartTime)/1000)
        if(session.openSharingTimestamp > 30){
            if(session.sharingPermission !== 3){
                session.openSharingTimestamp = null
            }
            log.info("shareScreen timeout")
            This.action = 'shareScreenRequest'
            session.reqId = data.reqId
            This.sokect.sendMessage({type: This.SIGNAL_EVENT_TYPE.PRESENT_RET, ctrlPresentationRet: This.CODE_TYPE.SHARE_SCREEN_TIMEOUT, reqId: session.reqId})
            This.trigger("error",{ codeType: This.CODE_TYPE.SHARE_SCREEN_TIMEOUT.codeType, message: This.CODE_TYPE.SHARE_SCREEN_TIMEOUT.message})
            session.openSharingTimeoutstartTime = null
            session.sendCtrlPresentation = false
            clearInterval(session.timeBox)
        }
    }, 1000)
}

/**
 * 从开始发送演示信令到收到演示信令的回复信令，查看是否超时（针对webUI处理）
 */
GsRTC.prototype.replyOpenSharingTimeout = function(){
    let This = this
    let stream = This.MEDIA_STREAMS.LOCAL_PRESENT_STREAM
    This.RTCSession.timeBox = setInterval(function(){
        This.RTCSession.openSharingTimestamp = Math.round(((new Date()).getTime() -  This.RTCSession.openSharingTimeoutstartTime)/1000)
        if( This.RTCSession.openSharingTimestamp >  This.RTCSession.replyOpenSharingTimerTime && stream){
            log.warn("timeOut and no receive reply of shareScreen signaling")
            if(stream){
                This.sendCancel(stream)
            }
        }
    },1000)
}
/**
 * 从webui页面获取参数:分辨率
 */

GsRTC.prototype.getResolutionFromWebUI =  function(getPreImgSize){
    log.info("get webUI Resolution")
    getPreImgSize = parseInt(getPreImgSize)
    let resolution = {}
    if(getPreImgSize === 720){
        resolution = {width: 1280, height: 720}
    }else if(getPreImgSize === 1080){
        resolution = {width: 1920, height: 1080}
    }
    log.warn("resolution:",resolution)
    return resolution;
}

/**
 * 清除定时器
 * */
GsRTC.prototype.clearTimer = function(){
    let This = this
    if(This.RTCSession.timeBox){
        clearInterval( This.RTCSession.timeBox)
    }
    This.RTCSession.timeBox = null
    This.RTCSession.openSharingTimeoutstartTime = null
    This.RTCSession.openSharingTimestamp = null
}


/**
 * 发送cancel信令
 * */
GsRTC.prototype.sendCancel = function (stream){
    log.info("send cancel process")
    let This = this
    if(stream){
        This.RTCSession.closeStream(stream)
    }
    This.sokect.sendMessage({type: This.SIGNAL_EVENT_TYPE.CANCEL, cancelRequest: { cancelReqCmd: This.RTCSession.cancelReqCmd, value: This.RTCSession.sharingPermission,
            reqId: This.RTCSession.reqId, cancelReqId:This.RTCSession.cancelReqId}} )
    This.clearTimer()
}
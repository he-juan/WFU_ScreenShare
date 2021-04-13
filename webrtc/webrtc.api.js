var log = {};
log.debug = window.debug("WEBRTC_API:DEBUG");
log.log = window.debug("WEBRTC_API:LOG");
log.info = window.debug("WEBRTC_API:INFO");
log.warn = window.debug("WEBRTC_API:WARN");
log.error = window.debug("WEBRTC_API:ERROR");
/*Log Debug End*/
/**
 * 呼叫
 * @param wsAddr websocket地址
 * @param callback 回调
 */
function call(wsAddr, callback) {
    let protocol = 'gs-webrtc-json';
    if(!wsAddr){
        log.error('INVALID WEBSOCKET ADDRESS：' + wsAddr)
        gsRTC.trigger("error",{codeType:gsRTC.CODE_TYPE.INVALID_WEBSOCKET_ADDRESS.codeType,message:gsRTC.CODE_TYPE.INVALID_WEBSOCKET_ADDRESS.message})
        return
    }

    let sipRegisterInfo = {
        protocol: protocol,
        url: wsAddr,
        callback: callback
    }

    if( !gsRTC.isWFUShareScreenSupport()) {
        log.warn("当前浏览器版本不支持屏幕共享")
        log.warn("支持屏幕共享的浏览器版本分别是：Chrome是72版本以上、opera是60版本以上、firefox是60版本以上、edge是79版本以上、Safari是13.1.1版本以上")
        gsRTC.trigger("error",{codeType:gsRTC.CODE_TYPE.NOT_SUPPORT_SCREEN_SHARE.codeType,message:gsRTC.CODE_TYPE.NOT_SUPPORT_SCREEN_SHARE.message})
    }else {
        function successCallBack() {
            log.info("determine whether to create a new webSocket")
            if(!gsRTC.sokect || !gsRTC.sokect.ws || (gsRTC.sokect && gsRTC.sokect.ws && gsRTC.sokect.ws.readyState !== 1)){
                gsRTC.sokect = new WebSocketInstance(sipRegisterInfo)
            } else {
                gsRTC.inviteCall({callback:sipRegisterInfo.callback});
            }
        }

        if(gsRTC.getBrowserDetail().browser === 'safari'){
            function safariGetMediaCallBack(event){
                if(event.stream){
                    log.info('get stream success '+ event.stream.id)
                    gsRTC.shareScreenStream = event.stream
                    successCallBack()
                }else{
                    gsRTC.CODE_TYPE.CANCEL_PRESENT_ON.isCallSuccess = 'false'
                    gsRTC.trigger("error",{codeType:gsRTC.CODE_TYPE.CANCEL_PRESENT_ON.codeType,message:gsRTC.CODE_TYPE.CANCEL_PRESENT_ON.message,isCallSuccess:gsRTC.CODE_TYPE.CANCEL_PRESENT_ON.isCallSuccess})
                }
            }

            let data = {streamType: 'screenShare', callback: safariGetMediaCallBack}

            gsRTC.getPreImgSize(function(resolution,bitrate,frame) {
                let getWebUIResolution = gsRTC.getResolutionFromWebUI(resolution)
                let newFrame = parseInt(frame)
                let constraints = {
                    audio: false,
                    video: {
                        width: {
                            ideal: getWebUIResolution.width ||1920,
                            max:  getWebUIResolution.width || 1920,
                        },
                        height: {
                            ideal:getWebUIResolution.height || 1080,
                            max: getWebUIResolution.height  || 1080,
                        },
                        frameRate: {
                            ideal:  newFrame || 15,
                            max:  newFrame || 15
                        }
                    }

                };
                gsRTC.device.getMedia(data, constraints)
            })
        }else{
            successCallBack()
        }
    }
}

/**
 * 开启屏幕共享
 * @param callback
 */
function beginScreen(callback){
    log.info('start present!!')
    if (!gsRTC) {
        log.warn('gsRTC is not initialized')
        return
    }
    if (!gsRTC.RTCSession) {
        log.warn("please call first")
        return
    }
    let data = {
        type: 'slides',
        callback: callback
    }
    let session = gsRTC.RTCSession


    function getMediaCallBack(event){
        if(event.stream){
            if(session.openSharingTimestamp <= 30 ){
                try {
                    log.info('get stream success, ' + event.stream.id)
                    let stream = event.stream
                    let type = 'slides'

                    if (gsRTC.getBrowserDetail().browser === 'firefox') {
                        let tracks = stream.getVideoTracks();
                        tracks[0].onended = function () {
                            gsRTC.oninactiveStopStream(stream)
                        }
                    }else{
                        stream.oninactive= function () {
                            gsRTC.oninactiveStopStream(stream)
                        }
                    }
                    session.setStream(stream, type, true)
                    data.stream = stream
                    if(session.sharingPermission !== 3){
                        session.sharingPermission = 1
                    }
                    gsRTC.shareScreen(data)
                }catch (e) {
                    console.error(e)
                }
            }else{
                session.openSharingTimestamp = null
                session.stopTrack(event.stream)
                session.sharingPermission = 1
            }
        }else {
            log.error('Get present stream failed: ' + event.error)
            if(gsRTC.getBrowserDetail().browser === 'firefox'){
                gsRTC.CODE_TYPE.CANCEL_PRESENT_ON.rejectAuthorizationTip  = 'true'
            }

            if(session.sharingPermission === 3){
                session.openSharingTimeoutstartTime = null
                session.openSharingTimestamp = null
                session.sendCtrlPresentation = false
                if(session.timeBox){
                    clearInterval(session.timeBox)
                    session.timeBox = null
                }
                gsRTC.action = 'shareScreenRequest'
                gsRTC.sokect.sendMessage({type: gsRTC.SIGNAL_EVENT_TYPE.PRESENT_RET, ctrlPresentationRet:gsRTC.CODE_TYPE.CANCEL_PRESENT_ON, reqId: session.reqId})
                gsRTC.trigger('error',{codeType:gsRTC.CODE_TYPE.CANCEL_PRESENT_ON.codeType,message:gsRTC.CODE_TYPE.CANCEL_PRESENT_ON.message,
                    rejectAuthorizationTip: gsRTC.CODE_TYPE.CANCEL_PRESENT_ON.rejectAuthorizationTip})
                session.sharingPermission = 0

            }else{
                session.sharingPermission = 0
                gsRTC.action = 'shareScreen'
                gsRTC.trigger('error',{codeType:gsRTC.CODE_TYPE.CANCEL_PRESENT_ON.codeType,message:gsRTC.CODE_TYPE.CANCEL_PRESENT_ON.message,
                    rejectAuthorizationTip: gsRTC.CODE_TYPE.CANCEL_PRESENT_ON.rejectAuthorizationTip})
            }
        }
    }

    let gumData = {streamType: 'screenShare', callback: getMediaCallBack}
    let constraints = {
        audio: false,
        video: {
            width: {
                ideal: session.initialResolution && session.initialResolution.width || 1920,
                max:  session.initialResolution && gsRTC.RTCSession.initialResolution.width || 1920
            },
            height: {
                ideal: session.initialResolution && session.initialResolution.height ||1080,
                max: session.initialResolution && session.initialResolution.height || 1080
            },
            frameRate: {
                ideal: session.initialResolution && session.initialResolution.framerate || 15,
                max: session.initialResolution && session.initialResolution.framerate || 15
            }
        }
    };
    log.info(JSON.stringify(constraints, null, ' '))

    if(gsRTC.shareScreenStream){
        getMediaCallBack({stream: gsRTC.shareScreenStream})
        gsRTC.shareScreenStream = null
    }else{
        if(session.sharingPermission == 3){
            if(session.openSharingTimestamp <= 30){
                gsRTC.device.getMedia(gumData, constraints)
            }
        }else{
            gsRTC.device.getMedia(gumData, constraints)
        }
    }
}

/**
 * 暂停屏幕共享
 * @param isMute：true 暂停，false 取消暂停
 * @param callback
 */
function pausePresent(isMute, callback){
    if (!gsRTC) {
        log.warn('gsRTC is not initialized')
        return
    }
    if (!gsRTC.RTCSession) {
        log.warn("please call first")
        return
    }

    let type = 'slides'
    let stream = gsRTC.RTCSession.getStream(type, true)
    log.info('pause present stream')
    gsRTC.RTCSession.streamMuteSwitch({type: type, stream: stream, mute: isMute})
    if(callback){
        callback(gsRTC.CODE_TYPE.SUCCESS)
    }
}

/**
 * 停止桌面共享
 * @param callback
 */
function stopScreen(callback){
    log.info('stop present!!')
    if (!gsRTC) {
        log.warn('gsRTC is not initialized')
        return
    }
    if (!gsRTC.RTCSession) {
        log.warn("please call first")
        return
    }

    if(gsRTC.RTCSession.sharingPermission !==  2){
        gsRTC.RTCSession.sharingPermission = 0
    }
    if(gsRTC.RTCSession.openSharing === false){
        log.info("No stream or Reject shareScreen or stopShareScreen request again after replying to the signaling")
        if(gsRTC.RTCSession.sharingPermission === 2) {
            gsRTC.RTCSession.sendCtrlPresentation = false
            gsRTC.sokect.sendMessage({type: gsRTC.SIGNAL_EVENT_TYPE.PRESENT_RET, ctrlPresentationRet:gsRTC.CODE_TYPE.REJECT_MULTIPLE_REQUESTS, reqId: gsRTC.RTCSession.reqId})
        }
    }else{
        gsRTC.stopShareScreen({callback: callback})
    }
}

/**
 * 开摄像头
 * @param data
 */
function beginVideo(data){
    if (!gsRTC) {
        log.warn('gsRTC is not initialized')
        return
    }
    if (!gsRTC.RTCSession) {
        log.warn("please call first")
        return
    }
    gsRTC.shareVideo(data)
}

/**
 * 关闭摄像头
 * @param callback 回调
 */
function stopVideo(callback){
    if (!gsRTC) {
        log.warn('gsRTC is not initialized')
        return
    }
    if (!gsRTC.RTCSession) {
        log.warn("please call first")
        return
    }

    gsRTC.stopShareVideo({callback: callback})
}

/**
 * 挂断
 */
function hangUP(callback) {
    if (!gsRTC) {
        log.warn('gsRTC is not initialized')
        return
    }
    if (!gsRTC.RTCSession) {
        log.warn("please call first")
        return
    }

    if(!gsRTC.sokect){
        log.warn("socket is not exist")
        return
    }
    if(gsRTC.RTCSession.sharingPermission !==  4){
        gsRTC.RTCSession.sharingPermission = 5
    }
    gsRTC.endCall({callback: callback})
}

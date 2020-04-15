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
    let protocols = 'gs-webrtc-json';
    if(!wsAddr){
        alert('INVALID WEBSOCKET ADDRESS：' + wsAddr)
        return
    }

    let sipRegisterInfo = {
        protocol: protocols,
        websocketUrl: wsAddr,
    }
    gsRTC.sokect = new WebSocketInstance(sipRegisterInfo.websocketUrl, sipRegisterInfo.protocol)
    gsRTC.inviteCall(callback);
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

    let stream = gsRTC.RTCSession.getStream("main", true)
    let pc = gsRTC.RTCSession.peerConnection
    gsRTC.RTCSession.processRemoveStream(stream, pc, 'main')
    gsRTC.RTCSession.closeStream(stream);
    gsRTC.sokect.sendMessage({type: gsRTC.SIGNAL_EVENT_TYPE.PRESENT, permission: {value: 0}})
    gsRTC.RTCSession.setMediaElementStream(null, 'main', 'true')

    if(callback){
        callback({codeType: 200})
    }else {
        gsRTC.action = 'stopShareScreen'
        gsRTC.trigger(gsRTC.action, {codeType: 200});
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

    gsRTC.isNonInviteSignalNeed = true
    gsRTC.sharingPermission = 1
    let constraints = {
        audio: false,
        video: {
            width: {ideal: 1920,},
            height: {ideal: 1080,},
            frameRate: {ideal: 15,}
        }
    };

    let data = {
        type: 'slides',
        constraints: constraints,
        callback: callback
    }

    gsRTC.shareScreen(data)
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
        callback({codeType: 200})
    }else {
        gsRTC.action = 'switchScreenSource'
        gsRTC.trigger(gsRTC.action, {codeType: 200});
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


    let stream = gsRTC.RTCSession.getStream("slides", true)
    let pc = gsRTC.RTCSession.peerConnection
    gsRTC.RTCSession.processRemoveStream(stream, pc, 'slides')
    gsRTC.RTCSession.closeStream(stream);

    if(gsRTC.serverAction){
        let rspInfo = {
            rspCode: 200,
            rspMsg: 'Request success!'
        }
        gsRTC.sokect.sendMessage({type: gsRTC.SIGNAL_EVENT_TYPE.PRESENT_RET, rspInfo})
        gsRTC.serverAction = null
    }else {
        gsRTC.sokect.sendMessage({type: gsRTC.SIGNAL_EVENT_TYPE.PRESENT, permission: {value: 0}})
        gsRTC.RTCSession.setMediaElementStream(null, 'slides', 'true')
        if(callback){
            callback({codeType: 200})
        }else {
            gsRTC.action = 'switchScreenSource'
            gsRTC.trigger(gsRTC.action, {codeType: 200});
        }
    }
}

/**
 * 挂断
 */
function hangup() {
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

    gsRTC.sokect.sendMessage({type: gsRTC.SIGNAL_EVENT_TYPE.BYE})
    gsRTC.closePeerConn()
    gsRTC.sokect.ws.close()
}

/**
 * 页面加载后自动扫描可用设备
 */
(function () {
    if (window.MediaDevice) {
        let mediaDevice = new MediaDevice
        let videoInputList = []
        let audioOutputList = []
        mediaDevice.enumDevices(deviceInfo => {
            log.warn("deviceInfo.cameras: ", deviceInfo.cameras)
            if (deviceInfo.cameras) {
                for (let i = 0; i < deviceInfo.cameras.length; i++) {
                    if (!deviceInfo.cameras[i].label) {
                        deviceInfo.cameras[i].label = 'camera' + i
                    }
                    videoInputList.push('<option class="cameraOption" value="' + deviceInfo.cameras[i].deviceId + '">' + deviceInfo.cameras[i].label + '</option>')
                    log.log('camera: ' + deviceInfo.cameras[i].label)
                }
                document.getElementById('videoList').innerHTML = videoInputList.join('')
            }

            let audioOutput = deviceInfo.speakers.length > 0 ? deviceInfo.speakers : deviceInfo.microphones
            log.warn("get audioOutput: ", audioOutput)
            if (audioOutput) {
                for (let j = 0; j < audioOutput.length; j++) {
                    if (!audioOutput[j].label) {
                        audioOutput[j].label = 'speakers' + j
                    }
                    // 过滤default 和 communications 类型
                    if (audioOutput[j].deviceId !== 'default' && audioOutput[j].deviceId !== 'communications') {
                        audioOutputList.push('<option class="cameraOption" value="' + audioOutput[j].deviceId + '">' + audioOutput[j].label + '</option>')
                        log.log('speakers: ' + audioOutput[j].label)
                    }
                }
                document.getElementById('audioList').innerHTML = audioOutputList.join('')
            }
        }, function (error) {
            log.error('enum device error: ' + error)
        })
    }
})()
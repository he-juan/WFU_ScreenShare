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
        alert('enter ws value !')
        return
    }
    let sipCallInfo = {
        initialResolution: gsRTC.getScreenResolution(),   // 初始Invite视频协商分辨率,
        enableMultiStream: true,
        sessionsConfig: ['multiStreamPeer']
    };
    let sipRegisterInfo = {
        protocol: protocols,
        websocketUrl: wsAddr,
    }
    gsRTC.sokect = new WebSocketInstance(sipRegisterInfo.websocketUrl, sipRegisterInfo.protocol || 'sip')
    gsRTC.inviteCall(sipCallInfo,callback);
}

/**
 * 开摄像头
 * @param data
 */
function shareVideo(data){
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
function stopShareVideo(callback){
    if (!gsRTC) {
        log.warn('gsRTC is not initialized')
        return
    }
    if (!gsRTC.RTCSession) {
        log.warn("please call first")
        return
    }

    gsRTC.stopShareVideo(callback)
}

/**
 * 开启屏幕共享
 * @param callback
 */
function shareScreen(callback){
    log.info('start present!!')
    if (!gsRTC) {
        log.warn('gsRTC is not initialized')
        return
    }
    if (!gsRTC.RTCSession) {
        log.warn("please call first")
        return
    }
    window.isPresentShare = true
    let constraints = {
        audio: false,
        video: {
            width: {max: 1920,},
            height: {max: 1080,},
            frameRate: {max: 30,}
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
function pauseScreen(isMute, callback){
    console.warn("isMuteStream:",isMute)
    if (!gsRTC) {
        log.warn('gsRTC is not initialized')
        return
    }
    if (!gsRTC.RTCSession) {
        log.warn("please call first")
        return
    }

    let data = {
        slides: 'slides',
        callback: callback
    }
    gsRTC.muteStream = isMute
    gsRTC.pauseScreenSource(data)
}

/**
 * 停止桌面共享
 * @param callback
 */
function stopShareScreen(callback){
    log.info('stop present!!')
    if (!gsRTC) {
        log.warn('gsRTC is not initialized')
        return
    }
    if (!gsRTC.RTCSession) {
        log.warn("please call first")
        return
    }

    window.isPresentShare = 'stop'
    let data = {
        type: 'slides',
        callback: callback
    }
    gsRTC.stopShareScreen(data)
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

    let reqId = parseInt(Math.round(Math.random()*100));
    let message = {
        destroyMediaSession: {
            userName: "wfu_test",
            reqId: reqId
        }
    }

    gsRTC.sokect.ws.send(JSON.stringify(message))
    log.info('end ws send: ' + JSON.stringify(message, null, '    '))
    gsRTC.hangup()
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
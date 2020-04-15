var log = {};
log.debug = window.debug("WEBRTC_API:DEBUG");
log.log = window.debug("WEBRTC_API:LOG");
log.info = window.debug("WEBRTC_API:INFO");
log.warn = window.debug("WEBRTC_API:WARN");
log.error = window.debug("WEBRTC_API:ERROR");
/*Log Debug End*/

/**
 * Open to upper-level event registration interface
 * eventType：Event type
 * handerFun：User-defined processing functions
 */
function addEventHandler(eventType,handlerFun){
    if (window.gsRTC){
        window.gsRTC.on(eventType,handlerFun);
        window.gsRTC.handlerFuns[eventType] = handlerFun;
    }else {
        log.error("ERR_NOT_INITIALIZED: Engine not initialized yet. Please create gsRTC first");
    }
}

/**
 * 呼叫
 * @param wsAddr websocket地址
 * @param callback 回调
 */
function call(wsAddr, callback) {
    let protocols = 'gs-webrtc-json';
    if(!wsAddr){
        log.error('INVALID WEBSOCKET ADDRESS：' + wsAddr)
        callback(gsRTC.CODE_TYPE.INVALID_WEBSOCKET_ADDRESS)
        return
    }

    let sipRegisterInfo = {
        protocol: protocols,
        websocketUrl: wsAddr,
    }
    gsRTC.sokect = new WebSocketInstance(sipRegisterInfo.websocketUrl, sipRegisterInfo.protocol)
    gsRTC.inviteCall({callback: callback});
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

    gsRTC.sharingPermission = 1
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

    gsRTC.sharingPermission = 0
    gsRTC.stopShareScreen({callback: callback})
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
function hangup(callback) {
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

    gsRTC.endCall({callback: callback})
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
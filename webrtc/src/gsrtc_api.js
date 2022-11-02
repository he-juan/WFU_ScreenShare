var log = {};
log.debug = window.debug("GSRTC_API:DEBUG");
log.log = window.debug("GSRTC_API:LOG");
log.info = window.debug("GSRTC_API:INFO");
log.warn = window.debug("GSRTC_API:WARN");
log.error = window.debug("GSRTC_API:ERROR");
/*Log Debug End*/

/**
 * WebRTC API Instance
 * @constructor
 */
var GsRTC = function (options) {
    this.sokect = null
    this.RTCSession = null

    this.EVENTS = []
    // 上层注册事件
    this.handlerFuns = []

    this.conf = options;
    this.sessionVersion = 0
    this.action = null
    this.serverAction = null
    this.shareScreenStream = null                          // 共享桌面流

    this.device = new MediaDevice()
    this.eventBindings()
    this.trigger()
}

window.onload = function () {
    var oReadyStateTimer = setInterval(function () {
            if (document.readyState === "complete") {
                if(!GsRTC){
                    log.warn("ERR_NOT_LOADED: GsRTC not loaded yet.")
                    return
                }
                clearInterval(oReadyStateTimer);
                // initialize gsRTC
                GsRTC.prototype.preInit()
            }
        },
        500);
}

/**
 * gsRTC init
 */
GsRTC.prototype.preInit = function() {
    log.info('create new GsRTC object');
    try {
        let options = {}
        window.gsRTC = new GsRTC(options);
    }catch (e) {
        log.error(e.toString())
    }
}

/**
 * Binding page media elements
 * @param args
 */
GsRTC.prototype.setHtmlMediaElement = function(args){
    try {
        this.HTML_MEDIA_ELEMENT.localAudio = args.localAudio
        this.HTML_MEDIA_ELEMENT.localVideo = args.localVideo
        this.HTML_MEDIA_ELEMENT.localPresentVideo = args.localPresentVideo
        this.HTML_MEDIA_ELEMENT.localVideoShare = args.localVideoShare
        this.HTML_MEDIA_ELEMENT.remoteAudio = args.remoteAudio
        this.HTML_MEDIA_ELEMENT.remoteVideo = args.remoteVideo
        this.HTML_MEDIA_ELEMENT.remotePresentVideo = args.remotePresentVideo
        this.HTML_MEDIA_ELEMENT.remoteVideoShare = args.remoteVideoShare
    }catch (e) {
        throw new Error(e);
    }
}

/**
 * call and send invite
 * @param data
 */
GsRTC.prototype.inviteCall = function (data) {
    let This = this
    This.conf = {
        userName: 'webRTC_Client',
    }
    This.action = 'call'
    if(data && data.callback && !This.EVENTS[This.action]){
        This.on(This.action, data.callback)
    }
    This.RTCSession = new PeerConnection(This)
    This.RTCSession.createMultiStreamRTCSession(This.conf)
}
/**
 * share local audio
 * @param data
 * data.stream
 * data.deviceId: given deviceId
 */
GsRTC.prototype.shareAudio = function(data) {
    let This = this
    if(!This.RTCSession){
        log.error('invalid RTCSession parameters! can not share audio')
        return
    }

    log.info('share local audio: ' + data.deviceId)
    let type = 'audio'
    let stream = This.RTCSession.getStream(type, true)
    if(stream){
        This.RTCSession.streamMuteSwitch({stream: stream, type: type, mute: false})
    }else {
        log.info('getting new stream')
        async function getMediaCallBack(args){
            if(args.stream){
                let stream = args.stream
                log.info('get stream: ' +  stream ? stream.id : null)
                This.RTCSession.setStream(stream, type, true)
                let pc = This.RTCSession.peerConnection
                This.RTCSession.processAddStream(stream, pc, type)
                await This.RTCSession.doOffer(pc)
            }else if(args.error){
                log.error('Get audio stream failed: ' + args.error)
                if(data.callback){
                    data.callback(This.CODE_TYPE.AUDIO_REFRESH_FAILED)
                }
            }
        }

        let conf = { streamType: type, callback: getMediaCallBack }
        let constraints = {
            audio: data.deviceId ? { deviceId: data.deviceId }: true,
            video: false
        }

        This.action = 'audioRefresh'
        if(data && data.callback ){
            This.on(This.action, data.callback)
        }
        This.device.getMedia(conf, constraints)
    }
}

/**
 * 切换音频源
 * @param data
 * data.callback
 * data.deviceId
 */
GsRTC.prototype.switchAudioSource = function(data) {
    let This = this
    log.info('switch audio source: ' + data.deviceId)
    if(!this.RTCSession){
        log.error('switchAudioSource: invalid RTCSession parameters!')
        return
    }
    let type = data.type
    let previousStream = This.RTCSession.getStream(type, true)
    let pc = This.RTCSession.peerConnection

    async function getMediaCallBack(event){
        if(event.stream){
            let stream = event.stream
            if(previousStream && This.isReplaceTrackSupport() && pc.getTransceivers().length > 0){
                This.RTCSession.processAddStream(stream, pc, type)
                if(data && data.callback){
                    data.callback({codeType: 200})
                }
            }else {
                log.info('clear previous stream')
                This.RTCSession.processRemoveStream(previousStream, pc, type)
                This.RTCSession.processAddStream(stream, pc, type)
                await This.RTCSession.doOffer(pc)
            }
            This.RTCSession.closeStream(previousStream)
            This.RTCSession.setStream(stream, type, true)
        }else {
            log.error(event.error)
            if(data && data.callback ){
                data.callback({error:event.error })
            }
        }
    }

    let conf = { streamType: type, callback: getMediaCallBack }
    let  constraints = {
        audio: data.deviceId ? { deviceId: data.deviceId } : true,
        video: false
    }

    This.action =  'switchAudioSource'
    if(data && data.callback){
        This.on(This.action, data.callback)
    }
    This.device.getMedia(conf, constraints)
}

/**
 * stop share local audio
 * @param data: callback
 */
GsRTC.prototype.stopShareAudio = function(data) {
    let This = this
    if(!this.RTCSession){
        log.error('stopShareAudio: invalid RTCSession parameters! ')
        return
    }

    try {
        let type = data.type
        let stream = This.RTCSession.getStream(type, true)
        if(stream){
            This.RTCSession.streamMuteSwitch({stream: stream, type: type, mute: true})
            if(data.callback){
                data.callback(This.CODE_TYPE.SUCCESS)
            }
        }else {
            log.info('Audio stream: null')
        }
    }catch (e) {
        log.error(e.toString())
        if(data && data.callback){
            data.callback(This.CODE_TYPE.AUDIO_REFRESH_FAILED)
        }
    }
}

/**
 * 开启本地视频
 * @param data
 * data.stream
 * data.type
 * data.deviceId
 */
GsRTC.prototype.shareVideo = function(data) {
    let This = this
    if(!This.RTCSession){
        log.error('shareVideo: invalid RTCSession parameters! ')
        return
    }

    let type = 'main'
    let previousStream = This.RTCSession.getStream(type, true)
    let pc = This.RTCSession.peerConnection

    let param = {
        streamType: 'video',
        deviceId: data.deviceId,
        frameRate: 30,
        width: 640,
        height: 360,
    }
    let constraints = This.device.getConstraints(param)


    function getMediaCallBack(event){
        if(event.stream){
            log.info('get stream success')
            let stream = event.stream
            if(previousStream && This.isReplaceTrackSupport() && pc.getTransceivers().length > 0){
                This.RTCSession.processAddStream(stream, pc, type)
                if(data.callback){
                    data.callback({codeType: 200})
                }
            }else {
                log.info('clear previous stream')
                This.RTCSession.processRemoveStream(previousStream, pc, type)
                This.RTCSession.processAddStream(stream, pc, type)
                This.RTCSession.doOffer(pc)
            }

            This.RTCSession.closeStream(previousStream)
            This.RTCSession.setStream(stream, type, true)

            /**获取远端流**/
            if(gsRTC.RTCSession.peerConnection.getReceivers()[1].track){
                let streams  = new MediaStream()
                streams.addTrack(gsRTC.RTCSession.peerConnection.getReceivers()[1].track)
                This.RTCSession.setStream(streams, type, false)
            }

            This.RTCSession.deviceId = data.deviceId  // save deviceId
            This.setVideoResolution({width: param.width, height: param.height}, 'CURRENT_UP_RESOLUTION')
        }else {
            log.info('get stream failed')
            if(data && data.callback ){
                data.callback({error: event.error})
            }
            log.error(event.error)
        }
    }

    let gumData = { streamType: 'video', callback: getMediaCallBack }
    This.action = 'shareVideo'
    if(data && data.callback ){
        This.on(This.action, data.callback)
    }
    This.device.getMedia(gumData, constraints)
}

/**
 * 关闭本地视频
 * @param data
 */
GsRTC.prototype.stopShareVideo = function(data) {
    let This = this
    if(!This.RTCSession){
        log.error('stopShareVideo: invalid RTCSession parameters! ')
        return
    }

    let type = 'main'
    let stream = This.RTCSession.getStream(type, true)
    let pc = This.RTCSession.peerConnection

    This.action = 'stopShareVideo'
    if(data && data.callback ){
        This.on(This.action, data.callback)
    }

    log.info('clear previous stream')
    This.RTCSession.deviceId = null
    This.RTCSession.processRemoveStream(stream, pc, type)
    This.RTCSession.closeStream(stream)
    This.RTCSession.setStream(null, type, true)
    This.RTCSession.setMediaElementStream(null, 'main', 'true')
    // This.RTCSession.doOffer(pc)

    gsRTC.sokect.sendMessage({type: gsRTC.SIGNAL_EVENT_TYPE.PRESENT, ctrlPresentation: {value: 0}})

    if(data && data.callback){
        data.callback(gsRTC.CODE_TYPE.SUCCESS)
    }
}

/**
 * 开启桌面演示
 * @param data
 * data.stream: 要共享的视频流
 * data.callback
 */
GsRTC.prototype.shareScreen = function(data) {
    log.info("share screen")
    let This = this
    if(!This.RTCSession){
        log.error('shareScreen: invalid RTCSession parameters! ')
        return
    }

    This.action = 'shareScreen'

    if(data && data.callback &&  !This.EVENTS[This.action]){
        This.on(This.action, data.callback)
    }

    log.info('current sharing permission: ' + This.RTCSession.sharingPermission)
    if( This.RTCSession.sharingPermission === 3){
        if(This.RTCSession.timeBox){
            clearInterval(This.RTCSession.timeBox)
            This.RTCSession.timeBox = null
        }
        This.RTCSession.openSharingTimeoutstartTime = null
        This.RTCSession.openSharingTimestamp = null
        This.RTCSession.sendCtrlPresentation = false
        This.sokect.sendMessage({type: This.SIGNAL_EVENT_TYPE.PRESENT_RET, ctrlPresentationRet: This.CODE_TYPE.SUCCESS, reqId:  This.RTCSession.reqId})
        This.RTCSession.openSharing = true
        let stream = This.MEDIA_STREAMS.LOCAL_PRESENT_STREAM
        let pc = This.RTCSession.peerConnection
        log.info('prepare do offer!')
        This.RTCSession.processAddStream(stream, pc, 'slides')
        This.RTCSession.doOffer(pc)
    }else{
        This.RTCSession.sharingPermission = 1
        This.sokect.sendMessage({type: This.SIGNAL_EVENT_TYPE.PRESENT, ctrlPresentation: { value: This.RTCSession.sharingPermission,reqId: This.RTCSession.reqId}} )
    }
}

/**
 * 切换桌面共享源
 * @param data.type 类型："window"/"screen"/"whiteboard"/"tab"
 * @param data.callback 回调函数
 */
GsRTC.prototype.switchScreenSource = function(data) {
    let This = this
    if(!This.RTCSession){
        log.error('switchScreenSource: invalid RTCSession parameters! ')
        return
    }

    let type = 'slides'
    let previousStream = This.RTCSession.getStream(type, true)
    let pc = This.RTCSession.peerConnection

    This.action = 'switchScreenSource'
    if(data && data.callback ){
        This.on(This.action, data.callback)
    }
    This.RTCSession.setMediaElementStream(null, 'slides', 'true')

    function getMediaCallBack(event){
        if(event.stream){
            let stream = event.stream
            stream.oninactive = function () {
                log.warn("user clicks the bottom share bar to stop sharing.")
                stopScreen()
            }
            if (gsRTC.getBrowserDetail().browser === 'firefox') {
                let tracks = stream.getVideoTracks();
                tracks[0].onended = function () {
                    log.warn('track: user close share control bar');
                    stopScreen()
                }
            }

            if(previousStream && This.isReplaceTrackSupport() && pc.getTransceivers().length > 0){
                log.info('use replace track to switch presentation stream')
                This.RTCSession.processAddStream(stream, pc, type)

                if(data &&data.callback){
                    data.callback({codeType: 200})
                }
            }else {
                This.RTCSession.processRemoveStream(previousStream, pc)
                This.RTCSession.processAddStream(stream, pc, type)
                This.RTCSession.doOffer(pc)
            }

            This.RTCSession.closeStream(previousStream)
            This.RTCSession.setStream(stream, type, true)
        }else {
            log.error(event.error.toString())
            if(data && data.callback){
                data.callback({error: event.error})
            }
        }
    }

    let gumData = {
        streamType: 'screenShare',
        callback: getMediaCallBack
    }
    This.device.getMedia(gumData, data.constraints)
}

/**
 * 关闭桌面演示
 * @param data
 */
GsRTC.prototype.stopShareScreen = function(data) {
    let This = this
    if(!this.RTCSession){
        log.error('stopShareScreen: invalid RTCSession parameters! ')
        return
    }

    let type = 'slides'
    let stream = This.RTCSession.getStream(type, true)
    let pc = This.RTCSession.peerConnection

    This.action = 'stopShareScreen'
    if(data && data.callback && !This.EVENTS[This.action]){
        This.on(This.action, data.callback)
    }

    log.info('clear previous stream')
    This.RTCSession.processRemoveStream(stream, pc, type)
    This.RTCSession.closeStream(stream)
    This.RTCSession.setStream(null, type, true)
    // This.RTCSession.doOffer(pc)

    log.info('current sharing permission: ' + This.RTCSession.sharingPermission)
    if(This.RTCSession.sharingPermission === 2){
        This.RTCSession.sendCtrlPresentation = false
        This.sokect.sendMessage({type: This.SIGNAL_EVENT_TYPE.PRESENT_RET, ctrlPresentationRet: This.CODE_TYPE.SUCCESS, reqId: This.RTCSession.reqId})
        This.openSharing = false
        This.trigger(This.action, {codeType:This.CODE_TYPE.SUCCESS.codeType});
    }else if(This.RTCSession.sharingPermission === 0){
        This.sokect.sendMessage({type: This.SIGNAL_EVENT_TYPE.PRESENT, ctrlPresentation: { value: This.RTCSession.sharingPermission }})
    }


}

/**
 * 发送DTMF
 * @param data.digit 发送的内容
 * @param data.callback 回调函数
 */
GsRTC.prototype.sendDtmf = function(data){
    log.info('send dtmf digit:  ' + data.digit)
    let This = this
    if(!This.RTCSession){
        log.error('sendDtmf: invalid RTCSession parameters!')
        return
    }
    let pc = This.RTCSession.peerConnection

    let dtmfSender
    if(pc.getSenders){
        let senders = pc.getSenders();
        let audioSender = senders.find(sender => sender.track && sender.track.kind === 'audio');
        if (!audioSender) {
            log.warn('No local audio track to send DTMF with');
            return
        }else {
            dtmfSender = audioSender.dtmf;
        }

        if (dtmfSender && dtmfSender.canInsertDTMF) {
            log.info("prepare send digit: "+ data.digit);
            dtmfSender.insertDTMF(data.digit);
        }else {
            log.warn("DTMF function not available");
        }
    }else {
        log.warn('getSenders is not available by current browser version')
    }
}

/***
 * 调整下行分辨率
 * @param data
 */
GsRTC.prototype.adjustResolution = function(data){
    let This = this
    if(!This.RTCSession){
        log.error('adjustResolution: invalid RTCSession parameters!')
        return
    }
    if(!data || !data.height){
        log.error('adjustResolution: ERR_INVALID_PARAMETER_VALUE')
        return
    }
    log.info('adjust down resolution:  ' + data.height)

    let pc = This.RTCSession.peerConnection
    This.action = 'adjustResolution'
    if(data && data.callback ){
        This.on(This.action , data.callback)
    }
    This.setVideoResolution(This.getResolutionByHeight(data.height), 'EXPECT_RECV_RESOLUTION')
    This.RTCSession.doOffer(pc)
}

/**
 * end call
 * @param data
 */
GsRTC.prototype.endCall = function(data){
    let This = this
    This.action = 'hangup'
    if( data && data.callback && !This.EVENTS[This.action] ){
        This.on(This.action , data.callback)
    }
    log.info('current sharing permission: ' + This.RTCSession.sharingPermission)
    if(This.RTCSession.sharingPermission === 4){
        This.sokect.sendMessage({type: This.SIGNAL_EVENT_TYPE.BYE_RET, destroyMediaSessionRet: This.CODE_TYPE.SUCCESS, reqId: This.RTCSession.reqId})
        This.trigger(This.action, {codeType:This.CODE_TYPE.SUCCESS.codeType});
        This.cleanGsRTC()

    }else{
        This.sokect.sendMessage({type: This.SIGNAL_EVENT_TYPE.BYE,destroyMediaSession:{ value: This.RTCSession.sharingPermission }})
    }
}

/**
 * Leave the meeting
 */
GsRTC.prototype.closePeerConn = function () {
    let This = this
    if(!This.RTCSession){
        log.error("RTCSession is not initialized")
        return
    }
    try {
        // close stream
        for (let key in This.MEDIA_STREAMS) {
            let stream = This.MEDIA_STREAMS[key];
            This.RTCSession.closeStream(stream)
        }

        let pc = This.RTCSession.peerConnection
        // close peerConnection
        pc.getSenders().forEach(sender => {
            delete sender.track
            sender.replaceTrack(null)
        })
        pc.close()
        This.RTCSession = null
    }catch (e) {
        log.error(e)
    }
}

/**
 * close websocket
 */
GsRTC.prototype.cleanGsRTC = function(){
    log.info("websocket close")
    let This = this
    if(!This.RTCSession){
        log.error("RTCSession is not initialized")
        return
    }
    let stream = This.MEDIA_STREAMS.LOCAL_PRESENT_STREAM
    if(stream){
        This.RTCSession.stopTrack(stream)
    }
    if( (This.sokect && This.sokect.ws && This.sokect.ws.readyState === 1)){
        This.sokect.ws.close()
    }
    clearInterval(This.sokect.ws.websocketTimer)
    This.RTCSession.openSharingTimestamp = null
    This.RTCSession.openSharingTimeoutstartTime = null
    This.RTCSession.initialResolution = null
    This.RTCSession.shareScreenStream = null
    This.RTCSession.openSharing = false
    This.RTCSession.isSendReInvite = false
    This.RTCSession.sendCtrlPresentation = false
    This.RTCSession.reqId = null
    This.RTCSession.cancelReqCmd = null
    This.RTCSession.cancelReqId = null
    This.RTCSession.sharingPermission = null
    This.closePeerConn()
}

/**
 * 告知gsPhone开启演示流，web端接受演示流
 * @param data
 * data.stream: 要共享的视频流
 * data.callback
 */
GsRTC.prototype.openRemoteVideo = function(data){
    let This = this
    if(!This.RTCSession){
        log.error('openRemoteScreen: invalid RTCSession parameters! ')
        return
    }

    let pc = This.RTCSession.peerConnection

    This.action = 'openRemoteControl'
    log.info("open remote screen")
    if(data && data.callback && !This.EVENTS[This.action]){
        This.on(This.action, data.callback)
    }

    This.RTCSession.isRequestOpenRemoteVideo = true
    This.RTCSession.doOffer(pc)
}

/**
 * 告知gsPhone关闭演示流，web端关闭演示流
 * @param data
 * data.stream: 要共享的视频流
 * data.callback
 */
GsRTC.prototype.stopRemoteVideo = function(data){
    let This = this
    if(!This.RTCSession){
        log.error('stopRemoteScreen: invalid RTCSession parameters! ')
        return
    }

    let type = 'slides'
    let stream = This.RTCSession.getStream(type, false)
    let pc = This.RTCSession.peerConnection

    This.action = 'stopRemoteControl'
    log.info("stop remote screen")
    if(data && data.callback && !This.EVENTS[This.action]){
        This.on(This.action, data.callback)
    }

    log.info('clear remote stream')
    This.RTCSession.processRemoveStream(stream, pc, type)
    This.RTCSession.closeStream(stream)
    This.RTCSession.setStream(null, type, false)


    This.RTCSession.isRequestOpenRemoteVideo = false
    This.RTCSession.doOffer(pc)
}
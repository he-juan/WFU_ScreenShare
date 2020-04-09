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
let GsRTC = function (options) {
    this.sokect = null
    this.RTCSession = null

    this.EVENTS = []
    // 上层注册事件
    this.handlerFuns = []
    this.conf = options;
    this.sessionVersion = 0
    this.enableMultiStream = false
    this.action = null

    this.transaction = null
    this.isRecvRequest = false    // true => recv request
    this.isSendReInvite = false
    this.inviteProcessing = false
    this.muteStream = null

    this.device = new MediaDevice()
    this.eventBindings()
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
 * Open to upper-level event registration interface
 * eventType：Event type
 * handerFun：User-defined processing functions
 */
GsRTC.prototype.addSipEventHandler = function(eventType,handlerFun){
    this.preInit();
    if (window.gsRTC){
        window.gsRTC.on(eventType,handlerFun);
        window.gsRTC.handlerFuns[eventType] = handlerFun;
    }else {
        log.error("ERR_NOT_INITIALIZED: Engine not initialized yet. Please create gsRTC first");
    }
}

/**
 * call and send invite
 * @param sipCallInfo
 * @param callback
 */
GsRTC.prototype.inviteCall = function (sipCallInfo,callback) {
    if(!sipCallInfo){
        throw new Error('ERR_INVALID_PARAMETER_VALUE');
    }

    if(this.conf){
        this.conf.sessionsConfig = sipCallInfo.sessionsConfig;
        this.conf.initialResolution = sipCallInfo.initialResolution
    }
    this.action = 'onCall'
    this.on('onCall', callback)
    this.RTCSession = new PeerConnection(sipCallInfo, this)

    if(sipCallInfo.enableMultiStream){
        log.info('set enableMultiStream true')
        localStorage.setItem("enableMultiStream", 'true');
        this.enableMultiStream = true
        this.RTCSession.createMultiStreamRTCSession(this.conf)
    }
}


/**
 * Leave the meeting
 */
GsRTC.prototype.hangup = function () {
    if(!this.RTCSession){
        log.error("RTCSession is not initialized")
        return
    }
    try {
        for (let key in this.RTCSession.peerConnections) {
            let pc = this.RTCSession.peerConnections[key];
            // close stream
            let type = this.RTCSession.getStreamType(pc.type, true)
            this.RTCSession.closeStream(this.MEDIA_STREAMS[type])

            // close peerConnection
            pc.getSenders().forEach(sender => {
                delete sender.track
                sender.replaceTrack(null)
            })
            pc.close()
        }
    }catch (e) {
        log.error(e)
    }
}

/**
 * share local audio
 * @param data
 * data.stream
 * data.deviceId: given deviceId
 */
GsRTC.prototype.shareAudio = function(data) {
    if(!this.RTCSession){
        log.error('invalid RTCSession parameters! can not share audio')
        return
    }

    log.info('share local audio: ' + data.deviceId)
    let This = this
    let type = 'audio'
    let stream = this.RTCSession.getStream(type, true)
    if(stream){
        this.RTCSession.streamMuteSwitch({stream: stream, type: type, mute: false})
    }else {
        log.info('getting new stream')
        async function getMediaCallBack(args){
            if(args.stream){
                let stream = args.stream
                log.info('get stream: ' +  stream ? stream.id : null)
                This.RTCSession.setStream(stream, type, true)
                let pc = This.RTCSession.peerConnections['multiStreamPeer']
                This.RTCSession.processAddStream(stream, pc, type)
                await This.RTCSession.doOffer(pc)
            }else if(args.error){
                log.error('Get audio stream failed: ' + args.error)
                data.callback({error: args.error})
            }
        }

        let conf = { streamType: type, callback: getMediaCallBack }
        let constraints = {
            audio: data.deviceId ? { deviceId: data.deviceId }: true,
            video: false
        }

        this.action = 'audioRefresh'
        this.on('audioRefresh', data.callback)
        this.device.getMedia(conf, constraints)
    }
}

/**
 * 切换音频源
 * @param data
 * data.callback
 * data.deviceId
 */
GsRTC.prototype.switchAudioSource = function(data) {
    log.info('switch audio source: ' + data.deviceId)
    if(!this.RTCSession){
        log.error('switchAudioSource: invalid RTCSession parameters!')
        return
    }
    let This = this
    let type = data.type
    let previousStream = this.RTCSession.getStream(type, true)
    let pc = this.RTCSession.peerConnections['multiStreamPeer']

    async function getMediaCallBack(event){
        if(event.stream){
            let stream = event.stream
            if(previousStream && This.isReplaceTrackSupport() && pc.getTransceivers().length > 0){
                This.RTCSession.processAddStream(stream, pc, type)
                data.callback({codeType: 200})
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
            data.callback({error:event.error})
        }
    }

    let conf = { streamType: type, callback: getMediaCallBack }
    let  constraints = {
        audio: data.deviceId ? { deviceId: data.deviceId } : true,
        video: false
    }

    this.action = 'switchAudioSource'
    this.on('switchAudioSource', data.callback)
    this.device.getMedia(conf, constraints)
}

/**
 * stop share local audio
 * @param data: callback
 */
GsRTC.prototype.stopShareAudio = function(data) {
    if(!this.RTCSession){
        log.error('stopShareAudio: invalid RTCSession parameters! ')
        return
    }

    try {
        let type = data.type
        let stream = this.RTCSession.getStream(type, true)
        if(stream){
            this.RTCSession.streamMuteSwitch({stream: stream, type: type, mute: true})
        }else {
            log.info('Audio stream: null')
        }
    }catch (e) {
        log.error(e.toString())
        data.callback({error: e})
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
    if(!this.RTCSession){
        log.error('shareVideo: invalid RTCSession parameters! ')
        return
    }

    let This = this
    let type = 'main'
    let previousStream = This.RTCSession.getStream(type, true)
    let pc = this.RTCSession.peerConnections['multiStreamPeer']

    let param = {
        streamType: 'video',
        deviceId: data.deviceId,
        frameRate: 30,
        width: 640,
        height: 360,
    }
    let constraints = this.device.getConstraints(param)

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

            This.RTCSession.deviceId = data.deviceId  // save deviceId
            This.setVideoResolution({width: param.width, height: param.height}, 'CURRENT_UP_RESOLUTION')
        }else {
            log.info('get stream failed')
            data.callback({error: event.error})
            log.error(event.error)
        }
    }

    let gumData = { streamType: 'video', callback: getMediaCallBack }
    this.action = 'shareVideo'
    this.on('shareVideo', data.callback)
    this.device.getMedia(gumData, constraints)
}

/**
 * 关闭本地视频
 * @param callback 回调函数
 */
GsRTC.prototype.stopShareVideo = function(callback) {
    if(!this.RTCSession){
        log.error('stopShareVideo: invalid RTCSession parameters! ')
        return
    }

    let type = 'main'
    let stream = this.RTCSession.getStream(type, true)
    let pc = this.RTCSession.peerConnections['multiStreamPeer']

    if(stream){
        this.action = 'stopShareVideo'
        this.on('stopShareVideo', callback)

        log.info('clear previous stream')
        this.RTCSession.deviceId = null
        this.RTCSession.processRemoveStream(stream, pc, type)
        this.RTCSession.closeStream(stream)
        this.RTCSession.setStream(null, type, true)
        this.RTCSession.doOffer(pc)
    }else {
        throw new Error("ERR_INVALID_PARAMETER_VALUE: VIDEO STREAM IS NULL");
    }
}

/**
 * 开启桌面演示
 * @param data
 * data.stream: 要共享的视频流
 * data.callback
 */
GsRTC.prototype.shareScreen = function(data) {
    if(!this.RTCSession){
        log.error('shareScreen: invalid RTCSession parameters! ')
        return
    }

    let This = this
    let type = 'slides'
    let pc = this.RTCSession.peerConnections['multiStreamPeer']

    this.action = 'shareScreen'
    this.on('shareScreen', data.callback)

    function getMediaCallBack(event){
        if(event.stream){
            log.info('get stream success, ' + event.stream.id)
            let stream = event.stream
            stream.oninactive= function () {
                This.action = 'stopShareScreen'
                window.isPresentShare = 'stop'
                log.warn("user clicks the bottom share bar to stop sharing")
                let stream = This.RTCSession.getStream("slides", true)
                This.RTCSession.closeStream(stream);
                This.stopShareScreen({
                    type: 'slides',
                    callback: data.callback
                })
            }

            This.RTCSession.setStream(stream, type, true)
            This.RTCSession.processAddStream(stream, pc, type)
            This.RTCSession.doOffer(pc)
        }else {
            log.warn('Get present stream failed: ' + event.error)
            data.callback({error: event.error})
        }
    }
    let gumData = {streamType: 'screenShare', callback: getMediaCallBack}
    this.device.getMedia(gumData, data.constraints)
}

/**
 * 切换桌面共享源
 * @param data.type 类型："window"/"screen"/"whiteboard"/"tab"
 * @param data.callback 回调函数
 */
GsRTC.prototype.switchScreenSource = function(data) {
    if(!this.RTCSession){
        log.error('switchScreenSource: invalid RTCSession parameters! ')
        return
    }

    let This = this
    let type = 'slides'
    let previousStream = This.RTCSession.getStream(type, true)
    let pc = this.RTCSession.peerConnections['multiStreamPeer']

    this.action = 'switchScreenSource'
    this.on('switchScreenSource', data.callback)

    function getMediaCallBack(event){
        if(event.stream){
            let stream = event.stream
            stream.oninactive = function () {
                log.warn("user clicks the bottom share bar to stop sharing")
                let stream = This.RTCSession.getStream("slides", true)
                This.RTCSession.closeStream(stream);
                This.stopShareScreen({
                    type: 'slides',
                    callback: data.callback
                })
            }

            if(previousStream && This.isReplaceTrackSupport() && pc.getTransceivers().length > 0){
                log.info('use replace track to switch presentation stream')
                This.RTCSession.processAddStream(stream, pc, type)
                data.callback({codeType: 999})
            }else {
                This.RTCSession.processRemoveStream(previousStream, pc)
                This.RTCSession.processAddStream(stream, pc, type)
                This.RTCSession.doOffer(pc)
            }

            This.RTCSession.closeStream(previousStream)
            This.RTCSession.setStream(stream, type, true)
        }else {
            log.error(event.error.toString())
            data.callback({error: event.error})
        }
    }

    let gumData = {
        streamType: 'screenShare',
        callback: getMediaCallBack
    }
    this.device.getMedia(gumData, data.constraints)
}

/**
 * 关闭桌面演示
 * @param data
 */
GsRTC.prototype.stopShareScreen = function(data) {
    if(!this.RTCSession){
        log.error('stopShareScreen: invalid RTCSession parameters! ')
        return
    }

    let type = 'slides'
    let stream = this.RTCSession.getStream(type, true)
    let pc = this.RTCSession.peerConnections['multiStreamPeer']

    if(stream){
        this.action = 'stopShareScreen'
        this.on('stopShareScreen', data.callback)

        log.info('clear previous stream')
        this.RTCSession.processRemoveStream(stream, pc, type)
        this.RTCSession.closeStream(stream)
        this.RTCSession.setStream(null, type, true)
        this.RTCSession.doOffer(pc)
    }
}

/**
 * 暂停桌面演示
 * @param data
 */
GsRTC.prototype.pauseScreenSource = function(data) {
    log.info("carry out pause stream")
    if (!this.RTCSession) {
        log.error('pauseScreenSource: invalid RTCSession parameters! ')
        return
    }
    let type = 'slides'
    let stream = this.RTCSession.getStream(type, true)
    if (stream) {
        this.action = 'pauseScreenSource'
        log.info('pause previous stream')
        this.RTCSession.streamMuteSwitch({type: 'audio', stream: stream,})
        data.callback({codeType: 200})
    }
}

/**
 * 发送DTMF
 * @param data.digit 发送的内容
 * @param data.callback 回调函数
 */
GsRTC.prototype.sendDtmf = function(data){
    log.info('send dtmf digit:  ' + data.digit)
    if(!this.RTCSession){
        log.error('sendDtmf: invalid RTCSession parameters!')
        return
    }
    let pc = this.RTCSession.peerConnections['multiStreamPeer']

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
    if(!this.RTCSession){
        log.error('adjustResolution: invalid RTCSession parameters!')
        return
    }
    if(!data || !data.height){
        log.error('adjustResolution: ERR_INVALID_PARAMETER_VALUE')
        return
    }
    log.info('adjust down resolution:  ' + data.height)

    let pc = this.RTCSession.peerConnections['multiStreamPeer']
    this.action = 'adjustResolution'
    this.on('adjustResolution', data.callback)
    this.setVideoResolution(this.getResolutionByHeight(data.height), 'EXPECT_RECV_RESOLUTION')

    this.RTCSession.doOffer(pc)
}



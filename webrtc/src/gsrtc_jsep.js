/*Log Debug Start*/
var log = {};
log.debug = window.debug("GARTC_JSEP:DEBUG");
log.log = window.debug("GARTC_JSEP:LOG");
log.info = window.debug("GARTC_JSEP:INFO");
log.warn = window.debug("GARTC_JSEP:WARN");
log.error = window.debug("GARTC_JSEP:ERROR");
/*Log Debug End*/

/**
 * create PeerConnection instance
 * @param gsRTC
 * @constructor
 */
let PeerConnection = function (gsRTC) {
    // this.gsRTC = gsRTC
    // this.conf = {}
    this.peerConnection = null
    this.isProcessingInvite = false

    this.isSendReInvite = false            // 判断是否为re-invite
    this.sendCtrlPresentation = false      // 判断是否需要发送ctrlPresentation控制信令
    this.sharingPermission = 0             // 标记共享命令：1开启 0关闭 (webUI) / 2开启 3关闭(遥控器) / 4请求结束通话 5结束通话
    this.mLineOrder = []                   // 记录m行的顺序
    this.initialResolution = null

    this.replyOpenSharingTimerTime = 35                    // 回复开启演示的时间
    this.openSharingTimeoutstartTime = null                // 开启演示超时
    this.openSharingTimestamp = null                       // 计算时间戳
    this.timeBox = null                                    // shareScreenRequest开启共享定时器 或者 发送ctrlPresentation开启定时器(回复webUI请求信令超时)
    this.openSharing = false                               // 判断是否正在开启演示

    this.isOpenSharingReceiveReply = false                 // 是否回复开启演示信令
    this.isSendCancelRequest = false                       // 是否发送取消开启演示信令
    this.reqId = null                                      // 某个动作的reqId
    this.cancelReqId = null                                // 取消某个动作对应的reqId，如取消开启演示
    this.cancelReqCmd = null                               // 取消某个动作对应的信令，如ctrlPresentation
}

/**
 * create webRTC multiStream Peer connection
 * @param conf
 */
PeerConnection.prototype.createMultiStreamRTCSession = function(conf){
    log.info('create webRTC multiStream Peer connection')
    try {
        let This = this
        let type = 'multiStreamPeer'
        this.peerConnection = This.createPeerConnection(type, conf)
        let pc = This.peerConnection

        if(RTCPeerConnection.prototype.addTransceiver){
            log.info('use addTransceiver to add transceiver ');
            // add audio Transceiver to keep audio media first
            pc.addTransceiver('audio')
            pc.addTransceiver('video')
            pc.addTransceiver('video')
        }else {
            log.info('use captureStream to add transceiver ');
            // get two video stream
            let streamArray = This.getCaptureStream(2)
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
        }

        This.doOffer(pc)
    }catch (e) {
        log.error(e)
    }
}

/**
 * Listen for stream change events
 * @param pc
 */
PeerConnection.prototype.subscribeStreamEvents = function (pc) {
    let This = this
    if (gsRTC.isReplaceTrackSupport()) {
            pc.ontrack = function (evt) {
            log.info('__on_add_track')
            let stream = evt.streams ? evt.streams[0] : null
            log.info('__on_add_track: ', stream)
            if (!stream && evt.track) {
                log.info('`stream` is undefined on `ontrack` event in WebRTC', evt.track)
                stream = new MediaStream()
                stream.addTrack(evt.track)
            }

            if(stream){
                let type = gsRTC.getTypeByMid(evt.transceiver.mid)
                This.setStream(stream, type, false)

                stream.onremovetrack = function (evt) {
                    log.info('__on_remove_track')
                    This.setStream(null, type, false)
                }
            }
        }
    } else {
        pc.onaddstream = function (evt) {
            log.info('__on_add_stream')
            let type = pc.type
            This.setStream(evt.stream, type, false)
        }
        pc.onremovestream = function (evt) {
            log.info('__on_remove_stream')
            let type = This.getTypeByStreamId(evt.currentTarget.id)
            This.setStream(null, type, false)
        }
    }
}



/**
 * create peerConnection
 * @param type
 * @param conf
 * @returns {RTCPeerConnection}
 */
PeerConnection.prototype.createPeerConnection = function (type, conf) {
    log.info("Create peerConnection : " + type)
    let This = this
    let pc
    let config = {
        iceTransportPolicy: 'all',
        bundlePolicy: 'max-compat'
    }
    let iceservers = conf.iceServer;
    let RTCpeerConnectionOptional = gsRTC.conf.RTCpeerConnectionOptional;
    // chrome 72 版本默认unified-plan， 65版本开始unified-plan为实验性质标志，通过sdpSemantics: unified-plan 启用
    if (RTCpeerConnectionOptional === null || RTCpeerConnectionOptional === undefined) {
        RTCpeerConnectionOptional = { optional: [ { 'pcName': "PC_" + type + "_" + Math.random().toString(36).substr(2) }, { 'googDscp': true }, { 'googIPv6': true } ] };
    }
    else if(RTCpeerConnectionOptional && RTCpeerConnectionOptional.optional && RTCpeerConnectionOptional.optional.length > 0){
        RTCpeerConnectionOptional.optional.push( { 'pcName': "PC_" + type + "_" + Math.random().toString(36).substr(2) }, { 'googDscp': true }, { 'googIPv6': true });
    }
    // config["sdpSemantics"] = "unified-plan";
    if(iceservers === null || iceservers === undefined || iceservers.length === 0){
        log.info('iceServers is null')
    }else {
        log.info('icesServer ' + gsRTC.conf.iceServer)
        config.iceServers = gsRTC.conf.iceServer;
    }
    if(gsRTC.getBrowserDetail().browser !== 'firefox'){
        // firefox not support no need set sdpSemantics config
        config.sdpSemantics = "unified-plan";
    }

    log.warn("config: ", config)
    log.warn("RTCpeerConnectionOptional: ", RTCpeerConnectionOptional)

    pc = new window.RTCPeerConnection(config, RTCpeerConnectionOptional)
    pc.type = type;
    pc.pcName = "PC_" + type + "_" + Math.random().toString(36).substr(2)
    pc.peerId = Math.random().toString(36).substr(2)
    pc.action = null
    pc.iceFailureNum = 0
    pc.isIceFailed = false
    pc.isLocalSdpPending = true;
    This.subscribeStreamEvents(pc)


    pc.onicecandidate = function (event) {
        This.onIceCandidate(pc, event);
    };

    pc.onsignalingstatechange = function () {
        This.onSignalingStateChange(pc)
    }

    pc.onicegatheringstatechange = function () {
        This.onIceGatheringStateChange(pc)
    }

    pc.oniceconnectionstatechange = function () {
        This.onIceConnectionStateChange(pc);
    }

    pc.onconnectionstatechange = function (event) {
        This.onConnectionStateChange(pc, event)
    }
    return pc
}

/**
 * create localDescription: create offer and setLocalDescription
 * @param pc
 * @returns {Promise<void>}
 */
PeerConnection.prototype.doOffer = async function (pc) {
    let This = this
    This.isProcessingInvite = true
    log.info("create sdp( PC: " + pc.type + " )");
    // Added checks to ensure that connection object is defined first
    if (!pc) {
        log.info('RTCSessionDescription offer, Dropping of creating of offer as connection does not exists');
        return;
    }

    // Added checks to ensure that state is "stable" if setting local "offer"
    if (pc.signalingState !== 'stable') {
        log.warn("Dropping of creating of offer as signalingState is not " + pc.signalingState);
        return;
    }

    log.info('Creating offer');
    var offerConstraints = {
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
    }

    async function onCreateOfferSuccess(desc) {
        log.log(`Offer from ` + pc.type + ` \n${desc.sdp}`);
        log.info('start setLocalDescription');
        try {
            await pc.setLocalDescription(desc);
            This.setLocalDescriptionSuccess(pc);
        } catch (error) {
            This.onSetLocalDescriptionError(error);
        }
    }

    try {
        log.log(pc.type + ' createOffer start');
        let offer
        if(pc.action === 'iceRestart'){
            offerConstraints.iceRestart = true
            offer = await pc.createOffer(offerConstraints);
        }else{
            offer = await pc.createOffer(offerConstraints );
        }
        await onCreateOfferSuccess(offer);
    } catch (error) {
        This.onCreateLocalDescriptionError(error);
    }
}

/***
 * create localDescription: create answer and setLocalDescription
 * @param pc
 * @returns {Promise<void>}
 */
PeerConnection.prototype.doAnswer = async function (pc) {
    let This = this
    pc.isLocalSdpPending = true
    This.isProcessingInvite = true
    log.info("prepare do answer")
    // Added checks to ensure that connection object is defined first
    if (!pc) {
        log.info('RTCSessionDescription offer Dropping of creating of answer as connection does not exists');
        return;
    }

    // Added checks to ensure that state is "stable" if createAnswer
    if (pc.signalingState !== 'have-remote-offer') {
        log.info("Dropping of creating of offer as signalingState is not " + pc.signalingState);
        return;
    }

    async function onCreateAnswerSuccess(desc) {
        log.info(pc.type + `createAnswerSuccess`);
        log.info(pc.type + ' setLocalDescription start');
        try {
            await pc.setLocalDescription(desc);
            This.setLocalDescriptionSuccess(pc);
        } catch (e) {
            This.onSetLocalDescriptionError(error);
        }
    }

    log.info('createAnswer start');
    try {
        const answer = await pc.createAnswer();
        await onCreateAnswerSuccess(answer);
    } catch (e) {
        This.onCreateLocalDescriptionError(e);
    }
}

/**
 * fired when peerConnection set localDescription success
 * @returns {boolean}
 */
PeerConnection.prototype.setLocalDescriptionSuccess = function (pc) {
    log.info('setLocalDescription success ( ' + pc.type + ')')
    // If you don't recollect the dates, you need to judge here whether you can send invite or 200 ok
    if (pc.iceGatheringState === 'complete' && !pc.isLocalSdpPending) {
        log.info("onSetLocalDescriptionSuccess send invite( PC: " + pc.type + " )");
        this.onIceGatheringCompleted();
    }
}

/**
 * fired when peerConnection set localDescription failed
 * @param error
 */
PeerConnection.prototype.onSetLocalDescriptionError = function (error) {
    log.error(`Failed to set local description: ${error}`);
}

/**
 * fired when peerConnection createOffer or createAnswer failed
 * @param error
 */
PeerConnection.prototype.onCreateLocalDescriptionError = function (error) {
    log.error(`Failed to create session description: ${error}`);
}

/**
 * setRemoteDescription when answer sdp from the server
 * @param sdp
 */
PeerConnection.prototype.setRemote = async function (sdp) {
    let This = this
    try {
        let pc = gsRTC.RTCSession.peerConnection
        log.info('setRemoteDescription (' + pc.type + ')')
        log.info('onSignalingStateChange type: ' + pc.type + ', signalingState: ' + pc.signalingState)
        log.info('setRemote sdp:\n' + sdp)
        let desc = new window.RTCSessionDescription({type: 'answer', sdp: sdp})
        await pc.setRemoteDescription(desc)
        This.setRemoteDescriptionSuccess(pc)
    } catch (e) {
        This.onSetRemoteDescriptionError(e);
    }
}

/**
 * set remote desc success
 * @param pc
 */
PeerConnection.prototype.setRemoteDescriptionSuccess = function () {
    let This = this
    log.info('setRemoteDescription success ')

    if(This.peerConnection.action === 'iceRestart'){
        gsRTC.trigger('onIceReconnect', {codeType: gsRTC.CODE_TYPE.SUCCESS.codeType})
        This.peerConnection.action = null
    }else{
        if(This.sharingPermission === 1 || This.sharingPermission === 3){
            This.openSharing = true
        }
        gsRTC.trigger(gsRTC.action, {codeType: gsRTC.CODE_TYPE.SUCCESS.codeType})
    }
}

/**
 * set remote desc error
 * @param error
 */
PeerConnection.prototype.onSetRemoteDescriptionError = function (error) {
    log.error(`Failed to set remote description: ${error}`);
    console.error(error)
}

/**
 * close  stream
 *@param stream
 *  **/

PeerConnection.prototype.stopTrack = function (stream){
    log.info("stop stream and stop track")
    let tracks = stream.getTracks();
    for (let track in tracks) {
        tracks[track].onended = null;
        tracks[track].stop();
    }
}

/**
 * get codec to enable ExternalEncoder
 * @param media
 * @returns {*}
 */
PeerConnection.prototype.getExternalEncoder = function(media){
    let codec
    if(media && media.fmtp && media.fmtp.length){
        for(let i = 0; i< media.fmtp.length; i++){
            let config = media.fmtp[i].config
            if(config.indexOf('packetization-mode=1') >= 0 && config.indexOf('profile-level-id=42e0') >= 0) {
                codec = media.fmtp[i].payload
                break;
            }
        }
        if(!codec){
            for(let i = 0; i<media.fmtp.length; i++){
                let config = media.fmtp[i].config
                if(config.indexOf('packetization-mode=1') >= 0 && config.indexOf('profile-level-id=4200') >= 0) {
                    codec = media.fmtp[i].payload
                    break;
                }
            }
        }
        log.info('get priority H264 PT ' + codec)
    }
    return codec
}
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
    this.gsRTC = gsRTC
    this.conf = {}
    this.peerConnection = null
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

        // if(RTCPeerConnection.prototype.addTransceiver){
        //     log.info('use addTransceiver to add transceiver ');
        //     // add audio Transceiver to keep audio media first
        //     pc.addTransceiver('audio')
        //     pc.addTransceiver('video')
        //     pc.addTransceiver('video')
        // }else {
            log.info('use captureStream to add transceiver ');
            // get two video stream
            let streamArray = This.getCaptureStream(2)
            for(let i = 0; i<streamArray.length; i++){
                let stream = streamArray[i]
                log.info('add stream to peerConnection: ' + stream.id)
                pc.addStream(stream)
            }
        // }

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
    if (this.gsRTC.isReplaceTrackSupport()) {
        pc.ontrack = function (evt) {
            log.info('__on_add_track')
            if(evt.streams[0]){
                let type = This.gsRTC.getTypeByMid(evt.transceiver.mid)
                This.setStream(evt.streams[0], type, false)

                evt.streams[0].onremovetrack = function (evt) {
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
    let config = {iceTransportPolicy: 'all'}
    let iceservers = conf.iceServer;
    let RTCpeerConnectionOptional = This.conf.RTCpeerConnectionOptional;
    // chrome 72 版本默认unified-plan， 65版本开始unified-plan为实验性质标志，通过sdpSemantics: unified-plan 启用
    if (RTCpeerConnectionOptional === null || RTCpeerConnectionOptional === undefined) {
        RTCpeerConnectionOptional = { optional: [ { 'pcName': "PC_" + type + "_" + Math.random().toString(36).substr(2) }, { 'googDscp': true }, { 'googIPv6': false } ] };
    }
    else if(RTCpeerConnectionOptional && RTCpeerConnectionOptional.optional && RTCpeerConnectionOptional.optional.length > 0){
        RTCpeerConnectionOptional.optional.push( { 'pcName': "PC_" + type + "_" + Math.random().toString(36).substr(2) }, { 'googDscp': true }, { 'googIPv6': false });
    }
    // config["sdpSemantics"] = "unified-plan";
    if(iceservers === null || iceservers === undefined || iceservers.length === 0){
        log.info('iceServers is null')
    }else {
        log.info('icesServer ' + This.conf.iceServer)
        config.iceServers = conf.iceServer;
    }
    if(This.gsRTC.getBrowserDetail().browser !== 'firefox'){
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

    // 服务器回复的200 ok中，audio默认 sendrecv，不添加流的话会报错："Answer tried to set recv when offer did not set send"
    if(!This.gsRTC.MEDIA_STREAMS.LOCAL_AUDIO_STREAM){
        if(This.gsRTC.getBrowserDetail().browser === 'firefox' && This.gsRTC.getBrowserDetail().version > 60){
            log.warn('firefox get fake stream')
            function getMediaCallBack(data){
                if(data.stream){
                    log.info('get fake stream success')
                    data.stream.getTracks().forEach(function(track) {
                        track.enabled = false; //Mute this track, incase the audio send out.
                    });
                    This.processAddStream(data.stream , pc, 'audio');
                }else {
                    log.info(data)
                    log.error(data.error)
                }
            }
            let conf = { streamType: 'audio', callback: getMediaCallBack }
            let constraints =  { audio: true, video: false, fake: true }
            This.gsRTC.device.getMedia(conf, constraints)
        }
    }

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
    This.gsRTC.isProcessingInvite = true
    log.info("create sdp( PC: " + pc.type + " )");
    // Added checks to ensure that connection object is defined first
    if (!pc) {
        log.info('RTCSessionDescription offer, Dropping of creating of offer as connection does not exists');
        return;
    }

    // Added checks to ensure that state is "stable" if setting local "offer"
    if (pc.signalingState !== 'stable') {
        log.info("Dropping of creating of offer as signalingState is not " + pc.signalingState);
        return;
    }
    log.info('Creating offer');

    pc.offerConstraints = {
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
        const offer = await pc.createOffer(pc.offerConstraints);
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
    this.gsRTC.isProcessingInvite = true
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
    if (pc.iceGatheringState === 'complete') {
        pc.isLocalSdpPending = false
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
PeerConnection.prototype.setRemoteDescriptionSuccess = function (pc) {
    let This = this
    log.info('setRemoteDescription success ( ' + pc.type + ')')
    This.gsRTC.sokect.handleSharingSignal()
}

/**
 * set remote desc error
 * @param error
 */
PeerConnection.prototype.onSetRemoteDescriptionError = function (error) {
    log.error(`Failed to set remote description: ${error}`);
    console.error(error)
}

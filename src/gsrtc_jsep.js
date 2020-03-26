/*Log Debug Start*/
var log = {};
log.debug = window.debug("JSEP:DEBUG");
log.log = window.debug("JSEP:LOG");
log.info = window.debug("JSEP:INFO");
log.warn = window.debug("JSEP:WARN");
log.error = window.debug("JSEP:ERROR");
/*Log Debug End*/

/**
 * create PeerConnection instance
 * @param config
 * @param gsRTC
 * @constructor
 */
let PeerConnection = function (config, gsRTC) {
    this.gsRTC = gsRTC
    this.conf = config
    this.deviceId = null
    this.peerConnections = []
}

/**
 * create PeerConnection instance
 */
PeerConnection.prototype.createRTCSession = async function (conf) {
    log.info('Get lo: create webRTC session')
    let This = this
    try {
        let sessionsConfig = conf.sessionsConfig ? conf.sessionsConfig : {}
        if (sessionsConfig) {
            if (!this.peerConnections) {
                this.peerConnections = []
            }
            for (let i = 0; i < sessionsConfig.length; i++) {
                let type = sessionsConfig[i]
                this.peerConnections[type] = this.createPeerConnection(type, conf)
                // for wfu add stream
                // let pc = this.peerConnections[type]
                // let stream
                // if(type === 'audio'){
                //     stream = await navigator.mediaDevices.getUserMedia({audio: true, video: false})
                //     console.warn(pc.type + " add stream: ", stream.id)
                // }else if(type === 'main'){
                //     stream = await navigator.mediaDevices.getUserMedia({audio: false, video: {width: 640, height: 360}})
                //     console.warn(pc.type + " add stream: ", stream.id)
                //
                // }else if(type === 'video1'){
                //     // stream = await navigator.mediaDevices.getUserMedia({audio: false, video: {width: 1280, height: 720}})
                //     // console.warn(pc.type + " add stream: ", stream.id)
                // }else if(type === 'slides'){
                //     let constraints = {
                //         audio: false,
                //         video: {
                //             width: { max: 1920, },
                //             height: { max: 1080,},
                //             frameRate: { max: 15,}
                //         }
                //     };
                //
                //     if('getDisplayMedia' in window.navigator){
                //         stream = await navigator.getDisplayMedia(constraints)
                //     }else if('getDisplayMedia' in window.navigator.mediaDevices){
                //         stream = await navigator.mediaDevices.getDisplayMedia(constraints)
                //     }else {
                //         log.warn("The browser does not support the getDisplayMedia interface.");
                //     }
                //
                // }
                //
                // if(stream){
                //     console.warn(pc.type + ' add stream')
                //     This.setMediaElementStream(stream, type, true)
                //     pc.addStream(stream)
                // }

                if(type === 'main'){
                    log.warn('add '+ type + ' stream')
                    let stream = getCaptureStream(type)
                    log.info('get stream : ', stream.id)
                    This.setStream(stream, type, true)

                    let pc = this.peerConnections[type]
                    pc.addStream(stream)
                }

                if(type === 'slides'){
                    log.warn('add '+ type + ' stream')
                    let stream = getSlidesCaptureStream(type)
                    log.info('get stream : ', stream.id)
                    This.setStream(stream, type, true)

                    let pc = this.peerConnections[type]
                    pc.addStream(stream)
                }

                this.doOffer(this.peerConnections[type])
            }
        } else {
            log.warn('can not create RTCSession with conf is null')
        }
    } catch (e) {
        log.error(e)
    }
}

/**
 * create webRTC multiStream Peer connection
 * @param conf
 */
PeerConnection.prototype.createMultiStreamRTCSession = function(conf){
    log.info('create webRTC multiStream Peer connection')
    try {
        let This = this
        let sessionsConfig = conf.sessionsConfig ? conf.sessionsConfig : ['multiStreamPeer']
        let type = sessionsConfig[0]

        this.peerConnections[type] = This.createPeerConnection(type, conf)
        let pc = this.peerConnections[type]
        // create transceiver
        if(RTCPeerConnection.prototype.addTransceiver){
            log.info('use addTransceiver to add transceiver ');
            // add audio Transceiver to keep audio media first
            pc.addTransceiver('audio')
            pc.addTransceiver('video')
            pc.addTransceiver('video')
        }else {
            log.info('use captureStream to add transceiver ');
            // get two video stream
            let streamArray = this.getCaptureStream(2)
            for(let i = 0; i<streamArray.length; i++){
                let stream = streamArray[i]
                log.info('add stream to peerConnection: ' + stream.id)
                pc.addStream(stream)
                // stream.getTracks().forEach(track => pc.addTrack(track, stream));
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
    if (this.gsRTC.isReplaceTrackSupport()) {
        pc.ontrack = function (evt) {
            log.info('__on_add_track')
            let type = This.gsRTC.enableMultiStream ? This.getTypeByMid(evt.transceiver.mid) : pc.type
            This.setStream(evt.streams[0], type, false)

            evt.streams[0].onremovetrack = function (evt) {
                log.info('__on_remove_track')
                let type = This.gsRTC.enableMultiStream ? This.getTypeByStreamId(evt.currentTarget.id) : pc.type
                This.setStream(null, type, false)
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
            let type = This.gsRTC.enableMultiStream ? This.getTypeByStreamId(evt.currentTarget.id) : pc.type
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
    let RTCpeerConnectionOptional = this.conf.RTCpeerConnectionOptional;
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
    this.subscribeStreamEvents(pc)

    // 服务器回复的200 ok中，audio默认 sendrecv，不添加流的话会报错："Answer tried to set recv when offer did not set send"
    if((type === 'audio' || type === 'multiStreamPeer') && !This.gsRTC.MEDIA_STREAMS.LOCAL_AUDIO_STREAM){
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
            this.gsRTC.device.getMedia(conf, constraints)
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
    this.gsRTC.isProcessingInvite = true
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
        offerToReceiveAudio: pc.type === 'multiStreamPeer' ? true : pc.type === 'audio',
        offerToReceiveVideo: pc.type === 'multiStreamPeer' ? true : pc.type !== 'audio'
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
PeerConnection.prototype.setRemote = function (sdp) {
    let This = this

    async function setRo(pc, sdp) {
        try {
            log.info('setRemoteDescription (' + pc.type + ')')
            let roSdp = This.gsRTC.getSdpByType(pc.type, sdp)
            log.info('onSignalingStateChange type: ' + pc.type + ', signalingState: ' + pc.signalingState)
            let desc = new window.RTCSessionDescription({type: 'answer', sdp: roSdp})
            await pc.setRemoteDescription(desc)
            This.setRemoteDescriptionSuccess(pc)
        } catch (e) {
            This.onSetRemoteDescriptionError(e);
        }
    }

    for (let key in this.peerConnections) {
        let pc = this.peerConnections[key]
        if (pc.signalingState !== 'have-local-offer') {
            log.info(pc.type + " dropping of setRemoteDescription as signalingState is " + pc.signalingState);
            continue;
        }
        setRo(pc, sdp)
    }
}

/**
 * set remote desc success
 * @param pc
 */
PeerConnection.prototype.setRemoteDescriptionSuccess = function (pc) {
    log.info('setRemoteDescription success ( ' + pc.type + ')')
    this.gsRTC.inviteProcessing = false
    let stream = this.getStream(pc.type, true)
    if (pc.type === 'main' && stream && stream.active === true && !window.wfu) {
        log.info(pc.type + " prepare get new stream")
        this.getNewStream(pc)
    }

    // ice restart的时候，处理完前面的invite之后再处理后面的invite
    for(let i = 0; i<this.gsRTC.sendInviteQueue.length; i++){
        let item = this.gsRTC.sendInviteQueue[i]
        if(item.type === pc.type && item.action ===  pc.action){
            this.gsRTC.sendInviteQueue.splice(i, 1)
            pc.action = null
            if(this.gsRTC.sendInviteQueue && this.gsRTC.sendInviteQueue.length > 0){
                this.gsRTC.action = this.gsRTC.sendInviteQueue[0].action
                let type =  this.gsRTC.sendInviteQueue[0].type
                let pc = this.gsRTC.RTCSession.peerConnections[type]
                this.doOffer(pc)
            }
        }
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
 * handle server re-invite
 * @param sdp
 */
PeerConnection.prototype.handleOffer = function (sdp) {
    let This = this

    async function setRo(pc) {
        try {
            log.info('setRemoteDescription (' + pc.type + ')')
            let roSdp = This.gsRTC.getSdpByType(pc.type, sdp)
            log.info('onSignalingStateChange type: ' + pc.type + ', signalingState: ' + pc.signalingState)
            let desc = new window.RTCSessionDescription({type: 'offer', sdp: roSdp})
            await pc.setRemoteDescription(desc)
            This.setRemoteDescriptionSuccess(pc)
            This.doAnswer(pc)
        } catch (e) {
            This.onSetRemoteDescriptionError(e);
        }
    }

    for (let key in this.peerConnections) {
        let pc = this.peerConnections[key]
        if (pc.signalingState !== 'stable') {
            log.info(pc.type + " dropping of creating of offer as signalingState is not stable");
            continue;
        }

        let newRo = This.gsRTC.getSdpByType(pc.type, sdp)
        let currentRo = pc.currentRemoteDescription ? pc.currentRemoteDescription : pc.remoteDescription
        // Compare the sdp of each peerConnection after receiving sdp each time
        if (!This.gsRTC.isObjectXExactlyEqualToY(newRo, currentRo)) {
            setRo(pc)
        } else {
            log.info('current remote description is not change')
        }
    }
}

/***
 * JSEP rollback operation for 491 invite conflict
 * plan one: setRemoteDescription direct
 */
PeerConnection.prototype.rollbackOperation = async function () {
    log.info('jsep rollback operation')
    var This = this

    // setRemoteDescription direct
    async function setRemote(pc) {
        log.warn(pc.type + " peerConnection signalingState: " + pc.signalingState)
        try {
            let sdp = pc.currentRemoteDescription ? pc.currentRemoteDescription : pc.remoteDescription
            let description = new window.RTCSessionDescription(sdp)
            await pc.setRemoteDescription(description)
            This.setRemoteDescriptionSuccess(pc)
        } catch (e) {
            This.onSetRemoteDescriptionError(error);
        }
    }

    for (let i = 0; i < This.peerConnections.length; i++) {
        let pc = This.peerConnections[i]
        if (pc.signalingState === 'have-local-offer') {
            setRemote(pc)
        }
    }

    log.info('set isProcessingInvite to false')
    This.gsRTC.isProcessingInvite = false
}

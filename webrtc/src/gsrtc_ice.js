
PeerConnection.prototype.onConnectionStateChange = function(pc){
    log.info('onConnectionStateChange type: ' + pc.type + ', connectionState: ' + pc.connectionState)

    let browserDetails = this.gsRTC.getBrowserDetail()
    if(pc.connectionState === 'failed' && ((browserDetails.browser === 'chrome' && browserDetails.version >= 76) || (browserDetails.browser === 'opera' &&browserDetails.chromeVersion >= 76))){
        this.iceConnectFailed(pc);
    }
}

PeerConnection.prototype.onIceConnectionStateChange = function(pc){
    if (!pc) {
        log.warn('Ignoring of ICE candidate event as Peer connection does not exists ->');
        return
    }

    let iceState =  pc.iceConnectionState
    log.info("onIceConnectionStateChange this type: " + pc.type + ", iceConnectionState: " + iceState);
    switch (iceState) {
        case 'new':
        case 'starting':
        case 'checking':
            break
        case 'connected':
            if(pc.isIceFailed){
                log.info("iceRestartSuccess alter web");
                this.onIceRestartSuccess(pc)
            }
            break
        case 'failed':
            this.iceConnectFailed(pc)
            break
        case 'completed':
        case 'closed':
        case 'disconnected':
            break
        default:
            break
    }
}

PeerConnection.prototype.onSignalingStateChange = function(pc){
    if (!pc) {
        log.info('PeerConnection is null: unexpected')
        return
    }
    log.info('onSignalingStateChange type: ' + pc.type + ', signalingState: ' + pc.signalingState)
}

PeerConnection.prototype.onIceGatheringStateChange = function(pc){
    if (!pc) {
        log.info('PeerConnection is null: unexpected')
        return
    }

    log.info('onicegatheringstatechange type: ' + pc.type + ', iceGatheringState: ' + pc.iceGatheringState)
}

PeerConnection.prototype.iceConnectFailed = function(pc){
    log.warn("iceConnectFailed, o_failure_num: " + pc.iceFailureNum + "  (PC:" + pc.type + ")");
    pc.action = 'iceRestart'
    // Re-connected three times without success is considered a failure
    if(pc.iceFailureNum >= 3){
        log.error("Failed to do ice restart(PC: " + pc.type + ")");
        if(!pc.isIceFailed){
            pc.isIceFailed = true
        }
        this.onIceRestartFailed();
    }else {
        log.info('Prepare start do ice restart！')
        pc.isIceFailed = true
        this.doOffer(pc)
        pc.iceFailureNum ++
    }
}

PeerConnection.prototype.onIceRestartSuccess = function (pc) {
    log.info("ice restart success" + "  (PC:" + pc.type + ")")
    pc.iceFailureNum = 0
    pc.isIceFailed = false
}

PeerConnection.prototype.onIceRestartFailed = function (pc) {
    log.error("ice restart failed")
    pc.iceFailureNum = 0
    pc.isIceFailed = true
    log.info('close peer')
    for (let key in this.RTCSession.peerConnections) {
        let pc = this.RTCSession.peerConnections[key];
        // close peerConnection
        pc.getSenders().forEach(sender => {
            delete sender.track
            sender.replaceTrack(null)
        })
        pc.close()
    }
}

PeerConnection.prototype.onIceCandidate = function (pc, event) {
    let iceState = pc.iceGatheringState
    if(iceState === "completed" || iceState === "complete" || (event && !event.candidate)){
        log.warn("onIceCandidate: ICE GATHERING COMPLETED( PC: " + pc.type + ")");
        pc.isLocalSdpPending = false
        this.onIceGatheringCompleted();
    }else {
        log.info(`ICE candidate:\n${event.candidate ? event.candidate.candidate : '(null)'}`);
    }
}

PeerConnection.prototype.onIceGatheringCompleted = function () {
    if(!this.gsRTC.isProcessingInvite){
        return
    }

    let pc = gsRTC.RTCSession.peerConnections['multiStreamPeer']
    if(pc.isLocalSdpPending === true){
        log.info('MyOnIceGatheringCompleted not ready( ' + pc.type + " )")
        return false;
    }
    log.warn("__MyOnIceGatheringCompleted be ready to send INVITE or 200OK");

    this.gsRTC.isProcessingInvite = false
    this.gsRTC.eventStack({type: 'GET_LO_SUCCESS'})
}








/**
 * get all peerConnection combine sdp
 * @returns {*}
 */
PeerConnection.prototype.getDecorateSdp = function () {
    log.info('get local peers combine sdp')
    let This = this
    let sdp
    let sdpArray = [];
    let parseSdp = null

    if(This.gsRTC.enableMultiStream === true){
        log.warn("decorate multi stream Peer sdp ")
        let pc = This.peerConnections['multiStreamPeer']
        let subSDP = pc.localDescription.sdp;
        sdp = This.gsRTC.decorateMultiStreamSdp(subSDP)
    }else {
        for (let i in This.peerConnections) {
            let pc = This.peerConnections[i]
            let subSDP = pc.localDescription.sdp;

            // save original mid before send invite,
            This.gsRTC.saveMidBeforeSendInvite(subSDP, pc.type)

            if(pc) {
                if(pc.type === 'audio'){
                    log.warn('set audio recvonly to sendrecv for test!')
                    subSDP = subSDP.replace(/a=recvonly/g, "a=sendrecv")
                }

                // video1 for wfu
                if(pc.type === 'main' || pc.type === 'video1'){
                    parseSdp = SDPTools.parseSDP(subSDP)
                    SDPTools.removeCodecByPayload(parseSdp, 0, [98, 99,127, 121, 125, 107, 108, 109, 124, 120, 123 ,119, 114, 115 ,116])
                    // set resolution of sdp
                    let resolution = this.gsRTC.getVideoResolution('EXPECT_RECV_RESOLUTION')
                    if(resolution.width && resolution.height){
                        // set expected receive resolution
                        parseSdp = This.gsRTC.setResolutionOfSdp(parseSdp, resolution.width, resolution.height)
                    }
                    subSDP = SDPTools.writeSDP(parseSdp)
                    // Add media line identification field
                    subSDP = subSDP + "a=content:main\n"
                }
                if(pc.type === 'slides'){

                    parseSdp = SDPTools.parseSDP(subSDP)
                    SDPTools.removeCodecByPayload(parseSdp, 0, [98, 99, 127, 121, 125, 107, 108, 109, 124, 120, 123 ,119, 114, 115 ,116])
                    subSDP = SDPTools.writeSDP(parseSdp)
                    // Add media line identification field
                    subSDP = subSDP + "a=content:slides\n"

                    if(!window.wfu){
                        // set direction recvonly if not share screen
                        let stream = This.getStream('slides', true)
                        if(stream){
                            subSDP = subSDP.replace(/a=sendrecv/g, "a=sendonly");
                            subSDP = subSDP.replace(/a=recvonly/g, "a=sendonly");
                        }else {
                            subSDP = subSDP.replace(/a=sendrecv/g, "a=recvonly");
                        }
                    }
                }
            }
            sdpArray.push(subSDP);
        }
        sdp = SDPTools.mergeSDP(sdpArray);
    }

    return sdp
}

/**
 * decorate remote sdp
 * @param sdp
 */
PeerConnection.prototype.commonDecorateRo  = function(sdp){
    if(!sdp){
        log.error("commonDecorateRo: Invalid Argument");
        return;
    }
    log.info('commonDecorateRo')
    this.setRemote(sdp)
}

/**
 * After receiving 200 ok, adjust the upstream according to the resolution required by the server
 * @param pc
 * @returns {boolean}
 */
PeerConnection.prototype.getNewStream = function (pc) {
    let This = this
    let stream = this.getStream('main', true)
    let isSend = pc.localDescription.sdp.indexOf('sendrecv') >= 0 || pc.localDescription.sdp.indexOf('sendonly') >= 0
    if(stream && stream.active && isSend === true){
        let upResolution = This.gsRTC.getVideoResolution('CURRENT_UP_RESOLUTION')
        let parseSdp = SDPTools.parseSDP(pc.remoteDescription.sdp)
        let askedResolution = This.gsRTC.getResolutionBySdp(parseSdp)

        log.info("resolution(from current sdp): " + askedResolution.height)
        if(upResolution){
            log.info("resolution(from previous sdp): " + upResolution.height);
        }else {
            log.info("resolution(from previous sdp): null");
        }

        let constraints = null
        if(askedResolution && askedResolution.width && askedResolution.height){
            if(!upResolution || upResolution.height !== askedResolution.height){
                let frameRate =  This.gsRTC.getFramerateBySdp(parseSdp)
                let browserDetails = This.gsRTC.getBrowserDetail()
                log.info('adjust resolution!')
                // applyConstraints support chrome64+, firefox all version
                if (stream && stream.active === true && ((
                  browserDetails.browser === 'chrome' && browserDetails.version >= 64)
                  || (browserDetails.browser === 'opera' && browserDetails.chromeVersion >= 64)
                  || browserDetails.browser === 'firefox'))
                {
                    constraints = {
                        frameRate: {
                            max: frameRate ? frameRate: 30,
                            ideal: frameRate ? frameRate: 30
                        },
                        width: {
                            max: askedResolution.width,
                            ideal: askedResolution.width
                        },
                        height: {
                            max: askedResolution.height,
                            ideal: askedResolution.height
                        }
                    }

                    log.info('applyConstraints constraints' + JSON.stringify(constraints, null, '    '))
                    let localVideoTrack = stream.getVideoTracks()[0];
                    localVideoTrack.applyConstraints(constraints).then(function () {
                        log.info('applyConstraints succeed');
                        This.setStream(stream, 'main', true)
                    }).catch(function (error) {
                        log.error("applyConstraints Error: " , error);
                    })
                }else {
                    // getUserMedia 重新取流后需要re-invite，否则视频会loading，因为ssrc已经改变了
                    log.info('getUserMedia')
                    let type = 'main'
                    function getStreamCallback(event){
                        let newStream = event.stream
                        if(newStream){
                            log.info('getUserMedia succeed ', newStream);
                            This.processRemoveStream(stream, pc, type)
                            This.processAddStream(newStream, pc, type)
                            This.setStream(newStream, type, true)
                            This.doOffer(pc)
                        }else if(event.error){
                            log.error(event.error)
                        }
                    }

                    // TODO：这里需要添加deviceId， 因为多个摄像头的时候，取流时可能会换摄像头
                    let gumData = {
                        streamType: 'video',
                        callback: getStreamCallback
                    }
                    let param = {
                        streamType: 'video',
                        constraintsKeyWord: 'exact',
                        deviceId: This.deviceId,
                        frameRate: frameRate,
                        width: askedResolution.width,
                        height: askedResolution.height,
                    }

                    if(this.gsRTC.device){
                        constraints = this.gsRTC.device.getConstraints(param)
                        this.gsRTC.device.getMedia(gumData, constraints)
                    }
                }

                This.gsRTC.setVideoResolution(askedResolution,'CURRENT_UP_RESOLUTION')
            }else {
                log.info("handleOffer: resolution is just right");
            }
        }else {
            log.warn('server asked resolution is null')
            return false
        }

        return true
    }else {
        log.warn('camera is not open, clear local stream')
        This.setStream(null, 'main', true)
        return false
    }
}


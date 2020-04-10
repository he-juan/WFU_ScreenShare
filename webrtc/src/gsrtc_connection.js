/**
 * get local sdp
 * @returns {*}
 */
PeerConnection.prototype.decorateLocalSDP = function () {
    log.info('get local peers combine sdp')
    let This = this
    let sdp

    log.warn("decorate multi stream Peer sdp ")
    let pc = This.peerConnection
    sdp = This.gsRTC.decorateMultiStreamSDP(pc.localDescription.sdp)
    log.info('local sdp:\n' + sdp.toString())
    return sdp
}

/**
 * Processing multiStream sdp
 * @param subSDP
 * @returns {string}
 */
GsRTC.prototype.decorateMultiStreamSDP  = function(subSDP) {
    let This = this
    var sdp
    let sdpArray = []
    let lines = subSDP.split('\n')

    // modified BUNDLE and content
    for(let i = 0; i<lines.length; i++){
        if(lines[i].indexOf('a=group:BUNDLE') >= 0){
            lines.splice(i, 2, "a=msid-semantic: WMS\na=msid-semantic: WMS\na=msid-semantic: WMS\na=group:BUNDLE 0\na=group:BUNDLE 1\na=group:BUNDLE 2");
        }
        if(lines[i].indexOf('a=mid:1') >= 0){
            lines.splice(i+1, 0, "a=content:main\r\n");
            i++
        }
        if(lines[i].indexOf('a=mid:2') >= 0){
            lines.splice(i+1, 0, "a=content:slides\r\n");
            i++
        }
    }

    // get all media line
    function getPositions(arr){
        // get all media line
        let pos = []
        for(let i = 0; i<arr.length; i++){
            if(arr[i].indexOf('m=') >= 0){
                pos.push(i)
            }
        }
        return pos
    }
    let positions = getPositions(lines)

    let target
    let index = 0
    // get audio main slides sdp array
    if(positions.length > 0){
        for(let j = 0; j <= positions.length; j++){
            if(j === positions.length){
                target = lines.slice(positions[index], lines.length).join('\n')
            }else {
                target = lines.slice(positions[j-1], positions[j]).join('\n')
            }
            sdpArray.push(target)
            index = j
        }
    }

    sdpArray[0] = sdpArray[0].concat(['\n'])
    let audioSdp = sdpArray[0].concat(sdpArray[1])
    let mainSdp = sdpArray[0].concat(sdpArray[2])
    let slidesSdp = sdpArray[0].concat(sdpArray[3])

    // delete useless PT number for main
    let mainSdp_ = SDPTools.parseSDP(mainSdp)
    SDPTools.removeCodecByPayload(mainSdp_, 0, [98, 99,127, 121, 125, 107, 108, 109, 124, 120, 123 ,119, 114, 115 ,116])
    // set resolution of sdp
    let resolution = This.getVideoResolution('EXPECT_RECV_RESOLUTION')
    if(resolution.width && resolution.height){
        // set expected receive resolution
        mainSdp_ = This.setResolutionOfSdp(mainSdp_, resolution.width, resolution.height)
    }
    mainSdp = SDPTools.writeSDP(mainSdp_)
    // delete useless PT number for slides
    let slidesSdp_ = SDPTools.parseSDP(slidesSdp)
    SDPTools.removeCodecByPayload(slidesSdp_, 0, [98, 99, 127, 121, 125, 107, 108, 109, 124, 120, 123 ,119, 114, 115 ,116])
    slidesSdp = SDPTools.writeSDP(slidesSdp_)

    // delete ssrc if no stream to send
    function removeSSRC(sdp){
        let sdpArray = sdp.split('\n');
        for(let k = 0; k<sdpArray.length; k++){
            if(sdpArray[k].indexOf('a=ssrc-group:') >= 0 || sdpArray[k].indexOf('a=ssrc') >= 0 || sdpArray[k].indexOf('a=msid:-') >= 0){
                sdpArray.splice(k, 1)
                k--
            }
        }
        return sdpArray.join('\n')
    }

    // modified direction for three media
    let audioStream = This.RTCSession.getStream('audio', true)
    if(!audioStream){
        audioSdp = audioSdp.replace(/a=sendrecv/g, "a=recvonly")
        audioSdp = removeSSRC(audioSdp)
    }
    let mainStream = This.RTCSession.getStream('main', true)
    if(!mainStream){
        mainSdp = mainSdp.replace(/a=sendrecv/g, "a=recvonly")
        mainSdp = removeSSRC(mainSdp)
    }
    // set direction recvonly if not share screen
    let stream = This.RTCSession.getStream('slides', true)
    if(stream){
        slidesSdp = slidesSdp.replace(/a=sendrecv/g, "a=sendonly");
        slidesSdp = slidesSdp.replace(/a=recvonly/g, "a=sendonly");
    }else {
        slidesSdp = slidesSdp.replace(/a=sendrecv/g, "a=recvonly");
        slidesSdp = removeSSRC(slidesSdp)
    }

    audioSdp = audioSdp.replace(/c=IN IP6/g, "c=IN IP4 0.0.0.0")
    mainSdp = mainSdp.replace(/c=IN IP6/g, "c=IN IP4 0.0.0.0")
    slidesSdp = slidesSdp.replace(/c=IN IP6/g, "c=IN IP4 0.0.0.0")

    slidesSdp = gsRTC.setMaxBitrate(slidesSdp, 'video', 4096)
    slidesSdp = gsRTC.setXgoogleBitrate(slidesSdp, 4096)

    function deleteHead(sdp) {
        let lines = sdp.split('\n')
        for(var k = 0; k<lines.length; k++){
            if(lines[k].indexOf('m=') >= 0){
                sdpArray[0] = lines.slice(0, k)
                sdp = lines.slice(k, lines.length).join('\n')
            }
        }
        return sdp
    }

    audioSdp = deleteHead(audioSdp)
    mainSdp = deleteHead(mainSdp)
    slidesSdp = deleteHead(slidesSdp)
    let head =  sdpArray[0].join('\n')
    sdp = head + '\n' + audioSdp + '\n'+ mainSdp + slidesSdp
    return sdp
}

/**
 * decorate remote sdp
 * @param sdp
 */
PeerConnection.prototype.handleRemoteSDP  = function(sdp){
    let This = this
    if(!sdp){
        log.error("commonDecorateRo: Invalid Argument");
        return;
    }
    // TODO: gs_phone 不支持x-googel私有字段，web 端添加
    sdp = gsRTC.setXgoogleBitrate(sdp, 4096)
    log.info('commonDecorateRo:\n'  + sdp)

    This.setRemote(sdp)
    gsRTC.isSendReInvite = true
}

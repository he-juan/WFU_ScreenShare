/***
 * Function that clear stream, free resources
 * @param stream
 */
PeerConnection.prototype.closeStream = function(stream){
    if(!stream){
        log.info('closeStream:stream is null');
        return;
    } else{
        log.info("close stream id: " + stream.id);
    }

    try {
        stream.oninactive = null;
        let tracks = stream.getTracks();
        for (let track in tracks) {
            tracks[track].onended = null;
            log.info("close stream");
            tracks[track].stop();
        }
    }
    catch (error) {
        log.info('closeStream: Failed to close stream');
        log.info(error);
    }
    stream = null;
}

/**
 * Bind page media elements after streaming successfully
 * @param type
 * @param stream
 * @param isLocal
 */
PeerConnection.prototype.setMediaElementStream = function (stream, type, isLocal) {
    log.info('get local/remote stream , ' + type)
    let prefix = isLocal === true ? 'local' : 'remote'
    let identify = null
    let isVideo = !(type === 'audio')
    switch (type) {
        case 'audio':
            identify = prefix + 'Audio'
            break;
        case 'main':
            identify = prefix + 'Video'
            break;
        case 'slides':
            identify = prefix + 'PresentVideo'
            break;
        case 'localVideoShare':
            identify = prefix + 'VideoShare'
            break
        case 'multiStreamPeer':
            // 不支持addTransceiver的浏览器无法判断收到的流的类型，只能判断是audio还是video
            if(stream.getAudioTracks().length > 0){
                identify = prefix + 'Audio'
            }else if(stream.getVideoTracks().length > 0){
                if(!this.gsRTC.HTML_MEDIA_ELEMENT[prefix + 'Video'].srcObject){
                    identify = prefix + 'Video'
                }else if(!this.gsRTC.HTML_MEDIA_ELEMENT[prefix + 'PresentVideo'].srcObject){
                    identify = prefix + 'PresentVideo'
                }else if(!this.gsRTC.HTML_MEDIA_ELEMENT[prefix + 'VideoShare'].srcObject){
                    identify = prefix + 'VideoShare'
                }
            }
            break
        default:
            break;
    }

    // Fires when video metadata loading is complete (displays the current video resolution)
    function displayVideoDimensions(e) {
        let className = e.target.id + '_dimensions'
        let dimensions = document.getElementsByClassName(className);
        if(dimensions && dimensions[0]){
            dimensions[0].innerHTML = e.target.videoWidth + ' x ' + e.target.videoHeight
        }
    }

    let target = this.gsRTC.HTML_MEDIA_ELEMENT[identify]
    if (target) {
        target.srcObject = stream;
        log.info('Get ' + identify +' stream');
        // 会覆盖演示流的oninactive监听事件
        // if(stream){
        //     stream.oninactive = function () {
        //         log.info('stream oninactive, clear element source')
        //         target.srcObject = null
        //     }
        // }
        
        if(isVideo){
            log.info('set video _dimensions')
            target.onloadedmetadata = displayVideoDimensions
        }
    }
}

/**
 * get type by stream id
 * 不支持addTransceiver的浏览器无法判断收到的流的类型，只能判断是audio还是video
 * @param streamId
 * @returns {string}
 */
PeerConnection.prototype.getTypeByStreamId = function(streamId){
    let type
    for(let key in this.gsRTC.MEDIA_STREAMS){
        if(gsRTC.MEDIA_STREAMS[key] && gsRTC.MEDIA_STREAMS[key].id === streamId){
            type = key
        }
    }
    if(type){
        type = type.split('_')[1].toLowerCase()
    }
    return type
}

/**
 * get current stream type by transceiver mid
 * @param mid
 */
PeerConnection.prototype.getTypeByMid = function(mid){
    let type
    switch (mid) {
        case '0':
            type = 'audio'
            break
        case '1':
            type = 'main'
            break
        case '2':
            type = 'slides'
            break
        default:
            break
    }
    log.info('get type by transceiver mid ' + type)

    return type
}

/**
 * get stream from canvas
 * @param number
 * @returns {Array}
 */
PeerConnection.prototype.getCaptureStream = function(number){
    let captureStreamArray = []
    // add canvass
    let canvas = document.createElement("canvas");
    canvas.id = 'canvasForCaptureStream'
    canvas.style.cssText = "display: none"

    for(let i = 0; i<number; i++){
        let stream = canvas.captureStream();
        log.info("get captureStream: ", stream)
        captureStreamArray.push(stream)
    }
    return captureStreamArray
}

/**
 * get stream type
 * @param type audio/main/slides/localVideo
 * @param isLocal
 * @returns {*}
 */
PeerConnection.prototype.getStreamType = function(type, isLocal){
    let streamType = null
    if(isLocal){
        switch (type) {
            case 'audio':
                streamType = 'LOCAL_AUDIO_STREAM'
                break
            case 'main':
                streamType = 'LOCAL_VIDEO_STREAM'
                break
            case 'slides':
                streamType = 'LOCAL_PRESENT_STREAM'
                break
            case 'localVideoShare':
                streamType = 'LOCAL_VIDEO_SHARE_STREAM'
                break
            default:
                log.info('no match type: '+ type)
                break
        }
    }else {
        switch (type) {
            case 'audio':
                streamType = 'REMOTE_AUDIO_STREAM'
                break
            case 'main':
                streamType = 'REMOTE_VIDEO_STREAM'
                break
            case 'slides':
                streamType = 'REMOTE_PRESENT_STREAM'
                break
            case 'localVideoShare':
                streamType = 'REMOTE_VIDEO_SHARE_STREAM'
                break
            default:
                log.info('no match type: '+ type)
                break
        }
    }
    return streamType
}

/**
 * set stream
 * @param stream
 * @param type: audio, main, slides, localVideoShare
 * @param isLocal :true for the local stream and false for the accepted remote stream
 */
PeerConnection.prototype.setStream = function(stream, type, isLocal){
    if (!type){
        log.warn("setStream: Invalid parameter!");
        return
    }

    let streamId = stream ? stream.id : null
    let streamType = this.getStreamType(type, isLocal)
    // multiStream: Browsers that do not support replaceTrack can only be judged by the type of stream
    if(!streamType && stream){
        if(isLocal){
            if(stream.getAudioTracks().length > 0){
                streamType = 'LOCAL_AUDIO_STREAM'
            }else if(stream.getVideoTracks().length > 0){
                if(!this.gsRTC.MEDIA_STREAMS['LOCAL_VIDEO_STREAM']){
                    streamType = 'LOCAL_VIDEO_STREAM'
                }else {
                    streamType = 'LOCAL_PRESENT_STREAM'
                }
            }
        }else {
            if(stream.getAudioTracks().length > 0){
                streamType = 'REMOTE_AUDIO_STREAM'
            }else if(stream.getVideoTracks().length > 0){
                if(!this.gsRTC.MEDIA_STREAMS['REMOTE_VIDEO_STREAM']){
                    streamType = 'REMOTE_VIDEO_STREAM'
                }else {
                    streamType = 'REMOTE_PRESENT_STREAM'
                }
            }
        }
    }

    log.info('set ' + streamType + ' stream id: ' + streamId)
    this.gsRTC.MEDIA_STREAMS[streamType] = stream

    this.setMediaElementStream(stream, type, isLocal)
}

/***
 * get stream
 * @param isLocal: true for the local stream and false for the accepted remote stream
 * @param type audio, main, slides, localVideoShare
 * @returns {*}
 */
PeerConnection.prototype.getStream = function(type, isLocal){
    if (!type){
        log.warn("getStream: Invalid parameter!");
        return
    }

    let streamType = this.getStreamType(type, isLocal)
    let stream = this.gsRTC.MEDIA_STREAMS[streamType]

    if(stream){
        log.info('get ' + streamType + ' stream id :' + stream.id)
    }else {
        log.info('stream null')
    }
    return stream
}

/***
 * Function that stream mute and unmute switch
 * @param data 示例{
 *		stream: stream
 *	  type: 'audio'
 *	  mute: true
 * }
 */
PeerConnection.prototype.streamMuteSwitch = function(data){

    if(data.stream != null && data.stream !== undefined){
        log.info("MuteStream: stream id = " + data.stream.id);
    }else {
        log.warn("stream is not exist!")
        return
    }

    if ( data && data.stream && data.type === 'audio' && data.stream.getAudioTracks().length > 0 ){
        for ( let i = 0; i < data.stream.getAudioTracks().length; i++ ) {
            if (data.mute){
                if ( data.stream.getAudioTracks()[i].enabled === true ) {
                    log.info("MuteStream exec mute audio");
                    data.stream.getAudioTracks()[i].enabled = false;
                }
            }
            else{
                if ( data.stream.getAudioTracks()[i].enabled === false ) {
                    log.info("MuteStream exec unmute audio");
                    data.stream.getAudioTracks()[i].enabled = true;
                }
            }
        }
    } else if( (data.type === 'video' || data.type === 'slides') && data.stream.getVideoTracks().length > 0 ){
        for ( let j = 0; j < data.stream.getVideoTracks().length; j++ ) {
            if (data.mute){
                if ( data.stream.getVideoTracks()[j].enabled === true ) {
                    log.info("MuteStream exec mute video/slides");
                    data.stream.getVideoTracks()[j].enabled = false;
                }
            }
            else{
                if ( data.stream.getVideoTracks()[j].enabled === false ) {
                    log.info("MuteStream exec unmute video/slides");
                    data.stream.getVideoTracks()[j].enabled = true;
                }
            }
        }
    }
}

/**
 * get transceiver mid main for multiStream
 * @param pc
 * @param type
 * @returns {*}
 */
PeerConnection.prototype.getTransceiverMid = function(pc, type){
    log.info('get transceiver')
    let mid = 0

    if(pc.getTransceivers){
        if(type && pc.getTransceivers().length > 0){
            let transceiver = pc.getTransceivers()
            for(let i = 0; i<transceiver.length; i++){
                if((type === 'audio' && transceiver[i].mid === '0') || (type === 'main' && transceiver[i].mid === '1') || (type === 'slides' && transceiver[i].mid === '2')) {
                    mid = i
                    log.info('get transceiver mid' + mid)
                }
            }
        }
    }

    return mid
}

/***
 * Function that add stream
 * @param stream
 * @param pc
 * @param type
 */
PeerConnection.prototype.processAddStream = function (stream, pc, type) {
    log.info('process add stream')
    let This = this

    let mid = this.gsRTC.enableMultiStream ? this.getTransceiverMid(pc, type) : 0
    if(This.gsRTC.isReplaceTrackSupport() && pc.getTransceivers().length > 0){
        if (!RTCRtpTransceiver.prototype.setDirection){
            /** Direction setting occasionally does not trigger onnegotiationneeded */
            pc.getTransceivers()[mid].direction = 'sendonly';
            pc.getTransceivers()[mid].direction = 'inactive';

            pc.getSenders()[mid].replaceTrack(stream.getTracks()[0])
              .then(function () {
                  log.info('use replaceTrack to add stream ');
              })
              .catch(function (error) {
                  console.error(error)
                  log.error(error.toString());
              });
            pc.getTransceivers()[mid].direction = 'sendrecv';
        }else{
            log.info('use replaceTrack to add stream ');
            pc.getTransceivers()[mid].setDirection('sendrecv');
        }
    }else {
        /** see bug 137445 for safari 11.0.2 and 11.1.2 * */
        let browserDetail = this.gsRTC.getBrowserDetail()
        if(browserDetail.browser === 'safari' && (browserDetail.UIVersion === "11.0.2" || browserDetail.UIVersion === "11.1.2") && pc.getSenders().length > 0){
            pc.getSenders()[mid].replaceTrack(stream.getTracks()[0])
                .then(function () {
                    log.info('use replaceTrack to add stream ');
                })
                .catch(function (error) {
                    log.error(error.toString());
                });
        }else if(stream){
            log.info('use addStream to add stream.');
            pc.addStream(stream);
        }
    }
}

/***
 * Function that remove stream
 * @param stream
 * @param pc
 * @param type
 */
PeerConnection.prototype.processRemoveStream = function (stream, pc, type) {
    let This = this
    log.info('process remove stream')

    let mid = this.gsRTC.enableMultiStream ? this.getTransceiverMid(pc, type) : 0
    if(This.gsRTC.isReplaceTrackSupport() && pc.getTransceivers().length > 0){
        if (!RTCRtpTransceiver.prototype.setDirection){
            /** Direction setting occasionally does not trigger onnegotiationneeded */
            pc.getTransceivers()[mid].direction = 'sendonly';
            pc.getTransceivers()[mid].direction = 'inactive';

            pc.getTransceivers()[mid].direction = 'recvonly';
            pc.getSenders()[mid].replaceTrack(null)
                .then(function () {
                    log.info('use replaceTrack to add stream ');
                })
                .catch(function (error) {
                    log.error(error.toString());
                })
        }else{
            log.info('use replaceTrack to remove stream.');
            pc.getTransceivers()[mid].setDirection('recvonly');
        }
    }else {
        /** see bug 137445 for safari 11.0.2 and 11.1.2 * */
        let browserDetail = this.gsRTC.getBrowserDetail()
        if(browserDetail.browser === 'safari' && (browserDetail.UIVersion === "11.0.2" || browserDetail.UIVersion === "11.1.2") && pc.getSenders().length > 0){
            pc.getSenders()[mid].track.enablsed = false;
        }else if(stream){
            pc.removeStream(stream);
        }
        log.info('use removeStream to remove stream ');
    }
}



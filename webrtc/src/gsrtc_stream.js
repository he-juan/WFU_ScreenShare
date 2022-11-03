/*Log Debug Start*/
var log = {};
log.debug = window.debug("GSRTC_STREAM:DEBUG");
log.log = window.debug("GSRTC_STREAM:LOG");
log.info = window.debug("GSRTC_STREAM:INFO");
log.warn = window.debug("GSRTC_STREAM:WARN");
log.error = window.debug("GSRTC_STREAM:ERROR");
/*Log Debug End*/

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
        gsRTC.RTCSession.stopTrack(stream)
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
                if(!gsRTC.HTML_MEDIA_ELEMENT[prefix + 'Video'].srcObject){
                    identify = prefix + 'Video'
                }else if(!gsRTC.HTML_MEDIA_ELEMENT[prefix + 'PresentVideo'].srcObject){
                    identify = prefix + 'PresentVideo'
                }else if(!gsRTC.HTML_MEDIA_ELEMENT[prefix + 'VideoShare'].srcObject){
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
        if(dimensions && dimensions[0] && e.target.videoWidth){
            dimensions[0].innerHTML = e.target.videoWidth + ' x ' + e.target.videoHeight
        }
    }

    let target = gsRTC.HTML_MEDIA_ELEMENT[identify]
    log.info("target:",target)
    if (target) {
        target.srcObject = stream;
        log.info('Get ' + identify +' stream');
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
    for(let key in gsRTC.MEDIA_STREAMS){
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
 * get stream from canvas
 * @param number
 * @returns {Array}
 */
PeerConnection.prototype.getCaptureStream = function(number){
    let captureStreamArray = []
    let canvas = document.createElement("canvas");
    canvas.id = 'canvasForCaptureStream'
    canvas.style.cssText = "display: none"

    function gum() {
        let stream = null
        if(canvas.captureStream){
            stream = canvas.captureStream(5);
        }else if(canvas.mozCaptureStream){
            stream = canvas.mozCaptureStream(5);
        }else {
            log.warn('Current browser does not support captureStream!!')
            return
        }
        log.info("get captureStream: ", stream)
        return stream
    }

    for(let i = 0; i<number; i++){
        let stream = gum();
        captureStreamArray.push(stream)
    }
    canvas = null
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
    log.info('isLocal is ' +  isLocal  + ',  get ' + type +  ' stream ')
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
                if(!gsRTC.MEDIA_STREAMS['LOCAL_VIDEO_STREAM']){
                    streamType = 'LOCAL_VIDEO_STREAM'
                }else {
                    streamType = 'LOCAL_PRESENT_STREAM'
                }
            }
        }else {
            if(stream.getAudioTracks().length > 0){
                streamType = 'REMOTE_AUDIO_STREAM'
            }else if(stream.getVideoTracks().length > 0){
                if(!gsRTC.MEDIA_STREAMS['REMOTE_VIDEO_STREAM']){
                    streamType = 'REMOTE_VIDEO_STREAM'
                }else {
                    streamType = 'REMOTE_PRESENT_STREAM'
                }
            }
        }
    }

    log.info('set ' + streamType + ' stream id: ' + streamId)

    gsRTC.trigger('onStreamChange', {
        stream: stream,
        type: type,
        isLocal: isLocal,
        streamType: streamType
    })

    gsRTC.MEDIA_STREAMS[streamType] = stream
    if(stream){
        this.setMediaElementStream(stream, type, isLocal)
    }
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
    let stream = gsRTC.MEDIA_STREAMS[streamType]

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
    if(data.stream){
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
    } else if( (data.type === 'video' || data.type === 'slides' ) && data.stream.getVideoTracks().length > 0 ){
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

/***
 * Function that add stream
 * @param stream
 * @param pc
 * @param type
 */
PeerConnection.prototype.processAddStream = function (stream, pc, type) {
    log.info('process add stream')
    let This = this
    let mid =  gsRTC.getOriginalMid(type)
    let transceiverTarget
    pc.getTransceivers().map(function (item) {
        if(item.mid == mid){
            transceiverTarget = item
        }
    })

    if(gsRTC.isReplaceTrackSupport() && pc.getTransceivers().length > 0){
        if (!RTCRtpTransceiver.prototype.setDirection){
            /** Direction setting occasionally does not trigger onnegotiationneeded */
            transceiverTarget.direction = 'sendonly';
            transceiverTarget.direction = 'inactive';
            let track = (type === 'audio') ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0]
            transceiverTarget.sender.replaceTrack(track)
                .then(function () {
                    log.info('use replaceTrack to add stream ');
                })
                .catch(function (error) {
                    console.error(error)
                    log.error(error.toString());
                });
            transceiverTarget.direction = 'sendrecv';
        }else{
            log.info('use replaceTrack to add stream ');
            transceiverTarget.setDirection('sendrecv');
        }
    }else {
        /** see bug 137445 for safari 11.0.2 and 11.1.2 * */
        let browserDetail = gsRTC.getBrowserDetail()
        if(browserDetail.browser === 'safari' && (browserDetail.UIVersion === "11.0.2" || browserDetail.UIVersion === "11.1.2" ) && transceiverTarget){
            transceiverTarget.sender.replaceTrack(stream.getTracks()[0])
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

    let mid = gsRTC.getOriginalMid(type)
    let transceiverTarget
    pc.getTransceivers().forEach(function (item) {
        if(mid == item.mid){
            transceiverTarget = item
        }
    })

    if(gsRTC.isReplaceTrackSupport() && pc.getTransceivers().length > 0){
        if (!RTCRtpTransceiver.prototype.setDirection){
            /** Direction setting occasionally does not trigger onnegotiationneeded */
            transceiverTarget.direction = 'sendonly';
            transceiverTarget.direction = 'inactive';

            transceiverTarget.direction = 'recvonly';
            transceiverTarget.sender.replaceTrack(null)
                .then(function () {
                    log.info('use replaceTrack to add stream ');
                })
                .catch(function (error) {
                    log.error(error.toString());
                })
        }else{
            log.info('use replaceTrack to remove stream.');
            transceiverTarget.setDirection('recvonly');
        }
    }else {
        /** see bug 137445 for safari 11.0.2 and 11.1.2 * */
        let browserDetail = gsRTC.getBrowserDetail()
        if(browserDetail.browser === 'safari' && (browserDetail.UIVersion === "11.0.2" || browserDetail.UIVersion === "11.1.2" ) && transceiverTarget){
            transceiverTarget.sender.track.enabled = false;
        }else if(stream){
            pc.removeStream(stream);
        }
        log.info('use removeStream to remove stream ');
    }
}

// 针对stream.inactive 处理（关闭流）
GsRTC.prototype.oninactiveStopStream = function(stream){
    if(!stream){
       log.warn("no stream")
        return
    }
    let This = this
    if( This.RTCSession.sharingPermission === 1){
        if( This.RTCSession.isOpenSharingReceiveReply === false){
            log.info('do not receive reply of shareScreen signaling: user trigger  bar close stream')
            if( This.RTCSession.isSendCancelRequest === false){
                log.info('be ready to execute the cancel process ')
                This.RTCSession.isSendCancelRequest = true
                This.sendCancel(stream)
            }else{
                log.warn('reply cancelRequest')
                //此场景暂时没有  如果有，则根据前端的传下来的参数关闭流即可
            }
        }else{
            //gsphone 回复了开启演示信令
            log.info('receive reply of shareScreen signaling: user  trigger  bar close stream')
            if( This.RTCSession.isSendCancelRequest === false){
                if( This.RTCSession.openSharing === false){
                    This.RTCSession.isSendCancelRequest = true
                    log.warn("be ready to execute the cancel process ")
                    This.sendCancel(stream)
                }else{
                    log.info("user clicks the bottom share bar to stop sharing")
                    stopScreen()
                }
            }else{
                if(This.RTCSession.openSharing === false){
                    log.info("reply cancelRequest")
                    //发送cancel 此场景暂时没有；如果有，则根据前端的传下来的参数关闭流即可
                }else{
                    log.info("user clicks the bottom share bar to stop sharing")
                    stopScreen()
                }
            }
        }
    }else{
        log.info("开启演示为: "+This.RTCSession.sharingPermission + " ,user clicks the bottom share bar to stop sharing")
        stopScreen()
    }
}






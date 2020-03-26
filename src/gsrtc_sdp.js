
/**
 * Get the codec name corresponding to the highest priority PT in the sdp
 * @param sdp: parseSDP
 * @returns {*}
 */
GsRTC.prototype.getPriorityCodecBySdp = function(sdp){
    let codec = null
   try {
       if(sdp.media && sdp.media[0] && sdp.media[0].rtp){
           let rtp = sdp.media[0].rtp
           if(rtp && rtp.length > 0){
               codec = rtp[0].codec
           }
       }
   }catch (e) {
       log.error(e.toString())
   }
    log.info('get priority payload, ' + codec)
    return codec
}

/**
 * get framerate
 * order: framerate first, max-fr second
 * @param sdp: parseSDP
 * @returns {*}
 */
GsRTC.prototype.getFramerateBySdp = function (sdp) {
    let framerate = null
    if(sdp.media && sdp.media[0]){
        if(sdp.media[0].framerate){
            framerate = sdp.media[0].framerate
            log.info('framerate, ' + framerate)
        }else if(sdp.media[0].fmtp && sdp.media[0].fmtp.length > 0){
            let fmtp = sdp.media[0].fmtp
            for(let i = 0; i<fmtp.length; i++){
                let pos_max_fr = fmtp[i].config.indexOf('max-fr')
                if (pos_max_fr >= 0) {
                    var max_fr = fmtp[i].config.substring(pos_max_fr + 7);
                    var end = max_fr.indexOf(';');
                    if (end >= 0) {
                        max_fr = max_fr.substring(0, end);
                    }
                    log.info('max-fr, ' + max_fr)
                    framerate =  parseInt(max_fr);
                }
            }
        }
    }
    log.info('get framerate, ' + framerate)
    return framerate
}

/**
 * get resolution from profile-level-id
 * @param sdp: parseSDP
 */
GsRTC.prototype.getH264ResolutionBySdp = function(sdp){
    if(!sdp){
        log.warn('getH264ResolutionBySdp: Invalid argument!')
        return
    }

    let subSDP = SDPTools.writeSDP(sdp)
    let index = subSDP.indexOf('profile-level-id')
    let resolution = {}
    if(index >= 0){
        let levelIdc = subSDP.substr(index + 21, 2)
        levelIdc = levelIdc.toLocaleLowerCase()
        switch (levelIdc) {
            case '15':
                resolution = { width: 480, height: 272 }
                break;
            case '16':
                resolution = { width: 640, height: 360 }
                break;
            case '1e':
                resolution = { width: 848, height: 480 }
                break;
            case '1f':
                resolution = { width: 1280, height: 720 }
                break;
            case '28':
                resolution = { width: 1920, height: 1080 }
                break;
            case '33':
                resolution = { width: 3840, height: 2160 }
                break
            default:
                resolution = { width: 640, height: 360 }
                log.info('return default value 640 * 360')
                log.info("getH264ResolutionBySdp: The value is out of the range, " + levelIdc);
                break;
        }
    }

    if(resolution && resolution.width && resolution.height){
        log.info('get resolution ' + resolution.width + ' * ' + resolution.height)
    }else {
        log.info('get resolution {}')
    }
    return resolution
}

/**
 * get vp8 resolution from max-fs
 * @param sdp: parseSDP
 */
GsRTC.prototype.getVp8ResolutionBySdp = function(sdp){
    if(!sdp){
        log.warn('getVp8ResolutionBySdp: Invalid argument!')
        return
    }

    let subSDP = SDPTools.writeSDP(sdp)
    let index = subSDP.indexOf('max-fs')
    let resolution  = {}
    if(index >= 0){
        let maxFs = subSDP.substring(index + 7)
        maxFs = parseInt(maxFs.substring(0,maxFs.indexOf(';')))
        log.info('VP8, ' + maxFs)
        switch (maxFs) {
            case 520:
                resolution = { width: 480, height: 272 }
                break;
            case  920:
            case  900:
                resolution = { width: 640, height: 360 }
                break;
            case 1596:
                resolution = { width: 848, height: 480 }
                break;
            case 3600:
                resolution = { width: 1280, height: 720 }
                break;
            case 8192:
            case 8160:
            case 8100:
                resolution = { width: 1920, height: 1080 }
                break;
            case 32400:
                resolution = { width: 3840, height: 2160 }
                break
            default:
                resolution = { width: 640, height: 360 }
                log.info('return default value 640 * 360')
                log.info("get_vp8_resolution: The value is out of the range or invalid, " + maxFs);
                break;
        }
    }

    if(resolution && resolution.width && resolution.height){
        log.info('get resolution ' + resolution.width + ' * ' + resolution.height)
    }else {
        log.info('get resolution {}')
    }
    return resolution
}

/**
 * get resolution
 * @param sdp : parseSDP
 */
GsRTC.prototype.getResolutionBySdp = function (sdp) {
    log.info('get resolution')
    if(!sdp){
        log.warn('getResolutionBySdp: Invalid argument!')
        return
    }
    let codec = this.getPriorityCodecBySdp(sdp)
    let resolution = {}

    if(codec === 'H264'){
        resolution = this.getH264ResolutionBySdp(sdp)
    }
    if(codec === 'VP8'){
        resolution = this.getVp8ResolutionBySdp(sdp)
    }

    if(resolution && resolution.width && resolution.height){
        log.info('resolution ' + resolution.width + " * " + resolution.height)
    }else {
        log.info('resolution {}')
    }

    return resolution
}

/**
 * set frameRate of sdp
 * order: framerate first ,max-fr second
 * @param sdp: parseSDP
 * @param framerate
 */
GsRTC.prototype.setFrameRateOfSdp = function(sdp, framerate){
    if(!sdp || !framerate){
        log.warn('setFrameRate: Invalid argument!')
        return
    }

    if(sdp.media && sdp.media[0]){
        if(sdp.media[0].framerate){
            log.info('change framerate ' + sdp.media[0].framerate + ' to ' + framerate)
            sdp.media[0].framerate = framerate
        }else if(sdp.media[0].fmtp && sdp.media[0].fmtp.length > 0){
            let fmtp = sdp.media[0].fmtp
            for(let i = 0; i<fmtp.length; i++){
                let index = fmtp[i].config.indexOf('max-fr')
                if (index >= 0) {
                    let replacement =  'max-fr=' + framerate ;
                    fmtp[i].config = fmtp[i].config.replace(/max-fr=([a-zA-Z0-9]{1,2})/, replacement);
                    log.info('change max-fr to ' + framerate)
                }
            }
        }
    }

    return sdp
}

/**
 * Modify level-idc of sdp
 * @param sdp: parseSDP
 * @param width
 * @param height
 * @returns {*}
 */
GsRTC.prototype.setH264ResolutionOfSdp = function(sdp, width, height){
    if(!sdp || !width || !height){
        log.warn('setH264ResolutionOfSdp: Invalid argument!')
        return
    }
    let levelIdc = null
    switch (height) {
        case 2160:
            levelIdc = '33'
            break
        case 1080:
            levelIdc = '28'
            break
        case 720:
            levelIdc = '1f'
            break
        case 480:
            levelIdc = '1e'
            break
        case 360:
            levelIdc = '16'
            break
        case 272:
            levelIdc = '15'
            break
        default:
            levelIdc = 16
            log.info('set default levelIdc, ' + levelIdc)
            break
    }

    log.info('set levelId of local sdp ' + levelIdc)

    if(sdp.media && sdp.media[0] && sdp.media[0].fmtp){
        let fmtp = sdp.media[0].fmtp
        if(fmtp.length > 0){
            for(let i = 0; i < fmtp.length; i++){
                let index  = fmtp[i].config.indexOf('profile-level-id')
                if(index >= 0){
                    let str = fmtp[i].config.substr(index, 21);
                    let replacement =  str + levelIdc ;
                    fmtp[i].config = fmtp[i].config.replace(/profile-level-id=([a-zA-Z0-9]{6})/, replacement);
                }
            }
        }
    }else {
        log.info('profile-level-id fmtp filed has not been find')
    }

    return sdp
}

/**
 * Modify max-fs of sdp
 * @param sdp: parseSDP
 * @param width
 * @param height
 * @returns {*}
 */
GsRTC.prototype.setVp8ResolutionOfSdp = function(sdp, width, height){
    if(!sdp || !width || !height){
        log.warn('setVp8ResolutionOfSdp: Invalid argument!')
        return
    }
    let mbWidth = (parseInt(width, 10) + 15) / 16;
    let mbHeight = (parseInt(height, 10) + 15) / 16;
    let maxFs = Math.floor(mbWidth) * Math.floor(mbHeight);
    log.info('set mas-fs ,' + maxFs)

    if(sdp.media && sdp.media[0] && sdp.media[0].fmtp) {
        let fmtp = sdp.media[0].fmtp
        for (let i = 0; i < fmtp.length; i++) {
            let index = fmtp[i].config.indexOf('max-fs')
            if (index >= 0) {
                let replacement = 'max-fs=' + maxFs;
                fmtp[i].config = fmtp[i].config.replace(/max-fs=([a-zA-Z0-9]{3,5})/, replacement);
            }
        }
    }else {
        log.warn('max-fs fmtp filed has not been find')
    }

    return sdp
}

/**
 * modified mid of sdp
 * @param sdp
 * @param mid
 * @returns {*}
 */
GsRTC.prototype.modifiedMidOfSdp = function(sdp, mid){
    log.info('modified mid of sdp')
    if(sdp.media && sdp.media[0]){
        sdp.media[0].mid = mid
    }

    return sdp
}

/**
 * save original and modified mid before send invites
 * @param sdp
 * @param type
 */
GsRTC.prototype.saveMidBeforeSendInvite = function(sdp, type){
    log.info('save mid')
    let This = this
    let mid
    let parseSDP = SDPTools.parseSDP(sdp)
    if(parseSDP.media && parseSDP.media[0] && parseSDP.media[0]){
        mid = parseSDP.media[0].mid
    }

    switch (type) {
        case 'audio':
            This.MID_OBJ.AUDIO_MID.ORIGINAL_MID = mid
            This.MID_OBJ.AUDIO_MID.MODIFIED_MID = 0
            break
        case 'main':
            This.MID_OBJ.MAIN_MID.ORIGINAL_MID = mid
            This.MID_OBJ.MAIN_MID.MODIFIED_MID = 1
            break
        case 'slides':
            This.MID_OBJ.SLIDES_MID.ORIGINAL_MID = mid
            This.MID_OBJ.SLIDES_MID.MODIFIED_MID = 2
            break
        default:
            break
    }
}

/**
 * get modified mid before set remote
 * @param type
 * @returns {*}
 */
GsRTC.prototype.getModifiedMid = function(type){
    let This = this
    let mid;
    if(type === "audio"){
        mid = This.MID_OBJ.AUDIO_MID.MODIFIED_MID ? This.MID_OBJ.AUDIO_MID.MODIFIED_MID : 0;
    }else if(type === "main"){
        mid = This.MID_OBJ.MAIN_MID.MODIFIED_MID ? This.MID_OBJ.MAIN_MID.MODIFIED_MID : 1;
    }else if(type === "slides"){
        mid = This.MID_OBJ.SLIDES_MID.MODIFIED_MID ? This.MID_OBJ.SLIDES_MID.MODIFIED_MID : 2;
    }
    log.info('get ' + type + ' mid of ' + mid)
    return mid;
}

/**
 * change resolution of sdp
 * @param width
 * @param height
 * @param sdp: parseSDP
 * @returns {*}
 */
GsRTC.prototype.setResolutionOfSdp = function (sdp, width, height) {
    if (!sdp || !width || !height) {
        log.error("Invalid argument");
        return null;
    }

    try {
        sdp = this.setH264ResolutionOfSdp(sdp, width, height)
        sdp = this.setVp8ResolutionOfSdp(sdp, width, height)
    }catch (e) {
        log.error(e)
    }
    return sdp
}

/**
 * Processing sdp when multistream
 * @param subSDP
 * @returns {string}
 */
GsRTC.prototype.decorateMultiStreamSdp  = function(subSDP) {
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
            lines.splice(i+1, 0, "a=content:main");
            i++
        }
        if(lines[i].indexOf('a=mid:2') >= 0){
            lines.splice(i+1, 0, "a=content:slides");
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

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
 *  Use the standard b=AS:BITRATE (Chrome) or b=TIAS:BITRATE (Firefox) attributes in the SDP for the audio or video channel
 * @param sdp
 * @param media
 * @param ASBitrate
 * @returns {*}
 */
GsRTC.prototype.setMaxBitrate = function(sdp, media, ASBitrate) {
    ASBitrate = ASBitrate ? ASBitrate : localStorage.getItem('maxBitRate') ? localStorage.getItem('maxBitRate') : ''
    if(!ASBitrate){
        log.warn('No bitrate has been set')
        return sdp
    }

    // find m line place
    var line = sdp.indexOf('m=' + media)
    if(line === -1){
        log.warn('Could not find the m line for ' + media)
        return sdp
    }
    log.info('Find the m line for ' + media + ' at line ' + line)

    // add a new b line
    function addNewLine(_sdp, type, bitrate) {
        var lines = _sdp.split("\n")
        var mline = -1

        // find m line place
        for(var i = 0; i<lines.length; i++){
            if(lines[i].indexOf('m=' + media) >= 0){
                mline = i
                break
            }
        }

        // pass the m line
        mline++

        // Ship i and c lines
        while (lines[mline].indexOf('i=') >= 0 || lines[mline].indexOf('c=') >= 0){
            log.info(' Ship i and c lines')
            mline++
        }

        // add a new b=AS or b=TIAS line
        // log.warn('Adding new b line before line ' + mline)
        var newLines = lines.slice(0, mline)
        newLines.push('b=' + type + ':' + bitrate)
        newLines = newLines.concat(lines.slice(mline, lines.length))

        return newLines.join('\n')
    }

    var replacement
    if(sdp.indexOf('b=AS') >= 0){
        log.warn('Replaced b=AS line at line '+ line)
        replacement = "b=AS:" + ASBitrate
        sdp = sdp.replace(/b=AS:([a-zA-Z0-9]{3,4})/, replacement);
    }else {
        sdp = addNewLine(sdp, 'AS', ASBitrate)
    }

    var TIASBitrate = ASBitrate * 1000
    if(sdp.indexOf('b=TIAS') >= 0){
        log.warn('Replaced b=TIAS line at line '+ line)
        replacement = "b=TIAS:" + TIASBitrate
        sdp = sdp.replace(/b=TIAS:([a-zA-Z0-9]{6,7})/, replacement);

    }else {
        sdp = addNewLine(sdp, 'TIAS', TIASBitrate)
    }

    return sdp
}

/**
 * set x-google-xxx-bitrate
 * @param sdp
 * @param bitrate
 * @returns {string}
 */
GsRTC.prototype.setXgoogleBitrate = function(sdp, bitrate) {
    var lines = sdp.split("\n")
    var replacement

    // get all pt number, except rtx\red\ulpfec
    var ptArr = []
    var validLine = RegExp.prototype.test.bind(/^([a-z])=(.*)/);
    sdp.split(/(\r\n|\r|\n)/).filter(validLine).forEach(function(line) {
        if(line.indexOf('a=rtpmap') >= 0 && line.indexOf('rtx') < 0 && line.indexOf('red') < 0 && line.indexOf('ulpfec') < 0){
            var pt =line.split(" ")[0].split(":")[1]
            ptArr.push(pt)
        }
    });


    // add new a=fmtp line if rtpmap is not have a=fmtp line
    for(var j = 0; j<ptArr.length; j++){
        if(sdp.indexOf('a=fmtp:' + ptArr[j]) < 0){
            for(var k = 0; k<lines.length; k++){
                if(lines[k].indexOf('a=rtpmap:' + ptArr[j]) >= 0){
                    // Skip a=rtpmap lines for encoding
                    k++
                    var newLines = lines.slice(0, k)
                    newLines.push('a=fmtp:' + ptArr[j])
                    lines = newLines.concat(lines.slice(k, lines.length))
                }
            }
        }
    }


    // 考虑：a=fmtp:100 这种形式，添加时首个不要分号，要空格
    // 有的PT没有x-google-min-bitrate=1024;x-google-start-bitrate=1536;x-google-max-bitrate=2048字段： 有则修改，没有则添加
    for(var i = 0; i<lines.length; i++){
        if(lines[i].indexOf('a=fmtp:') >= 0){
            // filter rtx and ulpfec
            if(lines[i].indexOf('apt=') >= 0 || lines[i].indexOf('ulpfec') >= 0){
                continue
            }

            // filter a=fmtp:100 format
            lines[i] = lines[i].trim()
            if(lines[i].split(' ').length === 1){
                replacement = " x-google-min-bitrate=" + bitrate + ";x-google-start-bitrate=" + bitrate + ";x-google-max-bitrate=" + bitrate
                lines[i] = lines[i] + replacement
            }else {
                if(lines[i].indexOf('x-google-min-bitrate') >= 0){
                    replacement = "x-google-min-bitrate=" + bitrate
                    lines[i] = lines[i].replace(/x-google-min-bitrate=([a-zA-Z0-9]{1,8})/, replacement);
                }else {
                    replacement = ";x-google-min-bitrate=" + bitrate
                    lines[i] = lines[i] + replacement
                }

                if(lines[i].indexOf('x-google-start-bitrate') >= 0){
                    replacement = "x-google-start-bitrate=" + bitrate
                    lines[i] = lines[i].replace(/x-google-start-bitrate=([a-zA-Z0-9]{1,8})/, replacement);
                }else {
                    replacement = ";x-google-start-bitrate=" + bitrate
                    lines[i] = lines[i] + replacement
                }

                if(lines[i].indexOf('x-google-max-bitrate') >= 0){
                    replacement = "x-google-max-bitrate=" + bitrate
                    lines[i] = lines[i].replace(/x-google-max-bitrate=([a-zA-Z0-9]{1,8})/, replacement);
                }else {
                    replacement = ";x-google-max-bitrate=" + bitrate
                    lines[i] = lines[i] + replacement
                }
            }
        }
    }

    return lines.join('\n')
}

/**
 * remove REMB Negotiation
 * @param sdp
 * @returns {string}
 */
GsRTC.prototype.removeREMBField = function(sdp){
    var lines = sdp.split("\n")

    for(var i = 0; i<lines.length; i++){
        if (lines[i].indexOf('goog-remb') >= 0 || lines[i].indexOf('transport-cc') >= 0) {
            log.info('remove goog-remb or transport-cc filed')
            lines.splice(i, 1)
            i--
        }
    }
    return lines.join('\n')
}

/**
 * 删除level-asymmetry-allowed
 * @param sdp
 * @returns {string}
 */
GsRTC.prototype.removeLevel = function(sdp){
    var lines = sdp.split("\n")
    for(var i = 0; i<lines.length; i++){
        if (lines[i].indexOf('level-asymmetry-allowed') >= 0 ) {
            log.info('remove level-asymmetry-allowed')
            lines.splice(i, 1)
            i--
        }
    }
    return lines.join('\n')
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
 * get type by transceiver mid
 * @param mid
 */
GsRTC.prototype.getTypeByMid = function(mid){
    let type
    mid = parseInt(mid)
    switch (mid) {
        case 0:
            type = 'audio'
            break
        case 1:
            type = 'main'
            break
        case 2:
            type = 'slides'
            break
        case 3:
            type = 'gui '
            break
        default:
            break
    }
    log.info('get type by transceiver mid ' + type)

    return type
}

/**
 * 调整m行顺序，使用getCaptureStream创建多个m行时，audio会在最后面
 * 根据m行数量，修改 a=group:BUNDLE 和a=msid-semantic:
 * @param sdp
 * @returns {*}
 */
GsRTC.prototype.adjustOrderOfMLines = function (sdp) {
    log.info('Adjust the order of m lines')
    let This = this
    let parseSDP = SDPTools.parseSDP(sdp)
    let audioArray
    let videoArray = []
    let videoMid = 1
    parseSDP.msidSemantics = []
    parseSDP.groups = [{type: "BUNDLE", mids: 0}]

    for(let i=0; i< parseSDP.media.length; i++){
        if(parseSDP.media[i].type === 'audio'){
            parseSDP.media[i].mid = 0
            audioArray = parseSDP.media[i]
        }else {
            parseSDP.media[i].mid = videoMid
            parseSDP.media[i].content = This.getTypeByMid(parseSDP.media[i].mid)
            parseSDP.groups.push({type: "BUNDLE", mids: parseSDP.media[i].mid})
            videoArray.push(parseSDP.media[i])
            videoMid ++
        }
        parseSDP.msidSemantics.push( {semantic: "", token: "WMS"})
    }
    parseSDP.media = [audioArray]
    parseSDP.media = parseSDP.media.concat(videoArray)
    sdp = SDPTools.writeSDP(parseSDP)

    return sdp
}

/**
 * 删除ssrc字段
 * @param sdp
 * @returns {*}
 */
GsRTC.prototype.removeSSRC = function (sdp) {
    log.info('remove ssrc')
    let This = this
    let parseSDP = SDPTools.parseSDP(sdp)
    let stream
    for(let i=0; i< parseSDP.media.length; i++){
        let type = This.getTypeByMid(parseSDP.media[i].mid)
        stream = This.RTCSession.getStream(type, true)
        if(!stream){
            log.info('deleted stream info')
            delete parseSDP.media[i].ssrcGroups
            delete parseSDP.media[i].ssrcs
        }
    }
    sdp = SDPTools.writeSDP(parseSDP)

    return sdp
}

/**
 * 根据编解码名称删除编解码
 * @param sdp
 * @returns {*}
 */
GsRTC.prototype.removeCodeByName = function (sdp) {
    log.info('remove ssrc')
    let lines = sdp.split('\n')
    let removePayloads = [0, 8, 106, 105, 13, 110, 112, 113, 98, 99, 127, 121, 125, 107, 108, 109, 124, 120, 123 ,119, 114, 115 ,116]

    function getMLinePosition(lines){
        // 获取所有m行的位置
        let arr = []
        for(let index in lines){
            if(lines[index].indexOf('m=') >= 0){
                arr.push(parseInt(index))
            }
        }
        arr.push(lines.length)
        return arr
    }

    function getPtNumber(arr){
        arr = arr.split('\n')
        let deleteCodeArray = []
        for(let j in arr){
            if(arr[j].indexOf('a=rtpmap') >=0 && (arr[j].indexOf(deleteCodeName[0]) >=0 || arr[j].indexOf(deleteCodeName[1]) >=0 )){
                let pt = arr[j].substr(9, 3);
                deleteCodeArray.push(pt)
            }
        }
        return deleteCodeArray
    }

    function codecRemove(sdpLine){
        let deletePt = getPtNumber(sdpLine)
        let parseSDP = SDPTools.parseSDP(sdpLine)
        deletePt = deletePt.concat(removePayloads)
        SDPTools.removeCodecByPayload(parseSDP, 0, deletePt)
        sdpLine = SDPTools.writeSDP(parseSDP)
        return sdpLine
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

    let positions = getMLinePosition(lines)
    let deleteCodeName = ['VP8', 'VP9']
    // 根据m行位置分割sdp数组
    let sdpArray = []
    let nextIndex = 0
    let head = lines.slice(0, positions[0])
    for(let i = 0;i<positions.length; i++){
        nextIndex = i +1
        if(positions[nextIndex]){
            let arr = lines.slice(positions[i], positions[nextIndex])
            arr = head.concat(arr).join('\n')
            arr = codecRemove(arr)
            sdpArray.push(arr)
        }
    }

    let result = head.join('\n') + '\n'
    for(let item of sdpArray){
        item = deleteHead(item)
        result = result + item
    }
    return result
}
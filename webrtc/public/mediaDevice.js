/**
 * AMD, CommonJS, Global compatible Script Wrapper
 * https://github.com/umdjs/umd
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
        /* istanbul ignore next */
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.MediaDevice = factory();
    }
}(this, function () {


    function MediaDevice() {
        this.deviceCheckTimer = null
    }

    /***
     * 获取分辨率扫描列表
     */
    MediaDevice.prototype.getQuickScanList = function () {
        return [
            {
                "label": "4K(UHD)",
                "width": 3840,
                "height": 2160,
                "ratio": "16:9",
                "frameRate": 30
            },
            {
                "label": "4K(UHD)",
                "width": 3840,
                "height": 2160,
                "ratio": "16:9",
                "frameRate": 15
            },
            {
                "label": "1080p(FHD)",
                "width": 1920,
                "height": 1080,
                "ratio": "16:9",
                "frameRate": 30
            },
            {
                "label": "1080p(FHD)",
                "width": 1920,
                "height": 1080,
                "ratio": "16:9",
                "frameRate": 15
            },
            {
                "label": "UXGA",
                "width": 1600,
                "height": 1200,
                "ratio": "4:3",
                "frameRate": 30
            },
            {
                "label": "UXGA",
                "width": 1600,
                "height": 1200,
                "ratio": "4:3",
                "frameRate": 15
            },
            {
                "label": "720p(HD)",
                "width": 1280,
                "height": 720,
                "ratio": "16:9",
                "frameRate": 30
            },
            {
                "label": "720p(HD)",
                "width": 1280,
                "height": 720,
                "ratio": "16:9",
                "frameRate": 15
            },
            {
                "label": "SVGA",
                "width": 800,
                "height": 600,
                "ratio": "4:3",
                "frameRate": 30
            },
            {
                "label": "SVGA",
                "width": 800,
                "height": 600,
                "ratio": "4:3",
                "frameRate": 15
            },
            {
                "label": "VGA",
                "width": 640,
                "height": 480,
                "ratio": "4:3",
                "frameRate": 30
            },
            {
                "label": "VGA",
                "width": 640,
                "height": 480,
                "ratio": "4:3",
                "frameRate": 15
            },
            {
                "label": "360p(nHD)",
                "width": 640,
                "height": 360,
                "ratio": "16:9",
                "frameRate": 30
            },
            {
                "label": "360p(nHD)",
                "width": 640,
                "height": 360,
                "ratio": "16:9",
                "frameRate": 15
            },
            {
                "label": "CIF",
                "width": 352,
                "height": 288,
                "ratio": "4:3",
                "frameRate": 30
            },
            {
                "label": "CIF",
                "width": 352,
                "height": 288,
                "ratio": "4:3",
                "frameRate": 15
            },
            {
                "label": "QVGA",
                "width": 320,
                "height": 240,
                "ratio": "4:3",
                "frameRate": 30
            },
            {
                "label": "QVGA",
                "width": 320,
                "height": 240,
                "ratio": "4:3",
                "frameRate": 15
            },
            {
                "label": "180p?",
                "width": 320,
                "height": 180,
                "ratio": "16:9",
                "frameRate": 30
            },
            {
                "label": "180p?",
                "width": 320,
                "height": 180,
                "ratio": "16:9",
                "frameRate": 15
            },
            {
                "label": "QCIF",
                "width": 176,
                "height": 144,
                "ratio": "4:3",
                "frameRate": 30
            },
            {
                "label": "QCIF",
                "width": 176,
                "height": 144,
                "ratio": "4:3",
                "frameRate": 15
            },
            {
                "label": "QQVGA",
                "width": 160,
                "height": 120,
                "ratio": "4:3",
                "frameRate": 30
            },
            {
                "label": "QQVGA",
                "width": 160,
                "height": 120,
                "ratio": "4:3",
                "frameRate": 15
            }
        ];
    }

    /***
     * 获取音视频设备并进行分类
     * @param deviceInfoCallback
     * @param error
     */
    MediaDevice.prototype.enumDevices = function (deviceInfoCallback, error) {
        if (navigator.mediaDevices === undefined || navigator.mediaDevices.enumerateDevices === undefined) {
            if (error) {
                error("browser don't support enumerate devices")
            }
            return
        }
        navigator.mediaDevices.enumerateDevices().then(function (deviceInfos) {
            var microphone = []
            var speaker = []
            var camera = []
            var screenResolution = []
            var isConstraintsKeywordSupport = true
            for (var i = 0; i < deviceInfos.length; i++) {
                var deviceInfo = deviceInfos[i]
                if(deviceInfo.deviceId === 'default' || deviceInfo.deviceId === 'communications'){
                    continue
                }
                if (deviceInfo.kind === 'audioinput') {
                    microphone.push({
                        label: deviceInfo.label,
                        deviceId: deviceInfo.deviceId,
                        groupId: deviceInfo.groupId,
                        status: 'available',
                    })
                }
                if (deviceInfo.kind === 'audiooutput') {
                    speaker.push({
                        label: deviceInfo.label,
                        deviceId: deviceInfo.deviceId,
                        groupId: deviceInfo.groupId,
                        status: 'available',
                    })
                }
                if (deviceInfo.kind === 'videoinput') {
                    camera.push({
                        label: deviceInfo.label,
                        deviceId: deviceInfo.deviceId,
                        groupId: deviceInfo.groupId,
                        status: 'available',
                        capability: []
                    })
                }
            }

            screenResolution.push({
                width: window.screen.width,
                height: window.screen.height,
            })

            if (deviceInfoCallback) {
                deviceInfoCallback({
                    microphones: microphone,
                    speakers: speaker,
                    cameras: camera,
                    screenResolution: screenResolution,
                    isConstraintsKeywordSupport: isConstraintsKeywordSupport
                })
            } else {
                return {
                    microphones: microphone,
                    speakers: speaker,
                    cameras: camera,
                    screenResolution: screenResolution,
                    isConstraintsKeywordSupport: isConstraintsKeywordSupport
                }
            }
        }).catch(function (err) {
            if (error) {
                error(err)
            }
        })
    }

    /***
     * 更新localStorage存储
     * @param deviceInfos 所有的媒体数据
     * @param type ： cameras / microphones / speakers， 更新的类型
     */
    MediaDevice.prototype.updateDeviceInfo = function (deviceInfos, type) {
        var localStorageDeviceInfo = JSON.parse(localStorage.getItem('mediaDevice'))
        var deviceInfoList = []
        var storageInfoList = []

        switch (type) {
            case 'cameras':
                deviceInfoList = deviceInfos.cameras
                storageInfoList = localStorageDeviceInfo ? localStorageDeviceInfo.cameras ? localStorageDeviceInfo.cameras : [] : []
                break
            case 'microphones':
                deviceInfoList = deviceInfos.microphones
                storageInfoList = localStorageDeviceInfo ? localStorageDeviceInfo.microphones ? localStorageDeviceInfo.microphones : [] : []
                break
            case 'speakers':
                deviceInfoList = deviceInfos.speakers
                storageInfoList = localStorageDeviceInfo ? localStorageDeviceInfo.speakers ? localStorageDeviceInfo.speakers : [] : []
                break
            default:
                break
        }

        /***
         * 判断localStorage中的设备是否有还存在，不存在则设置状态为 unavailable，还存在的置为available
         * @param deviceInfoList
         * @param storageInfoList
         */
        function setDeviceStatus(deviceInfoList, storageInfoList) {
            for (var i = 0; i < storageInfoList.length; i++) {
                for (var j = 0; j < deviceInfoList.length; j++) {
                    if (storageInfoList[i].label === deviceInfoList[j].label) {
                        if (storageInfoList[i].status === 'unavailable') {
                            log.log('set device unavailable to available!')
                            storageInfoList[i].status = 'available'
                        }
                        storageInfoList[i].deviceId = deviceInfoList[j].deviceId
                        storageInfoList[i].groupId = deviceInfoList[j].groupId
                        break
                    }
                    if (storageInfoList[i].label !== deviceInfoList[j].label && j === deviceInfoList.length - 1 && storageInfoList[i].status !== 'unavailable') {
                        log.warn(storageInfoList[i].label + "   device is unavailable")
                        storageInfoList[i].status = 'unavailable'
                    }
                }
            }
        }

        /***
         * 判断设备是否是新设备，是的话，添加到localStorage中
         * @param deviceInfoList
         * @param storageInfoList
         */
        function addInsertDevice(deviceInfoList, storageInfoList) {
            for (var i = 0; i < deviceInfoList.length; i++) {
                for (var j = 0; j < storageInfoList.length; j++) {
                    if (deviceInfoList[i].label === storageInfoList[j].label) {
                        storageInfoList[j].deviceId = deviceInfoList[i].deviceId
                        storageInfoList[j].groupId = deviceInfoList[i].groupId
                        break
                    }
                    if (deviceInfoList[i].label !== storageInfoList[j].label && j === storageInfoList.length - 1) {
                        log.warn("new device has been insert!")
                        storageInfoList.push(deviceInfoList[i])
                    }
                }
            }
        }

        // 本地存储没有任何值，直接设置获取的设备列表到localStorage中
        if (deviceInfoList.length && !storageInfoList.length) {
            log.warn("set new device info list")
            localStorage.setItem('mediaDevice', JSON.stringify(deviceInfos, null, '    '))
            return
        }

        // 未获取当任何有效的设备列表，localStorage保存的设备全部设置为不可用
        if (!deviceInfoList.length && storageInfoList.length) {
            log.warn('set all device to unavailable');
            for (var i = 0; i < storageInfoList.length; i++) {
                storageInfoList[i].status = 'unavailable'
            }
            localStorage.setItem('mediaDevice', JSON.stringify(localStorageDeviceInfo, null, '    '))
            return
        }

        // 获取到设备列表，且localStorage中有设备存储信息
        setDeviceStatus(deviceInfoList, storageInfoList)
        addInsertDevice(deviceInfoList, storageInfoList)
        log.log('update modified device info into localStorage!')
        localStorage.setItem('mediaDevice', JSON.stringify(localStorageDeviceInfo, null, '    '))
    }

    /***
     * 清除流
     * @param stream
     */
    MediaDevice.prototype.closeStream = function (stream) {
        try {
            var tracks = stream.getTracks();
            for (var track in tracks) {
                tracks[track].onended = null;
                log.log("close stream");
                tracks[track].stop();
            }
        } catch (e) {
            log.error(e)
        }
    }

    /***
     * 判断取流是否支持关键字：min/max/exact/ideal
     * 常见：测试一体机不支持关键字
     * @returns {Promise<boolean>}
     */
    MediaDevice.prototype.isConstraintsKeywordSupport = async function () {
        var This = this
        var result = true
        var mediaDevice = JSON.parse(localStorage.getItem('mediaDevice'))
        var isKeywordSupport = mediaDevice ? mediaDevice.isConstraintsKeywordSupport : null

        if (isKeywordSupport !== null) {
            result = isKeywordSupport
        } else {
            var constraints = {
                audio: false,
                video: {
                    width: {ideal: 640},
                    height: {ideal: 360}
                }
            }

            function onGetUserMediaSuccess(stream){
                log.log('constraints keyWords support')
                result = true
                This.closeStream(stream)
            }

            function onGetUserMediaFailed(error){
                console.error(error)
                log.log('ideal is not support' + error.message)
                result = false
            }

            log.log("isConstraintsKeywordSupport test constraints: \n" + JSON.stringify(constraints, null, '    '));
            try {
                var stream = await navigator.mediaDevices.getUserMedia(constraints)
                onGetUserMediaSuccess(stream)
            }catch(error){
                onGetUserMediaFailed(error)
            }
        }

        log.info('is constraints Keyword support: ', result)
        return result
    }

    /***
     * 使用exact关键字取流
     * @returns {Promise<void>}
     */
    MediaDevice.prototype.getStreamWithExactConstraints = async function () {
        var This = this
        var mediaDevice = JSON.parse(localStorage.getItem('mediaDevice'))
        var quickScanList = This.getQuickScanList()
        var localStream
        var constraints

        function onGetUserMediaSuccess(stream) {
            // log.info('applyConstraints success' + JSON.stringify(constraints, null, '    '))
            log.info("get Stream Success : " + quickScanList[i].width + " x " + quickScanList[i].height + 'px, ' + 'frameRate: ' + quickScanList[i].frameRate);
            if(stream){
                localStream = stream
            }

            capability.push({
                width: quickScanList[i].width,
                height: quickScanList[i].height,
                frameRate: quickScanList[i].frameRate,
                aspectRatio: quickScanList[i].ratio
            })

            if (j === mediaDevice.cameras.length - 1 && i === quickScanList.length - 1) {
                log.log("Resolution scan completed, clear stream.")
                This.closeStream(localStream)
            }
        }

        function onGetUserMediaFailed(error) {
            if (error.name === 'ConstraintNotSatisfiedError') {
                log.info('The resolution ' + quickScanList[i].width + 'x' +
                  quickScanList[i].height + ' px and frameRate with ' +  quickScanList[i].frameRate + ' is not supported by your device.');
            } else if (error.name === 'PermissionDeniedError') {
                log.info('Permissions have not been granted to use your camera and ' +
                  'microphone, you need to allow the page access to your devices in ' +
                  'order for the demo to work.');
            }
            // log.error('getUserMedia error: ' + error.name, error);
            log.info("fail: mismatch : " + quickScanList[i].width + " x " + quickScanList[i].height + 'px, ' + 'frameRate: ' + quickScanList[i].frameRate);
        }

        for (var j = 0; j < mediaDevice.cameras.length; j++) {
            // 换摄像头时需要重新取流，避免使用applyConstraints时不换摄像头的场景
            if (localStream) {
                This.closeStream(localStream)
            }
            // 当前循环设备之前已经有分辨率扫描的记录，不重新扫描
            if (mediaDevice.cameras[j].capability && mediaDevice.cameras[j].capability.length > 0) {
                log.warn("this device has already get resolution before: " + mediaDevice.cameras[j].label)
                continue
            }

            log.warn("Current scan device：", mediaDevice.cameras[j].label)
            var deviceId = mediaDevice.cameras[j].deviceId
            var capability = mediaDevice.cameras[j].capability


            // 存在问题：不使用关键字时，applyConstraints和getUserMedia取流都存在不准确问题，比如1920*1080，摄像头不支持该分辨率也能取流成功，因为取的是别的分辨率
            for (var i = 0; i < quickScanList.length; i++) {
                var videoTrack = localStream ? localStream.getVideoTracks()[0] : null
                if (localStream && localStream.active === true && localStream.getVideoTracks().length > 0 && videoTrack.applyConstraints) {
                    constraints = {
                        frameRate: {exact: quickScanList[i].frameRate},
                        aspectRatio: {exact: quickScanList[i].width / quickScanList[i].height},
                        width: {exact: quickScanList[i].width},
                        height: {exact: quickScanList[i].height}
                    }
                    try {
                        await videoTrack.applyConstraints(constraints)
                        onGetUserMediaSuccess()
                    }catch (error) {
                        onGetUserMediaFailed(error)
                    }
                } else {
                    constraints = {
                        audio: false,
                        video: {
                            frameRate: {exact: quickScanList[i].frameRate},
                            aspectRatio: {exact: quickScanList[i].width / quickScanList[i].height},
                            width: {
                                max: quickScanList[i].width,
                                exact: quickScanList[i].width
                            },
                            height: {
                                max: quickScanList[i].height,
                                exact: quickScanList[i].height
                            },
                        }
                    }
                    if(deviceId){
                        constraints.video.deviceId = { exact: deviceId}
                    }

                    try {
                        let stream = await navigator.mediaDevices.getUserMedia(constraints)
                        onGetUserMediaSuccess(stream)
                    }catch (error) {
                        onGetUserMediaFailed(error)
                    }
                }
            }
        }
        localStorage.setItem('mediaDevice', JSON.stringify(mediaDevice, null, '    '))
    }

    // 创建video标签
    var cameraPrevVideo = document.createElement('video')
    cameraPrevVideo.onloadedmetadata = MediaDevice.prototype.displayVideoDimensions;
    /***
     * video 元数据加载完成后触发，用于判断取流后的分辨率与实际要求是否一致
     * @param scanListIndex 当前扫描的分辨率列表的索引值
     * @param cameraIndex 当前扫描的摄像头列表值
     */
    MediaDevice.prototype.displayVideoDimensions = function (scanListIndex, cameraIndex) {
        var This = this
        var i = scanListIndex
        var j = cameraIndex
        var mediaDevice = JSON.parse(localStorage.getItem('mediaDevice'))
        var capability = mediaDevice.cameras[j].capability
        var quickScanList = This.getQuickScanList()
        log.log("Video onloadedmetadata call~~~");

        function captureResults(data) {
            if (data.result === true) {
                log.log("pass")
                capability.push({
                    width: quickScanList[i].width,
                    height: quickScanList[i].height,
                    frameRate: quickScanList[i].frameRate,
                    aspectRatio: quickScanList[i].ratio
                })
                localStorage.setItem('mediaDevice', JSON.stringify(mediaDevice, null, '    '))
            } else {
                log.log("fail: mismatch")
            }

            i++
            if (i < quickScanList.length) {
                log.log('Scan the next resolution')
                window.isScanCameraChange = false
                This.getStreamWithoutConstraintsKeyWords(i, j)
            } else if (j < mediaDevice.cameras.length - 1) {
                log.log('Scan the next camera')
                window.isScanCameraChange = true
                This.closeStream(stream)
                j++;
                i = 0;
                This.getStreamWithoutConstraintsKeyWords(i, j)
            } else {
                This.closeStream(stream)
                log.log("All camera capabilities are End of scan ~~")
                cameraPrevVideo = null
            }
        }

        if (!cameraPrevVideo.videoWidth) {
            setTimeout(function () {
                This.displayVideoDimensions(scanListIndex, cameraIndex)
            }, 500);  //was 500
        }

        if (cameraPrevVideo.videoWidth * cameraPrevVideo.videoHeight > 0) {
            log.info("Display size for : " + quickScanList[scanListIndex].width + "x" + quickScanList[scanListIndex].height);
            log.info("Stream dimensions for :" + cameraPrevVideo.videoWidth + "x" + cameraPrevVideo.videoHeight);
            if (quickScanList[scanListIndex].width + "x" + quickScanList[scanListIndex].height !== cameraPrevVideo.videoWidth + "x" + cameraPrevVideo.videoHeight) {
                log.info("fail: mismatch")
                captureResults({result: false})
            } else {
                log.info("pass :" + quickScanList[scanListIndex].width + "x" + quickScanList[scanListIndex].height)
                captureResults({result: true})
            }
        }

    }

    /***
     * 兼容不支持min/max/ideal/exact的情况，使用{audio:false, video: { width: 1280, height: 720}} 格式取流
     * 通过取流后的video实际尺寸判断取流是否成功
     * @param scanListIndex 当前扫描的分辨率列表的索引值
     * @param cameraIndex 当前扫描的摄像头列表值
     * @returns {Promise<void>}
     */
    MediaDevice.prototype.getStreamWithoutConstraintsKeyWords = async function (scanListIndex, cameraIndex) {
        var This = this
        var quickScanList = This.getQuickScanList()
        var mediaDevice = JSON.parse(localStorage.getItem('mediaDevice'))
        var i = scanListIndex
        var j = cameraIndex
        var mediaStream = window.stream
        var deviceId = mediaDevice.cameras[j].deviceId
        var capability = mediaDevice.cameras[j].capability
        var constraints;

        // 当前循环设备之前已经有分辨率扫描的记录，不重新扫描
        if (window.isScanCameraChange === true && capability && capability.length > 0) {
            log.warn("this device has already get resolution before: " + mediaDevice.cameras[j].label)
            cameraIndex++
            if (cameraIndex < mediaDevice.cameras.length) {
                log.warn('Scan the next device')
                This.getStreamWithoutConstraintsKeyWords(scanListIndex, cameraIndex)
            }
            return
        }
        window.isScanCameraChange = false

        function onGetUserMediaSuccess(stream) {
            log.log('applyConstraints success' + JSON.stringify(constraints, null, '    '))
            log.log("Display size for " + quickScanList[i].label + ": " + quickScanList[i].width + "x" + quickScanList[i].height);

            if(stream){
                window.stream = stream
                cameraPrevVideo.srcObject = stream
            }

            setTimeout(function () {
                This.displayVideoDimensions(scanListIndex, cameraIndex)
            }, 2000);
        }

        function onGetUserMediaFailed(error){
            log.warn('applyConstraints error: ', error.name)
        }

        log.warn("Current scan device：", mediaDevice.cameras[j].label)
        var videoTrack = mediaStream ? mediaStream.getVideoTracks()[0] : null
        if (mediaStream && mediaStream.active === true && mediaStream.getVideoTracks().length > 0 && videoTrack.applyConstraints) {
            constraints = {
                frameRate: quickScanList[i].frameRate,
                width: quickScanList[i].width,
                height: quickScanList[i].height,
                aspectRatio: {exact: quickScanList[i].width / quickScanList[i].height},
            }

           try {
               await videoTrack.applyConstraints(constraints)
               onGetUserMediaSuccess()
           }catch (error) {
               onGetUserMediaFailed(error)
           }
        } else {
            constraints = {
                audio: false,
                video: {
                    deviceId: deviceId,
                    frameRate: quickScanList[i].frameRate,
                    width: quickScanList[i].width,
                    height: quickScanList[i].height,
                    aspectRatio: {exact: quickScanList[i].width / quickScanList[i].height},
                }
            }

           try {
               await navigator.mediaDevices.getUserMedia(constraints)
               onGetUserMediaSuccess(stream)
           }catch (error) {
               onGetUserMediaFailed(error)
           }
        }
    }

    /***
     * 设置设备所支持的取流能力：frameRate, width, height
     */
    MediaDevice.prototype.setDeviceCapability = async function () {
        log.warn('device capability scanning')
        var This = this
        var mediaDevice = JSON.parse(localStorage.getItem('mediaDevice'))
        // 判断取流是否支持关键字设置
        var isKeywordSupport = await This.isConstraintsKeywordSupport()
        mediaDevice.isConstraintsKeywordSupport = isKeywordSupport

        if (mediaDevice && mediaDevice.cameras.length > 0) {
            if (isKeywordSupport === true) {
                log.info("min/max/ideal/exact keyWord is support")
                await This.getStreamWithExactConstraints()
            } else {
                log.info("min/max/ideal/exact keyWord is  NOT support")
                window.isScanCameraChange = true
                await This.getStreamWithoutConstraintsKeyWords(0, 0)
            }
        } else {
            log.warn('no cameras need to resolution scan!')
        }
    }

    /***
     * 检查可用设备列表
     */
    MediaDevice.prototype.checkAvailableDev = function () {
        var This = this

        This.enumDevices(function (deviceInfo) {
            // log.log("get device info success: \n", JSON.stringify(deviceInfo))
            function setLabel(devices, type) {
                for (var key = 0; key < devices.length; key++) {
                    if (!devices[key].label) {
                        devices[key].label = type + key
                    }
                    log.log(type + " " + devices[key].label)
                }
                return devices
            }

            if (deviceInfo) {
                if (deviceInfo.cameras) {
                    setLabel(deviceInfo.cameras, 'cameras')
                }
                if (deviceInfo.microphones) {
                    setLabel(deviceInfo.microphones, 'microphones')
                }
                if (deviceInfo.speakers) {
                    setLabel(deviceInfo.speakers, 'speakers')
                }

                This.updateDeviceInfo(deviceInfo, "cameras")
                This.updateDeviceInfo(deviceInfo, "microphones")
                This.updateDeviceInfo(deviceInfo, "speakers")
            } else {
                log.warn("deviceInfo is null")
            }

        }, function (error) {
            log.error('enum device error: ' + error.toString())
        })
    }

    /***
     * 设备定时检查开关
     * @param switchOn: true 开启定时器；  false 关闭定时器
     */
    MediaDevice.prototype.setDeviceCheckInterval = function (switchOn) {
        var This = this
        if (switchOn) {
            clearInterval(This.deviceCheckTimer)
            This.deviceCheckTimer = setInterval(function () {
                This.checkAvailableDev()
            }, 1000)
        } else {
            clearInterval(This.deviceCheckTimer);
            This.deviceCheckTimer = null
        }
    }

    /***
     * 获取最接近，最合适的设备支持的分辨率
     * @param expectRes 当前希望获取的分辨率，eg {
     *   deviceId: 4b5305afd805f2d8439eac80dc94b14846799929d44d18c7dd8fc97eda75c046
     *   frameRate: 15,
     *   width: 1080,
     *   height: 720
     * }
     */
    MediaDevice.prototype.getSuitableResolution = function (expectRes) {
        if (!expectRes.deviceId || !expectRes.width || !expectRes.height || !expectRes.frameRate) {
            log.warn('Invalid parameter');
            return
        }

        var mediaDevice = JSON.parse(localStorage.getItem('mediaDevice'))
        var capability = []
        var sameWidthList = []
        var matchRes = {}

        if (mediaDevice && mediaDevice.cameras.length > 0) {
            // 获取给定设备支持的取流能力列表
            for (var i = 0; i < mediaDevice.cameras.length; i++) {
                if (mediaDevice.cameras[i].deviceId === expectRes.deviceId) {
                    capability = mediaDevice.cameras[i].capability
                    log.warn("capability: ", capability)
                    break
                }
            }

            // 过滤出相同width的分辨率
            if (capability.length > 0) {
                for (var j = 0; j < capability.length; j++) {
                    if (capability[j].width === expectRes.width) {
                        sameWidthList.push(capability[j])
                    }
                }
                log.warn("sameWidthList: ", sameWidthList)
            }

            // 获取最合适的分辨率
            if (sameWidthList.length > 0) {
                for (var k = 0; k < sameWidthList.length; k++) {
                    // 返回width height frameRate 都相同的分辨率
                    if (sameWidthList[k].width === expectRes.width && sameWidthList[k].height === expectRes.height && sameWidthList[k].frameRate === expectRes.frameRate) {
                        log.warn('Returns the resolution of width height frameRate', sameWidthList[k])
                        matchRes = sameWidthList[k]
                        break
                    }
                }

                if (JSON.stringify(matchRes) === "{}") {
                    for (var k = 0; k < sameWidthList.length; k++) {
                        // 返回width height相同， frameRate 小于期望值的的分辨率
                        if (sameWidthList[k].width === expectRes.width && sameWidthList[k].height === expectRes.height && sameWidthList[k].frameRate < expectRes.frameRate) {
                            log.warn('Returns the resolution where the width height is the same and the frameRate is less than the expected value. ', sameWidthList[k])
                            matchRes = sameWidthList[k]
                            break
                        }
                    }
                }

                if (JSON.stringify(matchRes) === "{}") {
                    for (var k = 0; k < sameWidthList.length; k++) {
                        // 返回width frameRate 相同， height 小于期望值的的分辨率
                        if (sameWidthList[k].width === expectRes.width && sameWidthList[k].height < expectRes.height && sameWidthList[k].frameRate === expectRes.frameRate) {
                            log.warn('Returns the resolution where the width height is the same and the frameRate is less than the expected value. ', sameWidthList[k])
                            matchRes = sameWidthList[k]
                            break
                        }
                    }
                }
            } else {
                log.warn("no same with resolution exist, get other resolution;")
                // 返回设备支持的最大的、width比期望值小的分辨率
                for (var j = 0; j < capability.length; j++) {
                    if (capability[j].width < expectRes.width) {
                        log.log('Returns the maximum resolution supported by the device with a smaller width than expected')
                        matchRes = capability[j]
                        break
                    }
                }
            }
            return matchRes
        }
        return matchRes
    }

    /******************************************************************************************************************/
    /******************************************************* 取流 *****************************************************/
    /******************************************************************************************************************/
    /***
     * 取流： audio/video/screenShare
     * @param data {
     *      callback: callback,
        streamType: "video",
        constraintsKeyWord: "exact",
        constraints: {
            aspectRatio: {min: 1.777, max: 1.778},
            frameRate: 30,
            width: 1280,
            height: 720,
            deviceId: deviceId,
        }
     * }
     * @param constraints
     */
    MediaDevice.prototype.getMedia = async function (data, constraints) {
        log.warn("getMedia")
        var This = this
        if (!constraints) {
            constraints = This.getConstraints(data, true)
        }

        function onGetStreamSuccess(stream) {
            data.callback({stream: stream})
        }

        function onGetStreamFailed(error) {
            data.settings = constraints
            data.error = error
            log.error("onGetStreamFailed: ", error.name, error.message)
            if(error.name === "OverconstrainedError" || error.name === "ConstraintNotSatisfiedError"){
                // constraints can not be satisfied by avb.device
                log.warn('constraints can not be satisfied by avb.device')
                This.getMedia(data)
            }else {
                if(error.name === "NotFoundError" || error.name === "DeviceNotFoundError"){
                    // require track is missing
                    log.warn('require track is missing')
                }else if(error.name === "NotReadableError" || error.name === "TrackStartError"){
                    // webcam or mic are already in use
                    log.warn('webcam or mic are already in use')
                }else if(error.name === "NotAllowedError" || error.name === "PermissionDeniedError" || error.name === "PermissionDismissedError" ){
                    // permission denied in browser
                    log.warn('permission denied in browser')
                }else if(error.name === "TypeError"){
                    // empty constraints object
                    log.warn('empty constraints object')
                }else {
                    // other errors
                    log.warn('other errors ' + error.name)
                }
                data.callback({error: error})
            }
        }

        if (data.streamType === 'audio' || data.streamType === 'video') {
            let stream = data.stream
            let videoTrack = null
            if (data.streamType === 'video' && stream && stream.getVideoTracks().length && stream.active === true) {
                videoTrack = stream.getVideoTracks()[0]
                var constraintsOfApply = constraints.video
                if (videoTrack && videoTrack.applyConstraints) {
                    log.warn("applyConstraints constraints: ", JSON.stringify(constraintsOfApply, null, '    '))
                    await videoTrack.applyConstraints(constraintsOfApply).then(onGetStreamSuccess).catch(onGetStreamFailed)
                }
            } else {
                // audio and video not
                log.warn("getUserMedia constraints: ", JSON.stringify(constraints, null, '    '))
                navigator.mediaDevices.getUserMedia(constraints).then(onGetStreamSuccess).catch(onGetStreamFailed)
            }
        } else if (data.streamType === 'screenShare') {
            if (navigator.getDisplayMedia) {
                navigator.getDisplayMedia(constraints).then(onGetStreamSuccess).catch(onGetStreamFailed)
            } else if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia(constraints).then(onGetStreamSuccess).catch(onGetStreamFailed)
            } else {
                log.info('getDisplayMedia is not supported by current browser')
                // 使用插件共享桌面
                alert("当前浏览器不支持桌面共享")
            }
        }
    }

    /***
     * 获取分辨率
     * @param data, eg.{
        constraintsKeyWord: "exact"
        deviceId: "8cd24e4d2ff8de04d9170e94899fdb24a10ac7c9d09cb90bbe796e754f768d03"
        frameRate: 30s
        height: 720
        streamType: "video"
        width: 1280
     * }
     * @param reTry: true 取流失败后重新取流， false 第一次取流
     */
    MediaDevice.prototype.getConstraints = function (data, reTry) {
        let This = this
        let constraints = {}
        switch (data.streamType) {
            case 'audio':
                constraints = {
                    audio: data.deviceId ? {deviceId: data.deviceId} : true,
                    video: false
                }
                break;
            case 'video':
                constraints = This.getVideoConstraints(data, reTry)
                break
            case 'screenShare':
                constraints = This.getScreenShareConstraints(data)
                break
            default:
                break
        }

        return constraints
    }

    /***
     * 获取video 分辨率
     * @param data 需要得参数
     constraintsKeyWord: "exact"
     deviceId: "8cd24e4d2ff8de04d9170e94899fdb24a10ac7c9d09cb90bbe796e754f768d03"
     frameRate: 15
     height: 720
     streamType: "video"
     width: 1280
     * @param reTry 需要得参数 : true 取流失败重新取流, false 第一次取流
     * @returns {{audio: boolean, video: {frameRate: {exact: number}, width: {exact: number}, aspectRatio: {exact: number}, height: {exact: number}}}}
     */
    MediaDevice.prototype.getVideoConstraints = function (data, reTry) {
        let This = this
        let matchResolution = {}
        let currentLimit = {}
        let deviceId

        if (reTry) {
            // 这种方式不需要重复获取匹配了
            currentLimit = This.getNextConstraints(data)
            deviceId = currentLimit.deviceId
            matchResolution = currentLimit
        } else {
            // 默认首次取流都使用exact
            deviceId = data.deviceId
            currentLimit = data
            log.info("deviceId: ", deviceId)
            if (deviceId) {
                matchResolution = This.getSuitableResolution({
                    frameRate: currentLimit.frameRate ? currentLimit.frameRate : 30,
                    width: currentLimit.width ? currentLimit.width : 640,
                    height: currentLimit.height ? currentLimit.height : 360,
                    deviceId: currentLimit.deviceId
                })
                log.log("match constraints: ", matchResolution)
            }
        }

        log.info("currentLimit: ", currentLimit)
        let constraints = {
            audio: false,
            video: {
                frameRate: {
                    exact: matchResolution.frameRate ? matchResolution.frameRate : currentLimit.frameRate ? currentLimit.frameRate : 30
                },
                aspectRatio: {
                    exact: matchResolution.width ? (matchResolution.width / matchResolution.height) : (currentLimit.width / currentLimit.height)
                },
                width: {
                    exact: matchResolution.width ? matchResolution.width : currentLimit.width ? currentLimit.width : 640
                },
                height: {
                    exact: matchResolution.height ? matchResolution.height : currentLimit.height ? currentLimit.height : 360
                }
            }
        }

        if (deviceId) {
            constraints.video.deviceId = {
                exact: deviceId
            }
        }

        log.log("data.constraintsKeyWord: ", data.constraintsKeyWord)
        if (!data.constraintsKeyWord) {
            log.warn("Do not use keyWord limit")
            constraints.video.frameRate = constraints.video.frameRate.exact
            constraints.video.aspectRatio = constraints.video.aspectRatio.exact
            constraints.video.width = constraints.video.width.exact
            constraints.video.height = constraints.video.height.exact
            if (constraints.video.deviceId.exact || constraints.video.deviceId.ideal) {
                constraints.video.deviceId = constraints.video.deviceId.exact ? constraints.video.deviceId.exact : constraints.video.deviceId.ideal
            }
        } else if (data.constraintsKeyWord === 'ideal') {
            log.warn("Use ideal limit")
            constraints.video.frameRate.ideal = constraints.video.frameRate.exact
            constraints.video.aspectRatio.ideal = constraints.video.aspectRatio.exact
            constraints.video.width.ideal = constraints.video.width.exact
            constraints.video.height.ideal = constraints.video.height.exact
            // 使用max限制来避免超出要求的能力
            constraints.video.frameRate.max = constraints.video.frameRate.exact
            constraints.video.aspectRatio.max = constraints.video.aspectRatio.exact
            constraints.video.width.max = constraints.video.width.exact
            constraints.video.height.max = constraints.video.height.exact
            if (constraints.video.deviceId.exact) {
                constraints.video.deviceId.ideal = constraints.video.deviceId.exact
            }
            // 删除exact属性
            delete constraints.video.frameRate.exact
            delete constraints.video.aspectRatio.exact
            delete constraints.video.width.exact
            delete constraints.video.height.exact
            delete constraints.video.deviceId.exact
        } else if (data.constraintsKeyWord === 'exact') {
            log.warn("Use exact limit")
        }

        log.warn("get new Video Constraints: ", JSON.stringify(constraints, null, '   '))
        return constraints
    }

    /***
     * 取流失败后根据设备支持的能力列表获取下一个分辨率
     * @param data = {
     *      callback: ƒ (message)
        constraints: {aspectRatio: {…}, frameRate: 30, width: 1280, height: 720, deviceId: "5e3722883e2e9337040a4f1ababf85a5bd2f6a36afc815fd391424ac05a84ab0"}
        constraintsKeyWord: "ideal"
        error: OverconstrainedError {name: "OverconstrainedError", message: null, constraint: "frameRate"}
        settings: {audio: false, video: {…}}
        streamType: "video"
     * }
     * @returns {{frameRate: number, streamType: string, width: number, deviceId: (*|number|boolean|string|string[]|ConstrainDOMStringParameters|"user"|"environment"|"left"|"right"|VideoFacingModeEnum[]), constraintsKeyWord: (string), height: number}}
     */
    MediaDevice.prototype.getNextConstraints = function (data) {
        let This = this
        // 获取上一次取流失败的分辨率限制
        let lastSettings = data.settings
        let settings = {
            frameRate: lastSettings.video.frameRate.exact ? lastSettings.video.frameRate.exact : lastSettings.video.frameRate.ideal ? lastSettings.video.frameRate.ideal : lastSettings.video.frameRate,
            width: lastSettings.video.width.exact ? lastSettings.video.width.exact : lastSettings.video.width.ideal ? lastSettings.video.width.ideal : lastSettings.video.width,
            height: lastSettings.video.height.exact ? lastSettings.video.height.exact : lastSettings.video.height.ideal ? lastSettings.video.height.ideal : lastSettings.video.height,
            deviceId: lastSettings.video.deviceId.exact ? lastSettings.video.deviceId.exact : lastSettings.video.deviceId.ideal ? lastSettings.video.deviceId.ideal : lastSettings.video.deviceId,
        }

        // 获取下一个分辨率
        let deviceId = settings.deviceId ? settings.deviceId : data.deviceId
        let capability = This.getCapability(deviceId)
        let nextConstraints
        for (let j = 0; j < capability.length; j++) {
            if (capability[j].width === settings.width && capability[j].height === settings.height && capability[j].frameRate === settings.frameRate) {
                nextConstraints = capability[j + 1]
                break
            }
        }

        log.log("nextConstraints: ", nextConstraints)
        // 如果nextConstraints不存在，说明能力列表全部扫描完成，换其他的限制尝试（exact/ideal/不使用）
        if (!nextConstraints) {
            log.warn("Change the restriction condition.")
            if (data.constraintsKeyWord === 'exact') {
                log.warn("Exact has been scanned, using ideals")
                data.constraintsKeyWord = 'ideal'
            } else if (data.constraintsKeyWord === 'ideal') {
                log.warn("The ideal has been scanned. Do not use keywords")
                data.constraintsKeyWord = ''
            } else {
                // 取流彻底失败，调用回调返回
                log.warn("The flow failed completely, and the flow was not taken.")
                data.callback({error: data.error})
            }
        }

        return {
            constraintsKeyWord: data.constraintsKeyWord,
            streamType: data.streamType,
            deviceId: settings.deviceId ? settings.deviceId : data.deviceId,
            frameRate: nextConstraints ? nextConstraints.frameRate ? nextConstraints.frameRate : data.constraints.frameRate : data.constraints.frameRate,
            width: nextConstraints ? nextConstraints.width ? nextConstraints.width : data.constraints.width : data.constraints.width,
            height: nextConstraints ? nextConstraints.height ? nextConstraints.height : data.constraints.height : data.constraints.height,
        }
    }

    /***
     * 获取屏幕共享分辨率
     * @param data
     * @returns {{audio: boolean, video: {frameRate: {max: string}, width: {max: string}, height: {max: string}}}|{audio: boolean, video: {frameRate: {min: string, max: string}, mozMediaSource: *, width: {min: string, max: string}, mediaSource: *, height: {min: string, max: string}}}|{audio: boolean, video: {frameRate: {min: string, max: string}, width: {min: string, max: string}, logicalSurface: boolean, displaySurface: string, height: {min: string, max: string}}}|{audio: boolean, video: {optional: {sourceId: string}[], mandatory: {minFrameRate: number, maxFrameRate: number}}}}
     */
    MediaDevice.prototype.getScreenShareConstraints = function (data) {
        let screenConstraints
        /***
         * for all supported getDisplayMedia browser versions
         */
        if (navigator.mediaDevices.getDisplayMedia) {
            screenConstraints = {
                audio: false,
                video: {
                    width: {max: '1920'},
                    height: {max: '1080'},
                    frameRate: {max: '5'}
                }
            };
        }

        /***
         * for Firefox
         */
        if (!!navigator.mozGetUserMedia) {
            screenConstraints = {
                audio: false,
                video: {
                    mozMediaSource: source,
                    mediaSource: source,
                    width: {min: '10', max: '1920'},
                    height: {min: '10', max: '1080'},
                    frameRate: {min: '1', max: '5'}
                }
            };
        }

        /***
         * for Edge
         */
        if (adapter.browserDetails.browser === "edge") {
            if (adapter.browserDetails.version >= 17134 && !!navigator.getDisplayMedia) {
                screenConstraints = {
                    audio: false,
                    video: {
                        displaySurface: 'window',
                        logicalSurface: true,
                        width: {min: '10', max: '1920'},
                        height: {min: '10', max: '1080'},
                        frameRate: {min: '1', max: '5'}
                    }
                };
            } else {
                log.warn("This version of Edge does not support screen capture feature");
                return;
            }
        }

        return screenConstraints
    }

    /***
     * 根据deviceId 获取当前设备的设备支持能力
     * 设备信息定时更新的，所以deviceId不会存在不匹配问题
     * @param deviceId
     * @returns {Array}
     */
    MediaDevice.prototype.getCapability = function (deviceId) {
        let This = this
        let mediaDevice = JSON.parse(localStorage.getItem('mediaDevice'))
        let capability = []
        let cameras = mediaDevice.cameras
        if (cameras && cameras.length) {
            for (let i = 0; i < cameras.length; i++) {
                if (cameras[i].deviceId === deviceId) {
                    capability = cameras[i].capability
                }
            }
        }

        if (!capability.length) {
            capability = This.getQuickScanList()
        }
        log.info("capability: ", capability)

        return capability
    }

    return MediaDevice;

}));
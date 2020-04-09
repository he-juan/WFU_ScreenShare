let ws
let wsAddr = localStorage.getItem('wsName');
let pausePresentBtn = document.getElementById("pausePresent");

window.onload = function () {
    let wsName = localStorage.getItem('wsName')
    if(wsName){
        document.getElementById('wsAddr').value = wsName
    }

    var oReadyStateTimer = setInterval(function () {
            if (document.readyState === "complete") {
                if(!GsRTC){
                    log.warn("ERR_NOT_LOADED: GsRTC not loaded yet.")
                    return
                }
                clearInterval(oReadyStateTimer);

                let options = {}
                window.gsRTC = new GsRTC(options);
                // 绑定页面音视频页面元素
                gsRTC.setHtmlMediaElement({
                    localAudio:  document.getElementById('localAudio'),
                    localVideo:  document.getElementById('localVideo'),
                    localPresentVideo:  document.getElementById('localPresentVideo'),
                    localVideoShare:  document.getElementById('localVideoShare'),

                    remoteAudio:  document.getElementById('remoteAudio'),
                    remoteVideo:  document.getElementById('remoteVideo'),
                    remotePresentVideo:  document.getElementById('remotePresentVideo'),
                    remoteVideoShare:  document.getElementById('remoteVideoShare'),
                })

            }
        },
        500);
}

function multiStreamCall(){
    log.warn("multi stream call ...")
    let wsAddr =  document.getElementById('wsAddr').value

    if(!wsAddr){
        alert('enter ws value !')
        return
    }

    call(wsAddr, function (data) {
        log.warn("join  meetings callback: ", data)
    })
}

function videoOperation(operation){
    if(operation){
        window.isMainShare = true
        let videoList = document.getElementById('videoList').options
        let deviceId
        if (videoList && videoList.length > 0) {
            let selectDevice = videoList[videoList.selectedIndex]
            log.warn("selectDevice: ", selectDevice.label)
            deviceId = selectDevice.value
        } else {
            alert('No device here! plug device and Try again!')
        }

        let data = {
            deviceId: deviceId,
            type: 'video',
            callback: function (data) {
                log.info("video on callback:",data)
            }
        }
        shareVideo(data)
    }else{
        window.isMaintShare = 'stop'

        stopShareVideo(function (data) {
            log.info("Video off callback：", data)
        })
    }
}

function startPresent(operation) {
    if(operation){
        window.isPresentShare = true
        pausePresentBtn.hidden = false
        shareScreen(function (data) {
            log.info("开启演示callback：", data)
        })
    }else{
        window.isPresentShare = 'stop'
        pausePresentBtn.hidden = true
        stopShareScreen(function (data) {
            log.info("关闭演示callback：", data)
        })
    }
}

function presentPauseOperation(){
    if(pausePresentBtn.innerHTML === "暂停演示"){
        window.onpausePresent = true
        pausePresentBtn.innerHTML = "恢复演示"
    }else if(pausePresentBtn.innerHTML === "恢复演示"){
        window.onpausePresent = false
        pausePresentBtn.innerHTML = "暂停演示"
    }
    function callback(data){
        if(pausePresentBtn.innerHTML === "暂停演示"){
            log.info("恢复演示callback： ", data)
        }else{
            log.info("暂停演示callback： ", data)
        }

    }
    pauseScreen(window.onpausePresent, callback)
}


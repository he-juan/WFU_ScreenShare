
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


                // 测试页面添加的注册事件
                addEventHandler('shareScreen', function (data) {
                    console.warn("shareScreen: ", data)
                })
                addEventHandler('stopShareScreen', function (data) {
                    console.warn("stopShareScreen: ", data)
                })
                addEventHandler('shareScreenRequest', function (data) {
                    console.warn("shareScreenRequest: ", data)
                })
                addEventHandler('stopShareScreenRequest', function (data) {
                    console.warn("stopShareScreenRequest: ", data)
                })
                addEventHandler('hangup', function (data) {
                   console.warn("hangup: ", data)
                })
                addEventHandler('hangupRequest', function (data) {
                   console.warn("hangupRequest: ", data)
                })
            }
        },
        500);
}

let pausePresentBtn = document.getElementById("pausePresent");
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
        beginVideo(data)
    }else{
        stopVideo(function (data) {
            log.info("Video off callback：", data)
        })
    }
}

function startPresent(operation) {
    if(operation){
        pausePresentBtn.hidden = false
        beginScreen(function (data) {
            log.info("开启演示callback：", data)
        })
    }else{
        pausePresentBtn.hidden = true
        stopScreen(function (data) {
            log.info("关闭演示callback：", data)
        })
    }
}

function presentPauseOperation(){
    function callback(data){
        if(pausePresentBtn.innerHTML === "暂停演示"){
            log.info("恢复演示callback： ", data)
        }else{
            log.info("暂停演示callback： ", data)
        }

    }
    if(pausePresentBtn.innerHTML === "暂停演示"){
        pausePresent(true, callback)
        pausePresentBtn.innerHTML = "恢复演示"
    }else if(pausePresentBtn.innerHTML === "恢复演示"){
        pausePresent(false, callback)
        pausePresentBtn.innerHTML = "暂停演示"
    }
}

function openRemoteScreenShare(){
    openRemoteControl(function(data){
        console.warn("openRemoteScreen callback:",data)
    })
}

function stopRemoteScreenShare(){
    stopRemoteControl(function(data){
        console.warn("stopRemoteScreen callback:",data)
    })
}


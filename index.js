window.wfu = true
let ws
let wsAddr = localStorage.getItem('wsName');

function addWebSocket() {
    let wsAddr =  document.getElementById('wsAddr').value
    let protocols = 'gs-webrtc-json';
    if(!wsAddr){
        alert('enter ws value !')
        return
    }

    localStorage.setItem('wsName',wsAddr)

    let sipCallInfo = {
        sessionsConfig: ['audio', 'main', 'slides']
    };
    let sipRegisterInfo = {
        protocol: protocols,
        websocketUrl: wsAddr,
    }
    gsRTC.conf.sessionsConfig = sipCallInfo.sessionsConfig
    gsRTC.sokect = new WebSocketInstance(sipRegisterInfo.websocketUrl, sipRegisterInfo.protocol || 'sip')
    gsRTC.RTCSession = new PeerConnection(sipCallInfo, window.gsRTC)
    gsRTC.RTCSession.createRTCSession(gsRTC.conf)
}

function hangup() {
    console.log('Ending call');
    let message;
    let reqId = parseInt(Math.round(Math.random()*100));
    console.warn("random req id is" + reqId);

    console.log(ws);
    message = {
        destroyMediaSession: {
            userName: "wfu_test",
            reqId: reqId
        }
    }

    if(!gsRTC || !gsRTC.sokect || !gsRTC.sokect.ws){
        console.warn('ws connected is not established')
    }else {
        gsRTC.sokect.ws.send(JSON.stringify(message))
        console.warn('end ws send: ' + JSON.stringify(message, null, '    '))
        console.log('close webSocket connection')
        gsRTC.sokect.ws.close()
        // window.location.reload(true)
    }
}


function startPresent(operation) {
    console.warn('start present!!')
    let reqId = parseInt(Math.round(Math.random()*100));
    console.warn("random req id is" + reqId);
    let data = {
        ctrlPresentation: {
            userName: "wfu_test",
            reqId: reqId,
            sendPermission: operation,
        }
    }
    console.warn("send data: \n" + JSON.stringify(data, null, '    ') );
    if(gsRTC && gsRTC.sokect){
        gsRTC.sokect.ws.send(JSON.stringify(data))
    }
}



function getCaptureStream(type){
    console.warn("getCaptureStream: ", type)
    let canvas = document.getElementById('canvasForCaptureStream')
    let stream = canvas.captureStream();

    if(type === 'main'){
        console.warn('添加主流')
        let localVideo1 = document.getElementById('localVideo')
        localVideo1.srcObject = stream;
    }

    return stream
}

function getSlidesCaptureStream(type){
    console.warn("getSlidesCaptureStream: ", type)
    let canvas = document.getElementById('slidesCanvas')

    let stream = canvas.captureStream();
    if(type === 'slides'){
        console.warn('添加演示流')
        let localPresent = document.getElementById('localPresentVideo')
        localPresent.srcObject = stream;
    }

    return stream
}

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

GsRTC.prototype.HTML_MEDIA_ELEMENT = {
    localAudio: null,
    localVideo: null,
    localPresentVideo: null,
    localVideoShare: null,
    remoteAudio: null,
    remoteVideo: null,
    remotePresentVideo: null,
    remoteVideoShare: null,
}

/**
 * save local && remote stream
 * @type {{LOCAL_PRESENT_STREAM: null, LOCAL_VIDEO_SHARE_STREAM: null, REMOTE_VIDEO_SHARE_STREAM: null, LOCAL_AUDIO_STREAM: null, REMOTE_PRESENT_STREAM: null, REMOTE_AUDIO_STREAM: null, LOCAL_VIDEO_STREAM: null, REMOTE_VIDEO_STREAM: null}}
 */
GsRTC.prototype.MEDIA_STREAMS = {
    LOCAL_AUDIO_STREAM: null,
    REMOTE_AUDIO_STREAM: null,
    LOCAL_VIDEO_STREAM: null,
    REMOTE_VIDEO_STREAM: null,
    LOCAL_PRESENT_STREAM: null,
    REMOTE_PRESENT_STREAM: null,
    LOCAL_VIDEO_SHARE_STREAM : null,
    REMOTE_VIDEO_SHARE_STREAM : null
};

/**
 * Save upstream or downstream resolution
 * @type {{EXPECT_RECV_RESOLUTION: {}, CURRENT_UP_RESOLUTION: {}}}
 */
GsRTC.prototype.VIDEO_RESOLUTION = {
    CURRENT_UP_RESOLUTION: {},
    EXPECT_RECV_RESOLUTION: {},
}

GsRTC.prototype.MID_OBJ = {
    AUDIO_MID: { ORIGINAL_MID: null, MODIFIED_MID: null },
    MAIN_MID: { ORIGINAL_MID: null, MODIFIED_MID: null },
    SLIDES_MID: { ORIGINAL_MID: null, MODIFIED_MID: null},
    GUI_MID: { ORIGINAL_MID: null, MODIFIED_MID: null}
}

GsRTC.prototype.CODE_TYPE = {
    VIDEO_ON_FAILED: { codeType: 101, message: 'failed to video on' },
    AUDIO_REFRESH_FAILED: { codeType: 102, message: 'failed to refresh audio' },
    PRESENT_ON_FAILED: { codeType: 103, message: 'failed to present on' },


    /********************重新设置错误（来自webRTC的JS层内部的错误码）*****************************/
    INVALID_WEBSOCKET_ADDRESS: { codeType: 300, message: 'webSocket address is not a valid address' },
    NOT_SUPPORT_SCREEN_SHARE:{codeType:301,message:'The current browser version does not support Screen share'},
    WEBSOCKET_CLOSE:{codeType:302,message:'Websocket automatically disconnected'},
    CANCEL_PRESENT_ON:{codeType:303,message:'cancel shareScreen',rejectAuthorizationTip:'false'},
    SHARE_SCREEN_TIMEOUT:{codeType:308,message:'open shareScreen timeout'},
    SUCCESS:{codeType:200,message:'operate success'},

    /********************重新设置错误（来自GSphone的错误码）*****************************/
    PRESENT_ON_REJECT: { codeType: 405, message: 'the call in Hold status!' },
    REFUSE_CALL:{codeType:488,message:'Media information ERROR'},

    /********************重新设置错误（来自webrtc 传给 GSphone的错误码）*****************************/
    PRESENT_ON_SHARING:{codeType: 104, message: 'Share screen is being turned on'},
    PRESENT_OFF_SHARING:{codeType: 105, message: 'Stop Share Screen is being turned on'},
    REJECT_MULTIPLE_REQUESTS:{codeType: 106, message: 'Reject shareScreen or stopShareScreen request again after replying to the signaling'},
    SHARE_SCREEN_REQUEST_REFUSE: { codeType: 403, message: 'Present turn On Request denied'  },
    STOP_SHARE_SCREEN_REQUEST_REFUSE: { codeType: 403, message: 'Present turn Off Request denied'  },
    HANG_UP_REQUEST_REFUSE:{codeType: 403, message: 'hang up Request denied' },

}

GsRTC.prototype.SIGNAL_EVENT_TYPE = {
    // (Web发送到GsPhone的信令类型)
    INVITE: { id: 0x01 << 1, name: 'createMediaSession' },                      // 建立会话
    RE_INVITE: { id: 0x01 << 2, name: 'updateMediaSession' },                   // 更新会话信息

    // (GsPhone发送到Web端的信令类型)
    INVITE_RET: { id: 0x01 << 3, name: 'createMediaSessionRet' },               // 建立会话的回复
    RE_INVITE_RET: { id: 0x01 << 4, name: 'updateMediaSessionRet' },            // 更新会话信息的回复

    // (Web->GsPhone 和 GsPhone->Web 共有信令类型)
    PRESENT: { id: 0x01 << 5, name: 'ctrlPresentation' },                        // 请求开启演示
    PRESENT_RET: { id: 0x01 << 6, name: 'ctrlPresentationRet' },                 // 收到请求开启演示的回复信令
    MESSAGE: { id: 0x01 << 7, name: 'sendMessageToUser' },                       // 发送消息
    MESSAGE_RET: { id: 0x01 << 8, name: 'sendMessageToUserRet' },                // 收到消息后的回复信令
    UPDATE_USER_INFO: { id: 0x01 << 9, name: 'updateUserInfo' },                 // 更新用户信息
    UPDATE_USER_INFO_RET: { id: 0x01 << 10, name: 'updateUserListRet' },         // 收到更新用户信息后的回复信令
    UPDATE_USER_LIST: { id: 0x01 << 11, name: 'updateUserList' },                 // 更新用户列表
    UPDATE_USER_LIST_RET: { id: 0x01 << 12, name: 'updateUserListRet' },         // 收到更新用户列表后的回复信令
    UPDATE_CANDIDATE_INFO: { id: 0x01 << 13, name: 'updateCandidate' },          // trickle-ice 时用来发送candidate
    UPDATE_CANDIDATE_INFO_RET: { id: 0x01 << 14, name: 'updateCandidateRet' },   // trickle-ice 时收到candidate时的回复信令
    BYE: { id: 0x01 << 15, name: 'destroyMediaSession' },                         // 结束会话
    BYE_RET: { id: 0x01 << 16, name: 'destroyMediaSessionRet' },                  // 结束会话的回复
    CANCEL:  { id: 0x01 << 17, name: 'cancelRequest' },                           // 请求取消开启演示信令
    CANCEL_RET: { id: 0x01 << 18, name: 'cancelRequestRet' },                     // 收到取消开启演示的回复信令
    CLOSE:  { id: 0x01 << 19, name: 'close ' },                                  //  收到请求开启演示的回复信令但已关闭流，即发送gsPhone关闭重置
}



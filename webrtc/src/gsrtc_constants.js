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
    AUDIO_MID: {
        ORIGINAL_MID: null,
        MODIFIED_MID: null
    },
    MAIN_MID: {
        ORIGINAL_MID: null,
        MODIFIED_MID: null
    },
    SLIDES_MID: {
        ORIGINAL_MID: null,
        MODIFIED_MID: null
    },
    GUI_MID: {
        ORIGINAL_MID: null,
        MODIFIED_MID: null
    }
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
    BYE: { id: 0x01 << 15, name: 'destoryMediaSession' },                         // 结束会话
    BYE_RET: { id: 0x01 << 16, name: 'destoryMediaSessionRet' },                  // 结束会话的回复
}

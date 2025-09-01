const host = process.env.REACT_APP_API_HOST || "http://localhost:5000";

// Auth routes
export const loginRoute = `${host}/api/auth/login`;
export const registerRoute = `${host}/api/auth/register`;
export const setAvatarRoute = `${host}/api/auth/setavatar`;
export const allUsersRoute = `${host}/api/auth/allusers`;
export const logoutRoute = `${host}/api/auth/logout`;

// Message routes
export const sendMessageRoute = `${host}/api/messages/addmsg`;
export const receiveMessageRoute = `${host}/api/messages/getmsg`;
export const editMessageRoute = `${host}/api/messages/editmsg`;
export const deleteMessageRoute = `${host}/api/messages/deletemsg`;
export const addReactionRoute = `${host}/api/messages/reaction`;
export const markAsReadRoute = `${host}/api/messages/markread`;

// Group routes
export const createGroupRoute = `${host}/api/groups/create`;
export const getUserGroupsRoute = `${host}/api/groups/user`;
export const addGroupMemberRoute = `${host}/api/groups/addmember`;
export const removeGroupMemberRoute = `${host}/api/groups/removemember`;
export const updateGroupRoleRoute = `${host}/api/groups/updaterole`;
export const generateInviteLinkRoute = `${host}/api/groups/invitelink`;

// Story routes
export const createStoryRoute = `${host}/api/stories/create`;
export const getUserStoriesRoute = `${host}/api/stories/user`;
export const getAllStoriesRoute = `${host}/api/stories/all`;
export const viewStoryRoute = `${host}/api/stories/view`;
export const replyToStoryRoute = `${host}/api/stories/reply`;
export const deleteStoryRoute = `${host}/api/stories/delete`;

// Call routes
export const initiateCallRoute = `${host}/api/calls/initiate`;
export const joinCallRoute = `${host}/api/calls/join`;
export const leaveCallRoute = `${host}/api/calls/leave`;
export const updateCallSettingsRoute = `${host}/api/calls/settings`;
export const updateParticipantStatusRoute = `${host}/api/calls/participant-status`;
export const getCallHistoryRoute = `${host}/api/calls/history`;
export const endCallRoute = `${host}/api/calls/end`;

// Media routes
export const generateUploadUrlRoute = `${host}/api/media/upload-url`;
export const uploadFileRoute = `${host}/api/media/upload`;
export const getMediaStatusRoute = `${host}/api/media/status`;
export const getSignedUrlRoute = `${host}/api/media/signed-url`;
export const deleteMediaRoute = `${host}/api/media/delete`;
export const getUserMediaRoute = `${host}/api/media/user`;

// Export host for components that need it
export { host };

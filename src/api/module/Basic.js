import request from '@/utils/request';

/**
 * 获取设备列表
 *
 * @param {Object} query - 查询参数对象
 * @returns {Promise} 返回请求的Promise对象
 */
export function deviceList(query) {
  return request({
    url: '/module/device/list',
    method: 'get',
    params: query,
  });
}

export function getAccount(query) {
  return request({
    url: '/module/video/getAccount',
    method: 'get',
    params: query,
  });
}

export function deleteVideoTag(id) {
  return request({
    url: '/module/VideoTags/' + id,
    method: 'delete',
  });
}

export function videoList(query) {
  return request({
    url: '/module/video/list',
    method: 'get',
    params: query,
  });
}

export function accountContentList(query) {
  return request({
    url: '/module/accountContent/list',
    method: 'get',
    params: query,
  });
}

export function accountCommentList(query) {
  return request({
    url: '/module/comment/list',
    method: 'get',
    params: query,
  });
}

export function ipAddressList(query) {
  return request({
    url: '/module/ipAddress/list',
    method: 'get',
    params: query,
  });
}

export function AddressVideoIp(query) {
  return request({
    url: '/module/AddressVideo/listByIp',
    method: 'get',
    params: query,
  });
}

export function addressAccountContent(query) {
  return request({
    url: '/module/addressAccountContent/list',
    method: 'get',
    params: query,
  });
}

export function accountListByDid(query) {
  return request({
    url: '/module/accountContent/listByDid',
    method: 'get',
    params: query,
  });
}

export function accountListByFollow(query) {
  return request({
    url: '/module/accountContent/listByFollow',
    method: 'get',
    params: query,
  });
}
export function accountListByFans(query) {
  return request({
    url: '/module/accountContent/listByFans',
    method: 'get',
    params: query,
  });
}

export function AddressVideo(query) {
  return request({
    url: '/module/AddressVideo/list',
    method: 'get',
    params: query,
  });
}
export function videoTask(query) {
  return request({
    url: '/module/video_task/list',
    method: 'get',
    params: query,
  });
}

export function deleteVideoTask(id) {
  return request({
    url: '/module/video_task/' + id,
    method: 'delete',
  });
}

export function addTags(data) {
  return request({
    url: '/module/video_task',
    method: 'post',
    data: data,
  });
}
export function updateTags(data) {
  return request({
    url: '/module/video_task',
    method: 'put',
    data: data,
  });
}

export function tags(data) {
  return request({
    url: '/module/VideoTags',
    method: 'post',
    data: data,
  });
}
export function editTags(data) {
  return request({
    url: '/module/VideoTags',
    method: 'put',
    data: data,
  });
}

export function VideoTags(query) {
  return request({
    url: '/module/VideoTags/list',
    method: 'get',
    params: query,
  });
}
export function RunLog(query) {
  return request({
    url: '/module/RunLog/list',
    method: 'get',
    params: query,
  });
}

export function updateVideoTags(data) {
  return request({
    url: '/module/VideoTags',
    method: 'put',
    data: data,
  });
}

export function updateComment(data) {
  return request({
    url: '/module/comment',
    method: 'put',
    data: data,
  });
}

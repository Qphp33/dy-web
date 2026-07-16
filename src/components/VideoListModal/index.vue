<template>
  <div class="video-list-modal__root">
    <a-modal
      class="video-list-modal"
      wrapClassName="video-list-modal__wrap"
      :visible="visible"
      :title="title"
      width="90%"
      :footer="null"
      destroyOnClose
      @cancel="handleCancel"
    >
      <div class="video-list-modal__content">
        <a-spin :spinning="loading">
          <div class="video-list__card-wrap card">
            <a-card
              v-for="(video, index) in videoList"
              :key="`video-${video.uid}-${index}`"
              class="video-list__video-card"
              hoverable
            >
              <div
                class="video-card__author-info"
                v-if="video.userInfo?.nickname"
              >
                <!-- 核心容器：自动等高 + 按钮贴底 -->
                <div class="author-info__container">
                  <!-- 上半部分：头像 + 信息 + 右侧评论数 -->
                  <div class="author-info__inner">
                    <!-- 头像 -->
                    <a-avatar
                      :size="68"
                      :src="getUrl(video.userInfo?.touxiang || video.touxiang)"
                      :key="`avatar-${video.id}-${queryParam.pageNum}`"
                      @error="(e) => (e.target.src = '')"
                      class="author-info__avatar"
                    >
                      {{
                        getShortNickname(
                          video.userInfo?.nickname || video.nickname || "匿"
                        )
                      }}
                    </a-avatar>

                    <!-- 中间文字信息 -->
                    <div class="author-info__main">
                      <div class="author-info__row author-info__top">
                        <span class="author-info__nickname">
                          {{
                            video.userInfo?.nickname ||
                            video.nickname ||
                            "未知作者"
                          }}
                        </span>
                        <span
                          v-if="video.userInfo?.real_name"
                          class="author-info__realname"
                        >
                          ({{ video.userInfo.real_name }})
                        </span>
                        <span
                          v-if="video.userInfo?.id || video.douyinId"
                          class="author-info__douyin-id"
                        >
                          <a-icon type="idcard" size="small" />
                          {{ video.userInfo?.id || video.douyinId }}
                        </span>
                      </div>

                      <div class="author-info__row author-info__middle">
                        <span class="author-info__region">
                          <a-icon type="environment" size="small" />
                          {{
                            video.userInfo?.region || video.region || "未知属地"
                          }}
                        </span>
                      </div>

                      <div
                        v-show="
                          video.userInfo?.profile_text || video.profile_text
                        "
                        class="author-info__row author-info__profile"
                      >
                        <span class="profile-label">简介：</span>
                        <span class="profile-text">
                          {{
                            video.userInfo?.profile_text || video.profile_text
                          }}
                        </span>
                      </div>

                      <div class="author-info__row author-info__meta">
                        <span class="meta-item">
                          <a-icon type="user-add" size="small" />
                          {{ video.userInfo?.follow_count || 0 }} 关注
                        </span>
                        <span class="meta-item">
                          <a-icon type="star" size="small" />
                          {{ video.userInfo?.fans_count || 0 }} 粉丝
                        </span>
                        <span class="meta-item">
                          <a-icon type="like" size="small" />
                          {{ video.userInfo?.likes_count || 0 }} 获赞
                        </span>
                      </div>
                    </div>

                    <!-- 右侧评论数 保持不动 -->
                    <div
                      v-if="isType !== '5' && isType !== '4' && isType !== '6'"
                      class="author-info__comment-count"
                    >
                      <span class="count-num">{{
                        video.count || video.commentCount || 0
                      }}</span>
                      <span class="count-label">评论数</span>
                    </div>
                  </div>

                  <!-- ================= 底部按钮（永远固定在最底部，整行对齐） ================= -->
                  <div class="author-info__bottom-actions">
                    <a-button
                      v-if="video.zhuye || video.userInfo?.zhuye"
                      type="primary"
                      size="small"
                      ghost
                      block
                      @click="openZhuyeModal(video)"
                    >
                      <a-icon type="picture" /> 主页照片
                    </a-button>
                    <a-button
                      v-if="video.status == 9"
                      type="primary"
                      size="small"
                      block
                      @click="getAllVideos(video)"
                      :loading="video.loadingAllVideo"
                    >
                      <a-icon type="video-camera" />获取全部视频
                    </a-button>
                    <a-button
                      type="primary"
                      size="small"
                      ghost
                      block
                      @click="openUserDetail(video)"
                    >
                      <a-icon type="user" /> 个人详情
                    </a-button>
                  </div>
                </div>
              </div>
            </a-card>
          </div>

          <div
            class="video-list__empty"
            v-if="!loading && videoList.length === 0"
          >
            <a-empty description="暂无相关视频数据" />
          </div>
          <a-pagination
            class="video-list__pagination"
            :current="queryParam.pageNum"
            :total="total"
            :page-size="queryParam.pageSize"
            :showTotal="(total) => `共 ${total} 条`"
            @change="changeSize"
          />
        </a-spin>
      </div>
    </a-modal>

    <a-modal
      v-model="zhuyeModalVisible"
      width="24%"
      :footer="null"
      destroyOnClose
      class="zhuye-preview-modal"
      style="top: 20px"
    >
      <div class="zhuye-preview-container">
        <div v-if="currentZhuyeUrl" class="image-wrapper">
          <img
            :src="currentZhuyeUrl"
            alt="主页照片"
            class="zhuye-image"
            @error="handleImageError"
          />
        </div>
        <div v-else>
          <a-empty description="暂无可用的主页照片" />
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script>
import {
  accountContentList,
  addressAccountContent,
  accountListByDid,
  accountListByFans,
  accountListByFollow,
  accountCommentList,
  tags,
} from "@/api/module/Basic";
import { message } from "ant-design-vue";

export default {
  name: "VideoListModal",
  props: {
    visible: { type: Boolean, required: true, default: false },
  },
  data() {
    return {
      queryParam: { pageNum: 1, pageSize: 12 },
      loading: false,
      videoList: [],
      total: 0,
      title: "",
      isType: "",
      coreParams: {},
      zhuyeModalVisible: false,
      currentZhuyeUrl: "",
    };
  },
  watch: {
    visible(newVal) {
      if (!newVal) {
        this.videoList = [];
        this.total = 0;
        this.isType = "";
        this.queryParam.pageNum = 1;
        this.coreParams = {};
      }
    },
  },
  methods: {
    async getListByParams(type, id) {
      let data = {};
      this.isType = type;
      if (type == 1) {
        data.vUid = id;
        this.title = "人员信息列表";
      } else if (type == 2) {
        data.aVId = id;
        this.title = "人员信息列表";
      } else if (type == 3) {
        data.douyinId = id;
        this.title = "人员信息列表";
      } else if (type == 4) {
        data.douyinId = id;
        this.title = "粉丝列表";
      } else if (type == 5) {
        data.douyinId = id;
        this.title = "关注列表";
      } else if (type == 6) {
        data.userDouyin = id;
        data.status = "1";
        this.title = "关联人员列表";
      }
      this.coreParams = data;
      this.queryParam.pageNum = 1;
      await this.getVideoList();
    },
    async getVideoList() {
      this.loading = true;
      try {
        const requestParams = { ...this.coreParams, ...this.queryParam };
        let res;
        if (this.isType == 1) res = await accountContentList(requestParams);
        else if (this.isType == 2)
          res = await addressAccountContent(requestParams);
        else if (this.isType == 3) res = await accountListByDid(requestParams);
        else if (this.isType == 4) res = await accountListByFans(requestParams);
        else if (this.isType == 5)
          res = await accountListByFollow(requestParams);
        else if (this.isType == 6)
          res = await accountCommentList(requestParams);

        if (this.isType == 6) {
          this.videoList = res.rows.map((comment) => ({
            ...comment,
            userInfo: {
              nickname: comment.nickname || "匿名用户",
              touxiang: comment.touxiang || "",
              id: comment.id || "",
              region: comment.region || "",
              follow_count: comment.followCount || 0,
              fans_count: comment.fansCount || 0,
              likes_count: 0,
              douyinId: comment.userUid,
              profile_text: comment.profileText || "",
              zhuye: comment.zhuye || "",
              status: comment.status,
            },
            loadingAllVideo: false,
          }));
        } else {
          this.videoList = (res.rows || []).map((item) => {
            let userInfo = {};
            try {
              userInfo = JSON.parse(item.jsonString);
            } catch (e) {}
            return { ...item, userInfo, loadingAllVideo: false };
          });
        }
        this.total = res.total || 0;
      } catch (err) {
        this.videoList = [];
        message.error("获取数据失败");
      } finally {
        this.loading = false;
      }
    },
    changeSize(pageNum) {
      this.queryParam.pageNum = pageNum;
      this.getVideoList();
    },
    getUrl(url) {
      if (!url) return "";
      return window.origin + process.env.VUE_APP_BASE_API + url;
    },
    getShortNickname(nickname) {
      if (!nickname) return "匿";
      return nickname.length > 2 ? nickname.substring(0, 2) : nickname;
    },
    handleCancel() {
      this.$emit("update:visible", false);
    },
    openZhuyeModal(video) {
      this.currentZhuyeUrl = this.getUrl(video.zhuye || video.userInfo?.zhuye);
      this.zhuyeModalVisible = true;
    },
    handleImageError() {
      this.currentZhuyeUrl = "";
      message.warning("图片加载失败");
    },
    async getAllVideos(item) {
      let data = {
        devId: item.devId,
        douyinId: item.douyinId,
        taskId: 4,
        tags: "视频,基本信息,评论",
        userId: item.accountName,
      };
      tags(data).then(() => {
        this.getVideoList();
        this.$notification.success({ message: "任务已启动" });
      });
    },
    openUserDetail(item) {
      if(!item.douyinId) return this.$message.error('抖音号不存在！')
      const routeData = this.$router.resolve({
        name: "basicDetailPage",
        query: {
          devId: item.devId,
          douyinId: item.douyinId,
          type: "1",
        },
      });

      // 打开新标签页
      window.open(routeData.href, "_blank");
    },
  },
};
</script>

<style>
.video-list-modal__wrap .ant-modal {
  top: 18px;
  padding-bottom: 18px;
}

.video-list-modal__wrap .ant-modal-content {
  overflow: hidden;
  border: 1px solid rgba(191, 219, 254, 0.9);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.18);
}

.video-list-modal__wrap .ant-modal-header {
  padding: 18px 24px;
  border-bottom: 1px solid rgba(219, 234, 254, 0.92);
  background:
    radial-gradient(circle at 8% 0%, rgba(59, 130, 246, 0.12), transparent 34%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(239, 246, 255, 0.92));
}

.video-list-modal__wrap .ant-modal-title {
  color: #102a43;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.video-list-modal__wrap .ant-modal-close-x {
  color: #64748b;
  font-size: 18px;
}

.video-list-modal__wrap .ant-modal-body {
  max-height: calc(100vh - 124px);
  padding: 22px 24px 20px;
  overflow-y: auto;
  background:
    radial-gradient(circle at 12% 0%, rgba(59, 130, 246, 0.1), transparent 30%),
    linear-gradient(180deg, #f8fbff 0%, #ffffff 45%, #f6faff 100%);
}

.video-list-modal__wrap .video-list__card-wrap .ant-card-body {
  height: 100%;
  padding: 0 !important;
}

.video-list-modal__wrap .ant-card-hoverable:hover {
  border-color: rgba(37, 99, 235, 0.4);
  box-shadow: 0 18px 44px rgba(37, 99, 235, 0.13);
}
</style>

<style lang="less" scoped>
.video-list-modal__root {
  width: 100%;
}

.video-list-modal__content {
  min-height: 360px;
}

/* 核心：卡片容器自动等高布局 */
.video-list__card-wrap {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  width: 100%;
}

/* 关键：所有卡片自动撑满同一行最大高度 */
.video-list__video-card {
  display: flex; /* 让子元素撑满高度 */
  flex-direction: column;
  position: relative;
  width: 100%;
  min-width: 0;
  min-height: 224px;
  overflow: hidden;
  border: 1px solid rgba(191, 219, 254, 0.78);
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.96) 0%, rgba(248, 251, 255, 0.94) 56%, rgba(236, 245, 255, 0.88) 100%);
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.06);
  transition: border-color 0.22s ease, box-shadow 0.22s ease, transform 0.22s ease;

  &::before {
    position: absolute;
    inset: 0;
    pointer-events: none;
    content: "";
    background:
      radial-gradient(circle at 18% 0%, rgba(59, 130, 246, 0.14), transparent 30%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.36), transparent 46%);
  }

  &:hover {
    transform: translateY(-2px);
  }
}

/* 内容区域撑满卡片高度 */
.video-card__author-info {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 核心布局：内容自动撑满，按钮永远贴在最底部 */
.author-info__container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 224px;
  padding: 18px 12px 12px;
}

.author-info__inner {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  justify-content: space-between;
}

.author-info__avatar {
  flex-shrink: 0;
  overflow: hidden;
  border: 3px solid rgba(255, 255, 255, 0.92);
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.12);
}
.author-info__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
}

/* 底部按钮：整行统一高度、永远对齐 */
.author-info__bottom-actions {
  display: flex;
  gap: 8px;
  width: 100%;
  margin-top: 16px;
  padding-top: 13px;
  border-top: 1px solid rgba(226, 232, 240, 0.86);
}

.author-info__bottom-actions .ant-btn {
  display: inline-flex;
  flex: 1 1 0;
  align-items: center;
  justify-content: center;
  min-width: 0;
  height: 32px;
  border-radius: 10px;
  box-shadow: none;
  font-size: 13px;
  font-weight: 700;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease, background 0.2s ease, transform 0.2s ease;
}

.author-info__bottom-actions .ant-btn:hover {
  transform: translateY(-1px);
}

.author-info__bottom-actions .ant-btn-primary.ant-btn-background-ghost {
  color: #2563eb;
  background: rgba(255, 255, 255, 0.74);
  border-color: rgba(37, 99, 235, 0.48);
}

.author-info__bottom-actions .ant-btn-primary.ant-btn-background-ghost:hover {
  color: #1d4ed8;
  background: rgba(239, 246, 255, 0.95);
  border-color: rgba(37, 99, 235, 0.75);
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.1);
}

.author-info__bottom-actions .ant-btn-primary:not(.ant-btn-background-ghost) {
  color: #ffffff;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  border-color: transparent;
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.18);
}

.author-info__bottom-actions .ant-btn-primary:not(.ant-btn-background-ghost):hover {
  background: linear-gradient(135deg, #1d4ed8, #2563eb);
  box-shadow: 0 10px 22px rgba(37, 99, 235, 0.24);
}

.author-info__row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
}
.author-info__top {
  min-height: 26px;

  .author-info__nickname {
    max-width: 190px;
    overflow: hidden;
    color: #172554;
    font-size: 16px;
    font-weight: 700;
    line-height: 1.35;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .author-info__realname {
    font-size: 12px;
    color: #64748b;
  }
  .author-info__douyin-id {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    max-width: 150px;
    overflow: hidden;
    font-size: 12px;
    font-weight: 700;
    line-height: 1.2;
    color: #007aff;
    text-overflow: ellipsis;
    white-space: nowrap;
    background: rgba(219, 234, 254, 0.8);
    border: 1px solid rgba(191, 219, 254, 0.8);
    padding: 3px 7px;
    border-radius: 7px;
  }
}
.author-info__middle {
  .author-info__region {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.3;
    color: #475569;
    background: rgba(248, 250, 252, 0.92);
    border: 1px solid rgba(226, 232, 240, 0.9);
    padding: 3px 9px;
    border-radius: 999px;
  }
}
.author-info__profile {
  align-items: flex-start;
  font-size: 13px;
  line-height: 1.55;
  color: #475569;
  .profile-label {
    flex-shrink: 0;
    font-weight: 700;
    color: #94a3b8;
  }
  .profile-text {
    display: -webkit-box;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    color: #334155;
    word-break: break-word;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
}
.author-info__meta {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  .meta-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;

    .anticon {
      color: #64748b;
    }
  }
}

/* 评论数：右侧固定 */
.author-info__comment-count {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 76px;
  height: 68px;
  background: linear-gradient(160deg, rgba(239, 246, 255, 0.98), rgba(221, 235, 255, 0.92));
  border: 1px solid rgba(219, 234, 254, 0.95);
  border-radius: 13px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
  .count-num {
    font-size: 24px;
    font-weight: 800;
    line-height: 1;
    color: #2563eb;
  }
  .count-label {
    margin-top: 5px;
    font-size: 12px;
    font-weight: 700;
    color: #2563eb;
  }
}

.video-list__empty {
  text-align: center;
  padding: 58px 0;
  background: rgba(255, 255, 255, 0.66);
  border: 1px dashed rgba(191, 219, 254, 0.9);
  border-radius: 18px;
}
.video-list__pagination {
  text-align: right;
  margin-top: 18px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(219, 234, 254, 0.78);
  border-radius: 14px;
}
.zhuye-preview-container {
  width: 100%;
  min-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;


  .image-wrapper {
    width: 100%;
    background: #f8f9fa;
    display: flex;
    align-items: center;
    justify-content: center;
    .zhuye-image {
      max-width: 100%;
      max-height: 80vh;
      object-fit: contain;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }
  }
  .empty-image {
    padding: 60px 0;
    width: 100%;
  }
}

@media (max-width: 1440px) {
  .video-list__card-wrap {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 920px) {
  .video-list__card-wrap {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .video-list__video-card {
    width: 100%;
  }
  .author-info__inner {
    flex-direction: column;
    align-items: flex-start;
  }
  .author-info__bottom-actions {
    flex-direction: column;
  }
}
</style>

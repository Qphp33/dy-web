<template>
  <div class="video-list-modal__root">
    <a-modal
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
.card .ant-card-body {
  height: 100%;
  padding: 12px !important;
}
</style>

<style lang="less" scoped>
.video-list-modal__root {
  width: 100%;
}

/* 核心：卡片容器自动等高布局 */
.video-list__card-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  width: 100%;
}

/* 关键：所有卡片自动撑满同一行最大高度 */
.video-list__video-card {
  width: calc(33.333% - 14px);
  min-width: 380px;
  border-radius: 8px;
  display: flex; /* 让子元素撑满高度 */
  flex-direction: column;
}

/* 内容区域撑满卡片高度 */
.video-card__author-info {
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
}

.author-info__inner {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  justify-content: space-between;
}

.author-info__avatar {
  flex-shrink: 0;
  border: 1px solid #eee;
}
.author-info__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

/* 底部按钮：整行统一高度、永远对齐 */
.author-info__bottom-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f5f5f5;
  width: 100%;
}

.author-info__row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.author-info__top {
  .author-info__nickname {
    font-size: 16px;
    font-weight: 500;
  }
  .author-info__realname {
    font-size: 12px;
    color: #999;
  }
  .author-info__douyin-id {
    font-size: 12px;
    color: #007aff;
    background: #f0f8ff;
    padding: 2px 6px;
    border-radius: 4px;
  }
}
.author-info__middle {
  .author-info__region {
    font-size: 12px;
    color: #666;
    background: #f5f7fa;
    padding: 2px 8px;
    border-radius: 4px;
  }
}
.author-info__profile {
  font-size: 13px;
  color: #666;
  .profile-label {
    font-weight: 500;
    color: #999;
  }
}
.author-info__meta {
  font-size: 12px;
  color: #666;
  .meta-item {
    display: inline-flex;
    align-items: center;
    gap: 3px;
  }
}

/* 评论数：右侧固定 */
.author-info__comment-count {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 75px;
  height: 68px;
  background: #e6f7ff;
  border-radius: 8px;
  flex-shrink: 0;
  .count-num {
    font-size: 24px;
    font-weight: bold;
    color: #1890ff;
  }
  .count-label {
    font-size: 12px;
    color: #40a9ff;
  }
}

.video-list__empty {
  text-align: center;
  padding: 40px 0;
}
.video-list__pagination {
  text-align: right;
  margin-top: 16px;
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
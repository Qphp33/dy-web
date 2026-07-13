<template>
  <div class="video-comment-modal-wrap">
    <div class="video-card__content">
      <!-- 左侧视频区域 -->
      <div class="video-card__left">
        <!-- 视频播放区域 -->
        <div class="video-card__player-wrap" v-if="video && video.videoPath">
          <div class="video-player-container">
            <video
              :id="`video-player-${video.uid || video.id}`"
              class="video-js vjs-big-play-centered"
              controls
              preload="auto"
              :poster="video.imagePath ? getUrl(video.imagePath) : ''"
            >
              <source :src="getUrl(video.videoPath)" type="video/mp4" />
              您的浏览器不支持HTML5视频播放
            </video>
          </div>
        </div>
        <!-- 视频信息 -->
        <div class="video-card__info" v-if="video">
          <h3 class="video-info__title" :title="video.title || ''">
            {{ video.title || "" }}
          </h3>
          <div class="video-info__stats">
            <span class="stats__item">
              <a-icon type="like" />
              {{ video.jsonString?.likes || 0 }} 点赞
            </span>
            <span class="stats__item">
              <a-icon type="message" />
              {{ video.jsonString?.comments || 0 }} 评论
            </span>
            <span class="stats__item">
              <a-icon type="share-alt" />
              {{ video.jsonString?.shares || 0 }} 分享
            </span>
            <span class="stats__item">
              <a-icon type="check-square" />
              {{ video.jsonString?.collects || 0 }} 收藏
            </span>
          </div>
        </div>
      </div>

      <!-- 右侧评论区 -->
      <div class="video-card__right">
        <div class="video-comment__header">
          <div>
            <a-icon type="message" />
            <span style="margin-left: 7px"
              >全部评论
              {{
                video.comments.length > 0
                  ? " (" + video.comments.length + ")"
                  : ""
              }}</span
            >
          </div>
          <div class="btn_box" v-if="video.comments.length > 0">
            <a
              href="javascript:;"
              rel="noopener noreferrer"
              @click="openUserDetails(video)"
            >
              评论人员信息
            </a>
          </div>
        </div>

        <div class="video-comment__scroll">
          <div
            class="video-comment__list"
            v-if="Array.isArray(video.comments) && video.comments.length > 0"
          >
            <div
              v-for="(comment, cIndex) in getLoadedComments()"
              :key="`comment-${video.uid || video.id}-${cIndex}`"
              class="video-comment__item"
            >
              <!-- 修复1：头像的事件调用 - 参数顺序统一 -->
              <a-avatar
                v-if="comment.touxiang"
                :size="24"
                :style="{
                  color: '#fff',
                }"
                @click.stop="goDetailPage(comment, video)"
                :src="getUrl(comment.touxiang)"
                @mouseenter="showUserTooltip(comment, video.devId, $event)"
                @mouseleave="hideUserTooltipDelay"
                class="comment-user-avatar"
              >
              </a-avatar>

              <a-avatar
                v-else
                :size="24"
                :style="{
                  backgroundColor: getRandomColor(comment.id),
                  color: '#fff',
                }"
                @click.stop="goDetailPage(comment, video)"
                @mouseenter="showUserTooltip(comment, video.devId, $event)"
                @mouseleave="hideUserTooltipDelay"
                class="comment-user-avatar"
              >
                {{ getShortNickname(comment.nickname) }}
              </a-avatar>
              <div class="comment-item__content">
                <div class="comment-item__header">
                  <!-- 修复2：用户名的事件调用 - 移除多余的video.video参数 -->
                  <span
                    class="comment-item__username"
                    @mouseenter="showUserTooltip(comment, video.devId, $event)"
                    @mouseleave="hideUserTooltipDelay"
                    >{{ comment.nickname || "匿名用户" }}</span
                  >
                  <span class="comment-item__time">{{
                    comment.commentTime || "未知时间"
                  }}</span>
                </div>
                <div v-if="comment.replyTo" class="comment-item__quote">
                  <i class="el-icon-chat-line-round quote__icon"></i>
                  <span class="quote__label">@{{ comment.replyTo }}：</span>
                  <span class="quote__text">{{
                    getReplyContent(comment.replyTo)
                  }}</span>
                </div>
                <p class="comment-item__text">
                  {{ comment.commentText || "" }}
                </p>
              </div>
            </div>

            <div class="video-comment__load-more">
              <a-spin size="small" v-if="commentStatus.loading" />
              <a-button
                v-else-if="hasMoreComments"
                type="text"
                size="small"
                @click.stop="loadMoreComments"
                class="load-more__btn"
              >
                加载更多 <a-icon type="down-circle" theme="twoTone" />
              </a-button>
              <span v-else class="load-more__no-more">已加载全部评论</span>
            </div>
          </div>
          <div class="video-comment__empty" v-else>暂无评论~</div>
        </div>
      </div>
    </div>

    <!-- 悬浮窗部分保持不变 -->
    <div
      v-if="tooltipVisible"
      class="comment-user-tooltip"
      :class="{ 'has-screenshot': currentUserInfo.zhuye }"
      :style="{
        left: `${tooltipPosition.x}px`,
        top: `${tooltipPosition.y}px`,
        zIndex: 99999,
        position: 'fixed',
      }"
      @mouseenter="cancelHideUserTooltip"
      @mouseleave="hideUserTooltipDelay"
    >
      <!-- 浮窗内容保持不变 -->
      <div class="tooltip-header">
        <div class="tooltip-header__left">
          <div class="tooltip-avatar-row">
            <a-avatar
              v-if="currentUserInfo.touxiang"
              :size="62"
              :style="{ color: '#fff' }"
              :src="getUrl(currentUserInfo.touxiang)"
              class="comment-user-avatar"
            ></a-avatar>
            <div v-else class="tooltip-avatar">
              {{ getShortNickname(currentUserInfo.nickname) }}
            </div>
            <div class="tooltip-user-basic">
              <div class="tooltip-username">
                {{ currentUserInfo.nickname || "匿名用户" }}
                <span
                  class="author-info__douyin-id"
                  v-if="currentUserInfo.douyinId"
                >
                  <a-icon type="idcard" size="small" />
                  {{ currentUserInfo.douyinId }}
                </span>
              </div>
              <p class="base-info__profile" v-if="currentUserInfo.profile_text">
                <span class="base-info__label">简介：</span>
                <span class="base-info__text">{{
                  currentUserInfo.profile_text || "暂无简介"
                }}</span>
              </p>
              <div class="tooltip-user-id" v-if="currentUserInfo.ip">
                {{ currentUserInfo.ip }}
              </div>
            </div>
          </div>

          <div class="tooltip-stats-card">
            <div class="tooltip-stats-row">
              <div class="stats-item">
                <div class="stats-icon-wrapper">
                  <a-icon type="star" class="stats-icon follow-icon" />
                </div>
                <div class="stats-content">
                  <span class="stats-label">关注数</span>
                  <span class="stats-value">{{
                    currentUserInfo.follow_count || 0
                  }}</span>
                </div>
              </div>
              <div class="stats-item divider"></div>
              <div class="stats-item">
                <div class="stats-icon-wrapper">
                  <a-icon type="user-add" class="stats-icon fans-icon" />
                </div>
                <div class="stats-content">
                  <span class="stats-label">粉丝数</span>
                  <span class="stats-value">{{
                    currentUserInfo.fansCount || 0
                  }}</span>
                </div>
              </div>
              <div class="stats-item divider"></div>
              <div class="stats-item">
                <div class="stats-icon-wrapper">
                  <a-icon type="video-camera" class="stats-icon work-icon" />
                </div>
                <div class="stats-content">
                  <span class="stats-label">作品数</span>
                  <span class="stats-value">{{
                    currentUserInfo.works_count || 0
                  }}</span>
                </div>
              </div>
            </div>
          </div>

          <div
            class="tooltip-header__btn-wrap"
            v-if="currentUserInfo.status == 0"
          >
            <a-button
              type="primary"
              size="small"
              @click="getAllVideo(currentUserInfo)"
              :disabled="!currentUserInfo.douyinId"
            >
              <a-icon type="video-camera" /> 获取全部视频
            </a-button>
          </div>
        </div>

        <div
          class="tooltip-header__right"
          :class="{ 'has-screenshot': currentUserInfo.zhuye }"
        >
          <div class="tooltip-screenshot__wrap" v-if="currentUserInfo.zhuye">
            <img
              :src="getUrl(currentUserInfo.zhuye)"
              alt="用户截图"
              class="tooltip-screenshot__img"
              @error="handleImgError"
              @click="previewUserScreenshot()"
            />
          </div>
        </div>
      </div>
      <div class="tooltip-footer"></div>
    </div>

    <VideoListModal
      ref="videoListModalRef"
      :visible.sync="videoListModalVisible"
    />
  </div>
</template>

<script>
import videojs from "video.js";
import "video.js/dist/video-js.css";
import VideoListModal from "@/components/VideoListModal";
import { tags, updateComment } from "@/api/module/Basic";
export default {
  name: "VideoCommentModalItem",
  components: { VideoListModal },

  props: {
    video: {
      type: Object,
      required: false,
      default: () => ({
        comments: [],
        jsonString: {},
        uid: new Date().getTime(),
      }),
    },
    videoIndex: {
      type: Number,
      required: false,
      default: 0,
    },
    commentLoadedStatus: {
      type: Object,
      required: false,
      default: () => ({}),
    },
  },
  data() {
    return {
      player: null,
      tooltipVisible: false,
      tooltipPosition: { x: 0, y: 0 },
      currentUserInfo: {},
      videoListModalVisible: false,
      tooltipHideTimer: null, // 修复3：初始化定时器变量
    };
  },
  mounted() {
    this.$nextTick(() => {
      this.initVideoPlayer();
    });
  },
  beforeUnmount() {
    if (this.player && this.player.dispose) {
      this.player.dispose();
      this.player = null;
    }
    // 修复4：清除定时器，防止内存泄漏
    clearTimeout(this.tooltipHideTimer);
  },
  computed: {
    commentStatus() {
      const defaultStatus = {
        loading: false,
        loadedCount: 10,
        pageSize: 10,
        total: 0,
      };
      return this.commentLoadedStatus[this.videoIndex] || defaultStatus;
    },
    hasMoreComments() {
      const status = this.commentLoadedStatus[this.videoIndex] || {
        loadedCount: 0,
        total: 0,
      };
      return status.loadedCount < status.total;
    },
  },
  methods: {
    initVideoPlayer() {
      if (this.player && this.player.dispose) {
        this.player.dispose();
        this.player = null;
      }
      if (!this.video || !this.video.videoPath) return;
      const playerId = `video-player-${this.video.uid || this.video.id}`;
      const playerElement = document.getElementById(playerId);
      if (playerElement) {
        this.player = videojs(playerElement, {
          autoplay: false,
          controls: true,
          responsive: true,
          fluid: true,
          playbackRates: [0.5, 1, 1.5, 2],
          language: "zh-CN",
          controlBar: {
            volumePanel: { inline: false, vertical: true },
            currentTimeDisplay: true,
            durationDisplay: true,
            timeDivider: true,
            remainingTimeDisplay: false,
          },
          preload: "auto",
        });
        this.player.on("loadedmetadata", () => {
          this.player.controlBar.currentTimeDisplay.show();
          this.player.controlBar.durationDisplay.show();
          this.player.controlBar.timeDivider.show();
        });
      }
    },
    getLoadedComments() {
      if (
        !Array.isArray(this.video.comments) ||
        this.video.comments.length === 0
      )
        return [];
      const loadedCount = this.commentStatus.loadedCount || 10;
      return this.video.comments.slice(0, loadedCount);
    },
    loadMoreComments() {
      this.$emit("load-more-comments", this.videoIndex);
    },
    getUrl(url) {
      if (!url) return "";
      return window.origin + process.env.VUE_APP_BASE_API + url;
    },
    getRandomColor(id) {
      const colors = [
        "#fe2c55",
        "#ff6b35",
        "#ff9500",
        "#ffcc00",
        "#34c759",
        "#007aff",
        "#5856d6",
        "#af52de",
      ];
      return colors[Number(id) % colors.length];
    },

    goDetailPage(item, video) {
      if(!item.userUid) return this.$message.error('抖音号不存在！')
      const routeData = this.$router.resolve({
        name: "basicDetailPage",
        query: {
          devId: video.devId,
          douyinId: item.userUid,
          type: "1",
        },
      });
      // 打开新标签页
      window.open(routeData.href, "_blank");
    },
    getShortNickname(nickname) {
      if (!nickname) return "匿";
      return nickname.length > 2 ? nickname.substring(0, 2) : nickname;
    },
    getReplyContent(replyTo) {
      if (!Array.isArray(this.video.comments)) return "该评论已删除";
      const targetComment = this.video.comments.find(
        (item) => item.nickname === replyTo
      );
      if (targetComment) {
        return targetComment.commentText.length > 20
          ? targetComment.commentText.substring(0, 20) + "..."
          : targetComment.commentText;
      }
      return "该评论已删除";
    },
    // 修复5：方法参数注释明确，增加参数校验
    showUserTooltip(comment, devId, event) {
      // 关键：参数校验，防止event为undefined
      if (!event) {
        console.warn("事件对象未传递", comment);
        return;
      }

      // 清除之前的延迟隐藏定时器
      clearTimeout(this.tooltipHideTimer);

      // 赋值用户信息
      this.currentUserInfo = {
        nickname: comment.nickname || "匿名用户",
        touxiang: comment.touxiang || "",
        id: comment.id || "",
        ip: comment.region || "",
        follow_count: comment.followCount || 0,
        works_count: comment.worksCount || 0,
        fansCount: comment.fansCount || 0,
        douyinId: comment.douyinId || "",
        profile_text: comment.profileText || "",
        zhuye: comment.zhuye || "",
        douyinId: comment.userUid,
        status: comment.status,
        devId: devId || "",
      };

      // 初始位置（鼠标右侧下方）
      let initialX = event.clientX + 10;
      let initialY = event.clientY + 10;

      // 先显示悬浮窗（透明状态），用于获取尺寸
      this.tooltipVisible = true;
      this.tooltipPosition = { x: initialX, y: initialY };

      this.$nextTick(() => {
        const tooltipEl = document.querySelector(".comment-user-tooltip");
        if (!tooltipEl) return;

        // 获取关键尺寸
        const tooltipRect = tooltipEl.getBoundingClientRect();
        const tooltipWidth = tooltipRect.width;
        const tooltipHeight = tooltipRect.height;

        // 视口尺寸（不含滚动条）
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // 最终位置计算
        let finalX = initialX;
        let finalY = initialY;

        // ========== X轴位置修正 ==========
        // 右侧超出视口 → 向左偏移（鼠标左侧显示）
        if (finalX + tooltipWidth > viewportWidth) {
          finalX = event.clientX - tooltipWidth - 10;
        }
        // 左侧超出视口 → 强制贴左
        if (finalX < 0) {
          finalX = 10;
        }

        // ========== Y轴位置修正 ==========
        // 底部超出视口 → 向上偏移（鼠标上方显示）
        if (finalY + tooltipHeight > viewportHeight) {
          finalY = event.clientY - tooltipHeight - 10;
        }
        // 顶部超出视口 → 强制贴顶
        if (finalY < 0) {
          finalY = 10;
        }

        // 更新最终位置
        this.tooltipPosition = { x: finalX, y: finalY };

        // 确保悬浮窗重新渲染
        this.$forceUpdate();
      });
    },
    // 修复6：统一延迟隐藏方法，避免直接隐藏
    hideUserTooltipDelay() {
      this.tooltipHideTimer = setTimeout(() => {
        this.tooltipVisible = false;
        this.currentUserInfo = {};
      }, 300);
    },
    // 取消隐藏
    cancelHideUserTooltip() {
      clearTimeout(this.tooltipHideTimer);
    },
    // 移除原有的hideUserTooltip方法，统一使用hideUserTooltipDelay

    openUserDetails(video) {
      this.videoListModalVisible = true;
      this.$nextTick(() => {
        this.$refs.videoListModalRef.getListByParams("2", video.uid);
      });
    },
    getAllVideo(item) {
      
      let data = {
        devId: item.devId,
        douyinId: item.douyinId,
        taskId: 3,
        tags: "视频,基本信息,评论",
        userId: this.video.douyinId,
      };
      tags(data).then((response) => {
        updateComment({ userUid: item.douyinId, status: 1 });
        item.status = 1;

        this.video.comments.forEach((comment, commentIndex) => {
          if (comment.userUid == item.douyinId) {
            this.$set(this.video.comments[commentIndex], "status", 1);
          }
        });

        this.$forceUpdate();
        this.$notification.success({
          message:
            "获取全部视频的任务已启动，结果会同步更新，您可先进行其他操作",
        });
      });
    },
    handleImgError(e) {
      // 图片加载失败的处理
      e.target.src = "默认图片地址"; // 可替换为你的默认图片
    },
    previewUserScreenshot() {
      // 预览截图的逻辑
      console.log("预览用户截图", this.currentUserInfo.zhuye);
    },
  },
};
</script>

<style lang="less" scoped>
// 样式部分保持不变，已包含之前的优化
.video-comment-modal-wrap {
  width: 100%;
  height: 100%;
  max-height: 780px;
  overflow: hidden;
  box-sizing: border-box;
  background-color: #f7f8fa;
  position: relative;
  .video-js {
    min-height: 100% !important;
    height: 100% !important;
  }

  .video-card__content {
    display: flex;
    gap: 15px;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
  }

  .video-card__main {
    display: flex;
    flex-direction: row;
    gap: 15px;
    flex: 1;
    width: 100%;
    height: 100%;
  }

  .video-card__left {
    flex: 0 0 31%;
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: 100%;
    min-height: 780px;
    box-sizing: border-box;
    overflow: hidden;

    .video-card__player-wrap {
      flex: 1;
      min-height: 700px;
      width: 86%;
      border-radius: 8px;
      background-color: #000;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;

      .video-player-container {
        width: 100%;
        height: 100%;
      }

      .video-js {
        width: 100% !important;
        min-height: 700px;
        height: 100% !important;
        border-radius: 8px;
        overflow: hidden;
      }
      .vjs-tech,
      .vjs-poster {
        min-height: 700px;
        width: 100% !important;
        height: 100% !important;
      }
    }

    .video-card__info {
      flex-shrink: 0;
      width: 100%;
      box-sizing: border-box;
      padding: 0 2px;

      .video-info__title {
        font-size: 16px;
        color: #333;
        margin: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        line-height: 1.4;
      }

      .video-info__stats {
        display: flex;
        align-items: center;
        gap: 15px;
        font-size: 11px;
        color: #666;

        .stats__item {
          display: flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          transition: color 0.2s;
          &:hover {
            color: #007aff;
          }
        }
      }
    }
  }

  .video-card__right {
    flex: 0 0 68%;
    height: 100%;
    border-left: 1px solid #eee;
    padding: 0 15px;
    box-sizing: border-box;

    .video-comment__header {
      font-size: 13px;
      display: flex;
      justify-content: space-between;

      gap: 8px;
      width: 100%;
      flex-shrink: 0;
      color: #333;
      font-weight: 500;
    }
    .btn_box {
      float: right;
      margin-right: 16px;

      a {
        font-weight: 700;
        font-family: "Gill Sans", "Gill Sans MT", Calibri, "Trebuchet MS",
          sans-serif;
        text-decoration: underline;
        text-underline-offset: 4px;
        text-decoration-thickness: 1px;
        text-decoration-color: #1890ff;
      }
    }
    .video-comment__scroll {
      flex: 1;
      height: 740px;
      overflow-y: auto;
      padding-right: 5px;
      scrollbar-width: thin;
      scrollbar-color: #ddd #f5f5f5;
      box-sizing: border-box;

      &::-webkit-scrollbar {
        width: 6px;
      }
      &::-webkit-scrollbar-thumb {
        background-color: #ddd;
        border-radius: 3px;
      }
      &::-webkit-scrollbar-track {
        background-color: #f5f5f5;
        border-radius: 3px;
      }
    }

    .video-comment__list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 100%;
      padding: 4px 0;
    }

    .video-comment__item {
      display: flex;
      gap: 8px;
      padding: 4px 0;
      border-bottom: 1px solid #f5f5f5;
      padding-bottom: 8px;
      align-items: flex-start;

      .comment-user-avatar {
        flex-shrink: 0;
        margin-top: 2px;
        cursor: pointer;
      }

      .comment-item__content {
        flex: 1;
        width: calc(100% - 32px);

        .comment-item__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
          font-size: 12px;

          .comment-item__username {
            font-weight: 500;
            color: #333;
            cursor: pointer;
          }
          .comment-item__time {
            color: #999;
            font-size: 11px;
          }
        }

        .comment-item__quote {
          padding: 6px 10px;
          background-color: #f5f5f5;
          border-radius: 4px;
          margin-bottom: 4px;
          font-size: 12px;
          color: #666;
          line-height: 1.4;

          .quote__icon {
            color: #999;
            margin-right: 4px;
          }
          .quote__label {
            color: #007aff;
          }
        }

        .comment-item__text {
          font-size: 13px;
          color: #666;
          margin: 0;
          line-height: 1.4;
          word-wrap: break-word;
          white-space: pre-wrap;
        }
      }
    }

    .video-comment__load-more {
      padding: 10px 0;
      font-size: 12px;
      flex-shrink: 0;
      display: flex;
      justify-content: center;
      .load-more__btn {
        color: #007aff;
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 4px;
        &:hover {
          color: #0066cc;
        }
      }
      .load-more__no-more {
        color: #999;
      }
    }

    .video-comment__empty {
      text-align: center;
      padding: 30px 0;
      color: #999;
      font-size: 13px;
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .comment-user-tooltip {
    position: fixed !important;
    z-index: 99999 !important;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    padding: 0;
    min-width: 380px;
    max-width: calc(100vw - 20px);
    width: auto;
    max-height: calc(100vh - 20px);
    overflow: hidden !important;
    font-size: 12px;
    color: #333;
    transition: all 0.2s ease;
    transform: scale(0.98);
    opacity: 0;
    animation: tooltipFadeIn 0.2s ease forwards;
    cursor: default;
    @keyframes tooltipFadeIn {
      to {
        transform: scale(1);
        opacity: 1;
      }
    }
    &:after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
    }
    .tooltip-header {
      background: linear-gradient(135deg, #f8fbff 0%, #e8f4ff 100%);
      padding: 16px 20px;
      border-radius: 12px 12px 0 0;
      display: flex;
      align-items: flex-start;
      gap: 20px;
      border-bottom: 1px solid #e5eef7;
      max-height: calc(100vh - 24px);
      overflow: hidden;

      .tooltip-header__left {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 16px;
        min-width: 350px;
        max-width: calc(100vw - 240px - 40px);

        .tooltip-avatar-row {
          display: flex;
          align-items: center;
          gap: 12px;

          .tooltip-avatar {
            width: 62px;
            height: 62px;
            border-radius: 50%;
            background: #007aff;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: 600;
            box-shadow: 0 2px 8px rgba(0, 122, 255, 0.2);
          }

          .tooltip-user-basic {
            flex: 1;

            .tooltip-username {
              font-size: 15px;
              font-weight: 600;
              color: #1a1a1a;
              margin-bottom: 6px;
              display: block;

              .author-info__douyin-id {
                font-size: 11px;
                color: #007aff;
                display: inline-flex;
                align-items: center;
                gap: 2px;
                vertical-align: middle;
                background: #f0f8ff;
                padding: 2px 6px;
                border-radius: 4px;
                line-height: 1.2;
                margin-left: 8px;
              }
            }

            .base-info__profile {
              font-size: 12px;
              color: #666;
              margin: 6px 0;
              line-height: 1.4;

              .base-info__label {
                color: #888;
                font-weight: 500;
                margin-right: 4px;
              }
            }

            .tooltip-user-id {
              font-size: 11px;
              color: #888;
              margin-top: 4px;
            }
          }
        }

        .tooltip-stats-card {
          background: #fff;
          border-radius: 8px;
          padding: 12px 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          border: 1px solid #f0f5ff;

          .tooltip-stats-row {
            display: flex;
            justify-content: space-around;
            align-items: center;
            gap: 8px;

            .stats-item {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 6px;
              flex: 1;
              padding: 8px 0;

              &.divider {
                width: 1px;
                height: 40px;
                background: #e5eef7;
                flex: none;
                padding: 0;
              }

              .stats-icon-wrapper {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;

                &:has(.follow-icon) {
                  background: #f0f8ff;
                }
                &:has(.fans-icon) {
                  background: #f0fff4;
                }
                &:has(.work-icon) {
                  background: #fff7f0;
                }
              }

              .stats-icon {
                font-size: 18px;

                &.follow-icon {
                  color: #007aff;
                }
                &.fans-icon {
                  color: #36c768;
                }
                &.work-icon {
                  color: #ff9500;
                }
              }

              .stats-content {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 2px;

                .stats-label {
                  font-size: 11px;
                  color: #888;
                  font-weight: 400;
                }

                .stats-value {
                  font-size: 14px;
                  font-weight: 600;
                  color: #1a1a1a;
                  &:hover {
                    color: #007aff;
                    transition: color 0.2s;
                  }
                }
              }
            }
          }
        }

        .tooltip-header__btn-wrap {
          text-align: center;

          button {
            padding: 0 16px;
            border-radius: 6px;
          }
        }
      }

      .tooltip-header__right {
        flex: 0 0 300px !important;
        width: 300px !important;
        display: none;

        &.has-screenshot {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .tooltip-screenshot__wrap {
          width: 100%;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

          .tooltip-screenshot__img {
            width: 100%;
            height: auto;
            object-fit: contain;
            object-position: center;
            cursor: zoom-in;
            transition: transform 0.2s;

            &:hover {
              transform: scale(1.02);
            }
          }
        }
      }
    }

    .tooltip-footer {
      height: 4px;
      background: linear-gradient(90deg, #007aff 0%, #5856d6 100%);
      border-radius: 0 0 12px 12px;
    }
  }
}

@media (max-width: 1200px) {
  .video-comment-modal-wrap {
    max-height: unset;
    height: auto;

    .video-card__main {
      flex-direction: column;
    }
    .video-card__left,
    .video-card__right {
      flex: none;
      width: 100%;
    }
    .video-card__right {
      border-left: none;
      border-top: 1px solid #eee;
      padding: 15px 0 0 0;
      margin-top: 15px;
    }

    .comment-user-tooltip {
      min-width: 240px;
      max-width: 280px;
    }
  }
}
</style>
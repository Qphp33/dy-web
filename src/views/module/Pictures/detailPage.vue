<template>
  <div class="video-list-container">
    <!-- 头部卡片区域 -->
    <div class="video-list__page-header">
      <!-- 抖音风格地区卡片 -->
      <a-card
        class="video-list__douyin-card"
        v-show="isRegion && accountInfo.id"
        hoverable
      >
        <div class="douyin-card__content">
          <!-- 左侧：地区详情 -->
          <div class="douyin-card__left">
            <div class="douyin-card__region-header">
              <div class="region-header__avatar-wrap">
                <div class="avatar-wrap__decoration"></div>
                <a-avatar
                  :size="80"
                  icon="environment"
                  :style="{
                    backgroundColor: '#fe2c55',
                    boxShadow: '0 0 15px rgba(254, 44, 85, 0.3)',
                    border: '3px solid #fff',
                  }"
                ></a-avatar>
              </div>

              <div class="region-header__title-wrap">
                <h3 class="title-wrap__title">
                  {{ parsedAccountJson.address || "未知地区" }}
                  <span class="title-wrap__area-code">{{
                    parsedAccountJson.area_code
                      ? " (" + parsedAccountJson.area_code + ")"
                      : ""
                  }}</span>
                  <span
                    v-if="parsedAccountJson.is_official"
                    class="title-wrap__official-tag"
                  >
                    <i class="iconfont icon-certified"></i>
                    官方
                  </span>
                </h3>

                <div class="title-wrap__score">
                  <div class="score__stars">
                    <i class="iconfont icon-star score__star--filled"></i>
                    <i class="iconfont icon-star score__star--filled"></i>
                    <i class="iconfont icon-star score__star--filled"></i>
                    <i class="iconfont icon-star score__star--filled"></i>
                    <i
                      class="iconfont icon-star"
                      :class="{
                        'score__star--filled': parsedAccountJson.score >= 4,
                      }"
                    ></i>
                  </div>
                  <span class="score__value">{{
                    parsedAccountJson.score || "暂无评分"
                  }}</span>
                  <span class="score__outof">/5.0</span>
                </div>

                <div class="title-wrap__tags">
                  <span
                    class="tags__item tags__item--hot"
                    v-if="parsedAccountJson.hot_score > 900"
                  >
                    <i class="iconfont icon-hot"></i>
                    热门地区
                  </span>
                  <span
                    class="tags__item tags__item--new"
                    v-if="parsedAccountJson.is_new"
                  >
                    <i class="iconfont icon-new"></i>
                    新晋地区
                  </span>
                </div>
              </div>
            </div>

            <div class="douyin-card__region-img">
              <div class="region-img__wrapper">
                <img
                  :src="getUrl(parsedAccountJson.address_image)"
                  alt="地区展示图"
                  class="region-img__content"
                />
              </div>

              <!-- hover遮罩（可选，保留交互） -->
              <div class="region-img__mask">
                <span>{{ parsedAccountJson.address || "地区展示图" }}</span>
              </div>
            </div>

            <!-- <div class="douyin-card__region-stats">
              <div class="region-stats__header">
                <h4 class="region-stats__title">
                  <i class="iconfont icon-chart"></i>
                  数据概览
                </h4>
              </div>

              <div class="region-stats__grid">
                <div class="stats-grid__item">
                  <div class="stats-grid__icon stats-grid__icon--works">
                    <i class="iconfont icon-video"></i>
                  </div>
                  <span class="stats-grid__label">作品总数</span>
                  <span class="stats-grid__value">{{
                    parsedAccountJson.works_count || 0
                  }}</span>
                  <div
                    class="stats-grid__trend"
                    v-if="parsedAccountJson.works_trend === 'up'"
                  >
                    <i class="iconfont icon-up"></i>
                    <span>增长中</span>
                  </div>
                </div>
                <div class="stats-grid__item">
                  <div class="stats-grid__icon stats-grid__icon--comment">
                    <i class="iconfont icon-comment"></i>
                  </div>
                  <span class="stats-grid__label">评论总数</span>
                  <span class="stats-grid__value">{{
                    parsedAccountJson.comments_count || 0
                  }}</span>
                  <div
                    class="stats-grid__trend"
                    v-if="parsedAccountJson.comments_trend === 'up'"
                  >
                    <i class="iconfont icon-up"></i>
                    <span>增长中</span>
                  </div>
                </div>
              </div>
            </div> -->
          </div>

          <!-- 右侧：抖音风格评论区 -->
          <div class="douyin-card__right">
            <div class="douyin-comment__header">
              <div class="douyin-comment__title">
                <i class="iconfont icon-comment"></i>
                <span
                  >全部评论 ({{
                    parsedAccountJson.comments?.length || 0
                  }})</span
                >
              </div>
            </div>

            <!-- 评论滚动容器 -->
            <div class="douyin-comment__scroll">
              <div
                class="douyin-comment__list"
                v-if="parsedAccountJson.comments?.length > 0"
              >
                <div
                  v-for="(comment, cIndex) in getLoadedRegionComments()"
                  :key="cIndex"
                  class="douyin-comment__item"
                >
                  <a-avatar
                    :size="32"
                    :style="{
                      backgroundColor: getRandomColor(comment.id || cIndex),
                      color: '#fff',
                    }"
                  >
                    {{ getCommentNickname(comment) }}
                  </a-avatar>
                  <div class="comment-item__main">
                    <div class="comment-item__user-info">
                      <span class="user-info__username">
                        {{ getCommentNickname(comment, false) }}
                      </span>
                      <span class="user-info__time">{{
                        getCommentTime(comment)
                      }}</span>
                    </div>
                    <div class="comment-item__text">
                      {{ comment.content || "" }}
                    </div>
                  </div>
                </div>

                <div class="douyin-comment__load-more">
                  <a-spin size="small" v-if="regionCommentStatus.loading" />
                  <a-button
                    v-else-if="hasMoreRegionComments()"
                    type="text"
                    size="small"
                    @click.stop="loadMoreRegionComments()"
                    class="load-more__btn"
                  >
                    加载更多评论
                  </a-button>
                  <span v-else class="load-more__no-more">已加载全部评论</span>
                </div>
              </div>
              <div class="douyin-comment__empty" v-else>
                <i class="iconfont icon-empty"></i>
                <p>暂无评论</p>
              </div>
            </div>
          </div>
        </div>
      </a-card>

      <!-- 原有用户详情卡片 -->
      <a-card
        class="video-list__user-card"
        v-show="userInfo.nickname"
        hoverable
      >
        <div class="user-card__wrap">
          <div class="user-card__avatar">
            <a-avatar :size="120" :src="getUrl(userInfo.touxiang)"></a-avatar>
          </div>
          <div class="user-card__base-info">
            <h3 class="base-info__nickname">
              {{ userInfo.nickname || "未知用户" }}
              <span style="color: purple; font-size: 14px"
                >{{ userInfo.real_name ? " (" + userInfo.real_name + ")" : "" }}
              </span>
            </h3>
            <p class="base-info__gender" v-if="userInfo.gender">
              {{ userInfo.gender }}
            </p>
            <div class="base-info__meta">
              <span class="meta__item">
                <a-icon type="user-add" /> 关注数：{{
                  userInfo.follow_count || "未知"
                }}
              </span>
              <span class="meta__item">
                <a-icon type="star" /> 粉丝数：{{
                  userInfo.fans_count || "未知"
                }}
              </span>
              <span class="meta__item">
                <a-icon type="like" /> 获赞数：{{
                  userInfo.likes_count || "未知"
                }}
              </span>
            </div>
          </div>
          <div class="user-card__stats">
            <div class="stats__item">
              <span class="stats__label">作品数</span>
              <span class="stats__value">{{
                userInfo.works_count || "未知"
              }}</span>
            </div>
            <div class="stats__item">
              <span class="stats__label">IP属地</span>
              <span class="stats__value">{{ userInfo.region || "未知" }}</span>
            </div>
            <div class="stats__item">
              <span class="stats__label">个性签名</span>
              <span class="stats__value">{{ userInfo.signature || "无" }}</span>
            </div>
          </div>
        </div>
      </a-card>
    </div>

    <!-- 视频列表区域 -->
    <a-spin :spinning="loading">
      <div class="video-list__card-wrap">
        <a-card
          v-for="(video, index) in videoList"
          :key="`video-${video.id}-${index}`"
          class="video-list__video-card"
          hoverable
        >
          <div class="video-card__author-info" v-if="video.userInfo?.nickname">
            <div class="author-info__inner">
              <a-avatar
                :size="36"
                :src="getUrl(video.userInfo?.touxiang || video.touxiang)"
                :style="{
                  backgroundColor: getRandomColor(
                    video.id || video.userInfo?.id
                  ),
                }"
              >
                {{
                  getShortNickname(
                    video.userInfo?.nickname || video.nickname || "匿"
                  )
                }}
              </a-avatar>
              <div class="author-info__base">
                <p class="author-info__nickname">
                  {{ video.userInfo?.nickname || video.nickname || "未知作者" }}
                  <span
                    v-if="video.userInfo?.real_name"
                    class="author-info__realname"
                  >
                    ({{ video.userInfo.real_name }})
                  </span>
                  <span class="author-info__region">
                    <a-icon type="environment" size="small" />
                    {{ video.userInfo?.region || video.region || "未知属地" }}
                  </span>
                </p>
                <div class="author-info__meta">
                  <span class="meta__item">
                    <a-icon type="user-add" size="small" />
                    {{ video.userInfo?.follow_count || 0 }} 关注
                  </span>
                  <span class="meta__item">
                    <a-icon type="star" size="small" />
                    {{ video.userInfo?.fans_count || 0 }} 粉丝
                  </span>
                  <span class="meta__item">
                    <a-icon type="like" size="small" />
                    {{ video.userInfo?.likes_count || 0 }} 获赞
                  </span>
                </div>
              </div>
            </div>
            <a-divider />
          </div>
          <div class="video-card__content">
            <div class="video-card__main">
              <!-- 左侧视频区域 -->
              <div class="video-card__left">
                <!-- 视频播放区域 - 核心修复 -->
                <div class="video-card__player-wrap">
                  <div
                    ref="playerContainer"
                    class="video-player-container"
                    :data-video-id="video.id"
                  >
                    <video
                      :id="`video-player-${video.id}`"
                      class="video-js vjs-big-play-centered"
                      controls
                      preload="auto"
                      :poster="getUrl(video.imagePath)"
                      width="100%"
                      height="100%"
                    >
                      <source :src="getUrl(video.videoPath)" type="video/mp4" />
                      您的浏览器不支持HTML5视频播放
                    </video>
                  </div>
                </div>

                <div class="video-card__info">
                  <h3 class="video-info__title" :title="video.title">
                    {{ video.title }}
                  </h3>
                  <div class="video-info__stats">
                    <span class="stats__item">
                      <a-icon type="like" />
                      {{ video.jsonString.likes }} 点赞
                    </span>
                    <span class="stats__item">
                      <a-icon type="message" />
                      {{ video.jsonString.comments }} 评论
                    </span>
                    <span class="stats__item">
                      <a-icon type="share-alt" />
                      {{ video.jsonString.shares }} 分享
                    </span>
                    <span class="stats__item">
                      <a-icon type="check-square" />
                      {{ video.jsonString.collects }} 收藏
                    </span>
                  </div>
                </div>
              </div>

              <!-- 右侧评论区 -->
              <div class="video-card__right">
                <div class="video-comment__header">
                  <a-icon type="message" />
                  <span
                    >全部评论
                    {{
                      video.comments.length > 0
                        ? " (" + video.comments.length + ")"
                        : ""
                    }}</span
                  >
                </div>

                <div class="video-comment__scroll">
                  <div
                    class="video-comment__list"
                    v-if="video.comments.length > 0"
                  >
                    <div
                      v-for="(comment, cIndex) in getLoadedComments(index)"
                      :key="`comment-${video.id}-${cIndex}`"
                      class="video-comment__item"
                    >
                      <a-avatar
                        :size="24"
                        :style="{
                          backgroundColor: getRandomColor(comment.id),
                          color: '#fff',
                        }"
                      >
                        {{ getShortNickname(comment.nickname) }}
                      </a-avatar>
                      <div class="comment-item__content">
                        <div class="comment-item__header">
                          <span class="comment-item__username">{{
                            comment.nickname
                          }}</span>
                          <span class="comment-item__time">{{
                            comment.time
                          }}</span>
                        </div>
                        <div v-if="comment.replyTo" class="comment-item__quote">
                          <i class="el-icon-chat-line-round quote__icon"></i>
                          <span class="quote__label"
                            >@{{ comment.replyTo }}：</span
                          >
                          <span class="quote__text">{{
                            getReplyContent(comment.replyTo, video.comments)
                          }}</span>
                        </div>
                        <p class="comment-item__text">{{ comment.text }}</p>
                      </div>
                    </div>

                    <div class="video-comment__load-more">
                      <a-spin
                        size="small"
                        v-if="getCommentStatus(index).loading"
                      />
                      <a-button
                        v-else-if="hasMoreComments(index)"
                        type="text"
                        size="small"
                        @click.stop="loadMoreComments(index)"
                        class="load-more__btn"
                      >
                        加载更多 <a-icon type="down-circle" theme="twoTone" />
                      </a-button>
                      <span v-else class="load-more__no-more"
                        >已加载全部评论</span
                      >
                    </div>
                  </div>
                  <div class="video-comment__empty" v-else>暂无评论~</div>
                </div>
              </div>
            </div>
          </div>
        </a-card>
      </div>

      <!-- 分页组件 -->
      <a-pagination
        v-show="Number(total) > 0"
        class="video-list__pagination"
        show-quick-jumper
        :current="queryParam.pageNum"
        :total="total"
        :page-size="queryParam.pageSize"
        :showTotal="(total) => `共 ${total} 条`"
        @change="changeSize"
      />
    </a-spin>

    <a-back-top />
  </div>
</template>

<script>
import { videoList, getAccount } from "@/api/module/Pictures";
// 引入video.js核心库（替代vue-video-player封装，避免兼容性问题）
import videojs from "video.js";
import "video.js/dist/video-js.css";

export default {
  name: "VideoDetailList",
  data() {
    return {
      queryParam: {
        pageNum: 1,
        pageSize: 10,
        devId: "",
        douyinId: "",
      },
      loading: true,
      videoList: [],
      userInfo: {},
      currentPlayVideoId: null,
      total: 0,
      commentLoadedStatus: {},
      accountInfo: {},
      parsedAccountJson: {},
      regionCommentStatus: {
        loadedCount: 20,
        pageSize: 20,
        loading: false,
      },
      // 存储video.js播放器实例
      playerInstances: {},
    };
  },
  computed: {
    isRegion() {
      return !!this.parsedAccountJson.address && !this.userInfo.nickname;
    },
    totalRegionComments() {
      return this.parsedAccountJson.comments?.length || 0;
    },
  },
  mounted() {
    // 解析路由参数
    const { devId, douyinId, type } = this.$route.query || {};
    this.queryParam = {
      ...this.queryParam,
      devId: devId || "",
      ...(type === "1" || type === 1
        ? { douyinId: douyinId || "" }
        : type === "2" || type === 2
        ? { address: douyinId || "" }
        : {}),
    };

    // 加载数据
    this.fetchUserInfo(devId, douyinId);
    this.getList();
  },
  beforeDestroy() {
    // 销毁所有播放器实例，防止内存泄漏
    Object.values(this.playerInstances).forEach((player) => {
      if (player && player.dispose) {
        player.dispose();
      }
    });
    this.playerInstances = {};
  },
  methods: {
    // 获取用户/地区信息
    async fetchUserInfo(devId, douyinId) {
      if (!devId || !douyinId) {
        this.userInfo = {};
        this.accountInfo = {};
        this.parsedAccountJson = {};
        return;
      }
      try {
        const userRes = await getAccount({ devId, douyinId });
        this.accountInfo = userRes.account || {};
        this.parsedAccountJson = this.accountInfo.jsonString
          ? JSON.parse(this.accountInfo.jsonString)
          : {};
        if (!Array.isArray(this.parsedAccountJson.comments)) {
          this.parsedAccountJson.comments = [];
        }
        this.userInfo = this.parsedAccountJson || {};
      } catch (error) {
        console.error("获取用户/地区信息失败：", error);
        this.userInfo = {};
        this.accountInfo = {};
        this.parsedAccountJson = {};
      }
    },

    // 获取视频列表
    async getList() {
      this.loading = true;
      debugger;
      try {
        const response = await videoList(this.queryParam);
        this.videoList =
          response.rows?.map((item) => {
            try {
              const content = item.content ? JSON.parse(item.content) : [];
              const jsonString = item.jsonString
                ? JSON.parse(item.jsonString)
                : {};
              const videoUserInfo = item.userJson?.jsonString
                ? typeof item.userJson?.jsonString === "string"
                  ? JSON.parse(item.userJson?.jsonString)
                  : item.userJson.jsonString
                : {};
              return {
                ...item,
                comments: Array.isArray(content) ? content : [],
                jsonString: jsonString || {},
                userInfo: videoUserInfo,
              };
            } catch (e) {
              console.error(`解析content失败:`, e);
              return {
                ...item,
                comments: [],
                jsonString: {},
                userInfo: {},
              };
            }
          }) || [];
        this.total = response.total || 0;
        this.initCommentLoadedStatus();

        // 初始化视频播放器（DOM渲染完成后）
        this.$nextTick(() => {
          this.initVideoPlayers();
        });
      } catch (error) {
        console.error("获取视频列表失败：", error);
        this.videoList = [];
        this.total = 0;
        this.$message.error("获取视频列表失败，请重试");
      } finally {
        this.loading = false;
      }
    },

    // 初始化所有视频播放器
    initVideoPlayers() {
      // 先销毁旧实例
      Object.values(this.playerInstances).forEach((player) => {
        if (player && player.dispose) {
          player.dispose();
        }
      });
      this.playerInstances = {};

      // 为每个视频创建播放器实例
      this.videoList.forEach((video) => {
        const playerId = `video-player-${video.id}`;
        const playerElement = document.getElementById(playerId);
        if (playerElement) {
          const player = videojs(playerElement, {
            autoplay: false,
            controls: true,
            responsive: true,
            fluid: true,
            playbackRates: [0.5, 1, 1.5, 2],
            language: "zh-CN",
            // 关键1：显式开启时长控件（恢复默认显示）
            controlBar: {
              volumePanel: {
                inline: false,
                vertical: true,
              },
              // 显式开启当前时间、总时长、时间分隔符（恢复默认）
              currentTimeDisplay: true,
              durationDisplay: true,
              timeDivider: true,
              // 隐藏剩余时间（避免重复，如需显示可设为true）
              remainingTimeDisplay: false,
            },
            // 关键2：预加载元数据（获取时长必须，之前可能默认是auto，现在显式指定）
            preload: "metadata",
          });

          // 关键3：监听元数据加载完成，强制更新控件（解决布局延迟导致的隐藏问题）
          player.on("loadedmetadata", () => {
            player.controlBar.currentTimeDisplay.show();
            player.controlBar.durationDisplay.show();
            player.controlBar.timeDivider.show();
          });

          // 监听播放事件，实现互斥播放
          player.on("play", () => {
            this.handleVideoPlay(video.id);
          });

          player.on("pause", () => {
            this.handleVideoPause(video.id);
          });

          this.playerInstances[video.id] = player;
        }
      });
    },

    // 地区评论加载
    getLoadedRegionComments() {
      if (
        !this.parsedAccountJson.comments ||
        this.parsedAccountJson.comments.length === 0
      ) {
        return [];
      }
      return this.parsedAccountJson.comments.slice(
        0,
        this.regionCommentStatus.loadedCount
      );
    },
    hasMoreRegionComments() {
      return this.regionCommentStatus.loadedCount < this.totalRegionComments;
    },
    loadMoreRegionComments() {
      if (this.regionCommentStatus.loading || !this.hasMoreRegionComments())
        return;

      this.regionCommentStatus.loading = true;
      setTimeout(() => {
        try {
          this.regionCommentStatus.loadedCount +=
            this.regionCommentStatus.pageSize;
          this.regionCommentStatus.loading = false;
        } catch (error) {
          console.error("加载地区评论失败：", error);
          this.regionCommentStatus.loading = false;
        }
      }, 600);
    },

    // 视频评论加载
    getLoadedComments(videoIndex) {
      const video = this.videoList[videoIndex];
      if (!video?.comments || video.comments.length === 0) return [];
      const loadedStatus = this.commentLoadedStatus[videoIndex] || {
        loadedCount: 10,
      };
      return video.comments.slice(0, loadedStatus.loadedCount);
    },
    hasMoreComments(videoIndex) {
      const loadedStatus = this.commentLoadedStatus[videoIndex] || {
        loadedCount: 0,
        total: 0,
      };
      return loadedStatus.loadedCount < loadedStatus.total;
    },
    getCommentStatus(videoIndex) {
      return this.commentLoadedStatus[videoIndex] || { loading: false };
    },
    loadMoreComments(videoIndex) {
      const loadedStatus = this.commentLoadedStatus[videoIndex];
      if (loadedStatus?.loading || !this.hasMoreComments(videoIndex)) return;

      this.$set(this.commentLoadedStatus, videoIndex, {
        ...loadedStatus,
        loading: true,
      });
      setTimeout(() => {
        try {
          this.$set(this.commentLoadedStatus, videoIndex, {
            ...loadedStatus,
            loadedCount: loadedStatus.loadedCount + loadedStatus.pageSize,
            loading: false,
          });
        } catch (error) {
          console.error("加载评论失败：", error);
          this.$set(this.commentLoadedStatus, videoIndex, {
            ...loadedStatus,
            loading: false,
          });
        }
      }, 500);
    },

    // 视频播放控制
    handleVideoPlay(currentVideoId) {
      // 暂停其他所有视频
      Object.keys(this.playerInstances).forEach((videoId) => {
        if (videoId !== currentVideoId.toString()) {
          const player = this.playerInstances[videoId];
          if (player && !player.paused()) {
            player.pause();
          }
        }
      });
      this.currentPlayVideoId = currentVideoId;
    },
    handleVideoPause(pauseVideoId) {
      if (this.currentPlayVideoId === pauseVideoId) {
        this.currentPlayVideoId = null;
      }
    },

    // 工具方法
    formatNumber(num) {
      if (num >= 10000) {
        return (num / 10000).toFixed(1) + "万";
      }
      return num;
    },
    onShowSizeChange(pageNum, pageSize) {
      this.queryParam.pageSize = pageSize;
      this.queryParam.pageNum = 1;
      this.getList();
      this.scrollToTop();
    },
    changeSize(pageNum) {
      this.queryParam.pageNum = pageNum;
      this.getList();
      this.scrollToTop();
    },
    scrollToTop() {
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    getUrl(url) {
      if (!url) return;
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
        "#ff2d55",
        "#8e8e93",
      ];
      return colors[id % colors.length];
    },
    getCommentNickname(comment, short = true) {
      if (!comment.content) return short ? "匿" : "匿名用户";
      const nicknameMatch = comment.content.match(
        /^([^0-9\u4e00-\u9fa5]*[\u4e00-\u9fa5a-zA-Z]+)[0-9]/
      );
      if (nicknameMatch && nicknameMatch[1]) {
        const nickname = nicknameMatch[1].trim();
        return short
          ? nickname.length > 2
            ? nickname.substring(0, 2)
            : nickname
          : nickname;
      }
      const randomName = "用户" + Math.floor(Math.random() * 1000);
      return short ? randomName.substring(0, 2) : randomName;
    },
    getCommentTime(comment) {
      if (!comment.content) return "未知时间";
      const timeMatch = comment.content.match(
        /(20\d{2}-\d{1,2}-\d{1,2}|(\d+)小时前|(\d+)天前|(\d+)分钟前)/
      );
      return timeMatch && timeMatch[0] ? timeMatch[0] : "未知时间";
    },
    getReplyContent(replyTo, comments) {
      const targetComment = comments.find((item) => item.nickname === replyTo);
      if (targetComment) {
        return targetComment.text.length > 20
          ? targetComment.text.substring(0, 20) + "..."
          : targetComment.text;
      }
      return "该评论已删除";
    },
    getShortNickname(nickname) {
      if (!nickname) return "匿";
      const maxLen = 2;
      return nickname.length > maxLen
        ? nickname.substring(0, maxLen)
        : nickname;
    },
    initCommentLoadedStatus() {
      this.commentLoadedStatus = {};
      this.videoList.forEach((video, index) => {
        this.$set(this.commentLoadedStatus, index, {
          loadedCount: 10,
          pageSize: 10,
          total: video.comments.length,
          loading: false,
        });
      });
    },
  },
};
</script>

<style lang="less">
/* 确保video.js控制栏的时长控件可见 */
.video-js .vjs-current-time,
.video-js .vjs-duration,
.video-js .vjs-time-divider {
  display: block !important;
}
.ant-divider-horizontal {
  margin: 12px !important;
}
/* 基础容器样式 */
.video-list-container {
  padding: 20px;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  background-color: #f7f8fa;
}

/* 页面头部 */
.video-list__page-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

/* 抖音风格卡片 */
.video-list__douyin-card {
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: none;
  overflow: hidden;
  background-color: #fff;

  .douyin-card__content {
    display: flex;
    gap: 20px;
    padding: 20px;
    height: 700px;
  }

  .douyin-card__left {
    flex: 0 0 40%;
    display: flex;
    flex-direction: column;
    padding-right: 20px;
    border-right: 1px solid #f0f0f0;
  }

  .douyin-card__right {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}

/* 地区头部 */
.douyin-card__region-header {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  background-color: #f9f9f9;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  padding: 20px;
}

.region-header__avatar-wrap {
  position: relative;
  flex-shrink: 0;

  .avatar-wrap__decoration {
    position: absolute;
    top: -6px;
    left: -6px;
    width: 92px;
    height: 92px;
    background: radial-gradient(
      circle,
      rgba(254, 44, 85, 0.1) 0%,
      transparent 70%
    );
    border-radius: 50%;
    z-index: 0;
  }

  .avatar-wrap__badge {
    position: absolute;
    bottom: -4px;
    right: -4px;
    width: 24px;
    height: 24px;
    background-color: #fe2c55;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 12px;
    box-shadow: 0 2px 8px rgba(254, 44, 85, 0.3);
  }
}

.region-header__title-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;

  .title-wrap__title {
    font-size: 22px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0;
    line-height: 1.4;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;

    .title-wrap__area-code {
      font-size: 14px;
      color: #888;
      font-weight: normal;
    }

    .title-wrap__official-tag {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #007aff;
      background-color: #e6f7ff;
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: normal;
    }
  }

  .title-wrap__score {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    color: #fe2c55;

    .score__stars {
      display: flex;
      gap: 2px;

      .icon-star {
        color: #ddd;
        font-size: 14px;
      }

      .score__star--filled {
        color: #ffcc00;
      }
    }

    .score__value {
      font-weight: 600;
    }

    .score__outof {
      font-size: 12px;
      color: #888;
      font-weight: normal;
    }
  }

  .title-wrap__tags {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;

    .tags__item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      padding: 2px 8px;
      border-radius: 12px;

      &--hot {
        background-color: #fff2f0;
        color: #ff4d4f;
      }

      &--new {
        background-color: #f0f9ff;
        color: #1890ff;
      }
    }
  }
}

/* 地区数据概览 */
.douyin-card__region-stats {
  padding: 10px 20px;
  background-color: #f9f9f9;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  gap: 4px;

  .region-stats__header {
    padding-bottom: 12px;
    border-bottom: 1px solid #f0f0f0;

    .region-stats__title {
      font-size: 16px;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  .region-stats__grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;

    .stats-grid__item {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 16px;
      border-radius: 10px;
      background-color: #fff;
      border: 1px solid #f0f0f0;
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        border-color: #e8e8e8;
      }

      .stats-grid__icon {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 4px;

        &--works {
          background-color: #f0f9ff;
          color: #1890ff;
        }

        &--comment {
          background-color: #f6ffed;
          color: #52c41a;
        }

        &--user {
          background-color: #fff7e6;
          color: #fa8c16;
        }

        &--hot {
          background-color: #fff2f0;
          color: #ff4d4f;
        }
      }

      .stats-grid__label {
        font-size: 13px;
        color: #888;
      }

      .stats-grid__value {
        font-size: 20px;
        font-weight: 600;
        color: #1a1a1a;
        line-height: 1;
      }

      .stats-grid__trend {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #52c41a;
        margin-top: 4px;
      }

      .stats-grid__hot-score {
        display: flex;
        flex-direction: column;
        gap: 6px;

        .hot-score__bar {
          width: 100%;
          height: 6px;
          background-color: #f0f0f0;
          border-radius: 3px;
          overflow: hidden;

          .hot-score__progress {
            height: 100%;
            background: linear-gradient(90deg, #ff4d4f, #ff7a45);
            border-radius: 3px;
            transition: width 0.5s ease;
          }
        }
      }
    }
  }
}

/* 最后更新时间 */
.douyin-card__update-time {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 12px;
  border: 1px solid #f0f0f0;

  .update-time__icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background-color: #f0f8ff;
    color: #40a9ff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .update-time__content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;

    .update-time__label {
      font-size: 12px;
      color: #888;
    }

    .update-time__value {
      font-size: 14px;
      color: #1a1a1a;
      font-weight: 500;
    }
  }
}
// 大尺寸地区图片容器
.douyin-card__region-img {
  width: 100%;
  height: 504px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  position: relative;
  background-color: #f9f9f9; // 兜底背景色

  // 图片容器（控制加载/失败/成功的显示）
  .region-img__wrapper {
    width: 100%;
    height: 100%;
    position: relative;
  }

  // 原生img样式
  .region-img__content {
    width: 100%;
    height: 100%;
    object-fit: cover; // 居中裁剪，避免拉伸
    display: block; // 去除img默认空隙
  }

  // hover遮罩（保留交互）
  .region-img__mask {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 16px;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none; // 不影响img的加载/点击
  }

  &:hover .region-img__mask {
    opacity: 1;
  }
}

// 兜底占位图样式（如果没有自定义兜底图）
.ant-image-img {
  &[src$="region-placeholder.png"] {
    background-color: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #999;
    font-size: 14px;
  }
}
/* 抖音评论区 */
.douyin-comment__header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .douyin-comment__title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: #1a1a1a;
  }
}

.douyin-comment__scroll {
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
  scrollbar-width: thin;
  scrollbar-color: #e0e0e0 #f9f9f9;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #e0e0e0;
    border-radius: 2px;
  }
}

.douyin-comment__list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.douyin-comment__item {
  display: flex;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;

  .comment-item__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;

    .comment-item__user-info {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .user-info__username {
        font-size: 14px;
        font-weight: 500;
        color: #1a1a1a;
      }

      .user-info__time {
        font-size: 12px;
        color: #999;
      }
    }

    .comment-item__text {
      font-size: 14px;
      color: #333;
      line-height: 1.5;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  }
}

.douyin-comment__load-more {
  text-align: center;
  padding: 16px 0;

  .load-more__btn {
    color: #007aff;
    font-size: 14px;
  }

  .load-more__no-more {
    font-size: 13px;
    color: #999;
  }
}

.douyin-comment__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #999;
  font-size: 14px;
  gap: 8px;
}

/* 用户信息卡片 */
.video-list__user-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  .user-card__wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    align-items: center;
    padding: 20px;

    .user-card__avatar {
      flex-shrink: 0;
    }

    .user-card__base-info {
      flex: 1;
      min-width: 200px;

      .base-info__nickname {
        margin: 0 0 8px 0;
        font-size: 22px;
        font-weight: bold;
        color: #2ec6eb;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
      }

      .base-info__gender {
        margin: 0 0 12px 0;
        font-size: 14px;
        color: #666;
        line-height: 1.5;
        white-space: pre-line;
      }

      .base-info__meta {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        font-size: 14px;
        color: #666;

        .meta__item {
          display: flex;
          align-items: center;
          gap: 4px;
        }
      }
    }

    .user-card__stats {
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
      padding-left: 16px;
      border-left: 1px solid #eee;
      min-width: 200px;

      .stats__item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;

        .stats__label {
          font-size: 12px;
          color: #999;
        }

        .stats__value {
          font-size: 14px;
          color: #333;
        }
      }
    }
  }
}
// 有作者信息时：高度 92%
&.player-height--92 {
  .vjs-tech,
  .vjs-poster {
    min-height: 92% !important;
    height: 92% !important;
  }
}

// 无作者信息时：高度 100%
&.player-height--full {
  .vjs-tech,
  .vjs-poster {
    height: 100% !important;
    min-height: 100% !important;
  }
}

/* 视频卡片列表 */
.video-list__card-wrap {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  width: 100%;
  box-sizing: border-box;
}

.video-list__video-card {
  box-sizing: border-box;
  overflow: hidden;
  height: 100%;
  /* 核心修改：content改为垂直弹性布局 */
  .video-card__content {
    display: flex;
    gap: 15px;
    min-height: 840px;
    max-height: 840px;
    box-sizing: border-box;
  }

  /* 新增：视频+评论主容器，撑满剩余高度 */
  .video-card__main {
    display: flex;
    flex-direction: row; /* 视频和评论水平排列 */
    gap: 15px;
    flex: 1; /* 核心：撑满作者信息外的所有剩余高度 */
    height: 100%;
  }

  /* 视频作者信息 - 独立区域，不压缩 */
  .video-card__author-info {
    width: 100%;
    flex-shrink: 0; /* 不被压缩，占用自身高度 */
    box-sizing: border-box;

    .author-info__inner {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .author-info__base {
      flex: 1;

      .author-info__nickname {
        font-size: 14px;
        font-weight: 600;
        color: #333;
        margin: 0 0 4px 0;

        .author-info__realname,
        .author-info__region {
          font-size: 12px;
          color: #999;
          font-weight: normal;
          margin-left: 4px;
        }
      }

      .author-info__meta {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        font-size: 12px;
        color: #999;

        .meta__item {
          display: flex;
          align-items: center;
          gap: 3px;
        }
      }
    }
  }

  /* 左侧视频区域 - 适配新布局 */
  .video-card__left {
    flex: 0 0 48%;
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 100%; /* 撑满main容器高度 */
    box-sizing: border-box;
    overflow: hidden;
  }

  /* 视频播放器容器 - 核心：flex:1 撑满左侧剩余高度 */
  .video-card__player-wrap {
    flex: 1; /* 填充左侧容器剩余高度 */
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border-radius: 8px;
    background-color: #000;

    .video-player-container {
      width: 100%;
      height: 100%;
    }

    /* video.js 强制撑满 */
    .video-js {
      width: 100% !important;
      height: 100% !important;
    }

    /* 动态高度逻辑保留 */
    &.player-height--92 {
      .vjs-tech,
      .vjs-poster {
        height: 92% !important;
        min-height: 92% !important;
        width: 100% !important;
      }
    }

    &.player-height--full {
      .vjs-tech,
      .vjs-poster {
        height: 100% !important;
        min-height: 100% !important;
        width: 100% !important;
      }
    }
  }

  /* 视频信息区域 - 不压缩 */
  .video-card__info {
    display: flex;
    flex-direction: column;
    gap: 3px;
    flex-shrink: 0;
    padding-top: 8px;
    box-sizing: border-box;

    .video-info__title {
      font-size: 16px;
      color: #333;
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
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
      }
    }
  }

  /* 右侧评论区 - 适配新布局 */
  .video-card__right {
    flex: 0 0 52%;
    height: 100%; /* 撑满main容器高度 */
    border-left: 1px solid #eee;
    padding-left: 15px;
    box-sizing: border-box;
  }
}

/* 视频评论区 - 修正滚动高度 */
.video-comment__scroll {
  flex: 1;
  height: 100%; /* 改为100%，不再固定680px */
  overflow-y: auto;
  padding-right: 5px;
  scrollbar-width: thin;
  scrollbar-color: #ddd #f5f5f5;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #ddd;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-track {
    background-color: #f5f5f5;
  }
}

/* 响应式适配 - 同步调整 */
@media (max-width: 1200px) {
  .video-list__card-wrap {
    grid-template-columns: 1fr;
  }

  .douyin-card__content {
    flex-direction: column;
    height: auto !important;
  }

  .douyin-card__left {
    flex: none;
    padding-right: 0;
    border-right: none;
    border-bottom: 1px solid #f0f0f0;
    padding-bottom: 20px;
  }

  /* 响应式下调整布局 */
  .video-card__content {
    height: auto !important;
  }

  .video-card__main {
    flex-direction: column; /* 移动端视频和评论垂直排列 */
  }

  .video-card__left,
  .video-card__right {
    flex: none;
    width: 100%;
  }

  .video-card__right {
    border-left: none;
    border-top: 1px solid #eee;
    padding-left: 0;
    padding-top: 15px;
    margin-top: 15px;
  }
}

/* 视频作者信息 - 关键：设为不压缩，固定高度 */
.video-card__author-info {
  width: 100%;
  flex-shrink: 0; /* 核心：作者信息区域不被压缩，占用固定空间 */
  box-sizing: border-box;

  .author-info__inner {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .author-info__base {
    flex: 1;

    .author-info__nickname {
      font-size: 14px;
      font-weight: 600;
      color: #333;
      margin: 0 0 4px 0;

      .author-info__realname,
      .author-info__region {
        font-size: 12px;
        color: #999;
        font-weight: normal;
        margin-left: 4px;
      }
    }

    .author-info__meta {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      font-size: 12px;
      color: #999;

      .meta__item {
        display: flex;
        align-items: center;
        gap: 3px;
      }
    }
  }
}

/* 视频播放器容器 - 核心重构：弹性填充剩余空间 */
.video-card__player-wrap {
  /* 关键：flex:1 自动填充作者信息区域外的所有剩余空间 */
  flex: 1;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 8px;
  background-color: #000;
  /* 移除固定min-height，改用弹性布局自适应 */
  min-height: 0;

  .video-player-container {
    width: 100%;
    height: 100%;
  }

  /* video.js 样式穿透 - 确保播放器撑满容器 */
  .video-js {
    width: 100% !important;
    height: 100% !important;
  }

  /* 动态高度逻辑：保留原有逻辑，但适配弹性布局 */
  &.player-height--92 {
    .vjs-tech,
    .vjs-poster {
      height: 92% !important;
      min-height: 92% !important;
      width: 100% !important;
    }
  }

  &.player-height--full {
    .vjs-tech,
    .vjs-poster {
      height: 100% !important;
      min-height: 100% !important;
      width: 100% !important;
    }
  }
}

/* 视频信息区域 - 不压缩，固定高度 */
.video-card__info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex-shrink: 0; /* 不被压缩 */
  padding-top: 8px;
  box-sizing: border-box;

  .video-info__title {
    font-size: 16px;
    color: #333;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
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
    }
  }
}

/* 响应式适配 - 同步优化 */
@media (max-width: 1200px) {
  .video-list__card-wrap {
    grid-template-columns: 1fr;
  }

  .douyin-card__content {
    flex-direction: column;
    height: auto !important;
  }

  .douyin-card__left {
    flex: none;
    padding-right: 0;
    border-right: none;
    border-bottom: 1px solid #f0f0f0;
    padding-bottom: 20px;
  }

  /* 响应式下左侧视频容器仍保持自适应 */
  .video-card__content {
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
    padding-left: 0;
    padding-top: 15px;
    margin-top: 15px;
  }
}

/* 视频评论区 */
.video-comment__header {
  font-size: 13px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.video-comment__scroll {
  flex: 1;
  height: 760px;
  overflow-y: auto;
  padding-right: 5px;
  scrollbar-width: thin;
  scrollbar-color: #ddd #f5f5f5;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #ddd;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-track {
    background-color: #f5f5f5;
  }
}

.video-comment__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.video-comment__item {
  display: flex;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px solid #f5f5f5;
  padding-bottom: 8px;

  .comment-item__content {
    flex: 1;

    .comment-item__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
      font-size: 12px;

      .comment-item__username {
        font-weight: 500;
        color: #333;
      }

      .comment-item__time {
        color: #999;
      }
    }

    .comment-item__quote {
      padding: 6px 10px;
      background-color: #f5f5f5;
      border-radius: 4px;
      margin-bottom: 4px;
      font-size: 12px;
      color: #666;

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
    }
  }
}

.video-comment__load-more {
  text-align: center;
  padding: 10px 0;
  font-size: 12px;

  .load-more__btn {
    color: #007aff;
    font-size: 12px;
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
}

/* 分页样式 */
.video-list__pagination {
  margin-top: 20px;
  text-align: right;
}

/* 响应式适配 */
@media (max-width: 1200px) {
  .video-list__card-wrap {
    grid-template-columns: 1fr;
  }

  .douyin-card__content {
    flex-direction: column;
    height: auto !important;
  }

  .douyin-card__left {
    flex: none;
    padding-right: 0;
    border-right: none;
    border-bottom: 1px solid #f0f0f0;
    padding-bottom: 20px;
  }
}
</style>
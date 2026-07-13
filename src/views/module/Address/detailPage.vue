<template>
  <div class="address address--light-douyin">
    <div class="video-list-container">
      <!-- 头部卡片区域 -->
      <div class="video-list__page-header">
        <!-- 抖音风格地区卡片 -->
        <a-card class="video-list__douyin-card" v-show="isRegion && accountInfo.id" hoverable>
          <div class="douyin-card__content">
            <!-- 左侧：地区详情 -->
            <div class="douyin-card__left">
              <div class="douyin-card__region-img">
                <div class="region-img__wrapper">
                  <!-- 地区图片空状态 -->
                  <div v-if="!parsedAccountJson.address_image" class="empty-state empty-state--img">
                    <i class="iconfont icon-picture"></i>
                    <p>暂无地区展示图</p>
                  </div>
                  <img
                    v-else
                    :src="getUrl(parsedAccountJson.address_image)"
                    alt="地区展示图"
                    class="region-img__content"
                  />
                </div>
              </div>
            </div>
            <!-- 右侧：抖音风格评论区 -->
            <div class="douyin-card__right">
              <div class="douyin-comment__header">
                <div class="douyin-comment__title">
                  <i class="iconfont icon-comment"></i>
                  <span>全部评论 ({{ parsedAccountJson.comments?.length || 0 }})</span>
                </div>
              </div>
              <!-- 评论滚动容器 -->
              <div class="douyin-comment__scroll">
                <!-- 地区评论空状态 -->
                <div
                  v-if="!parsedAccountJson.comments || parsedAccountJson.comments.length === 0"
                  class="empty-state empty-state--comment"
                >
                  <i class="iconfont icon-comment"></i>
                  <p>暂无地区相关评论</p>
                  <p class="empty-state__hint">该地区暂未采集到评论数据</p>
                </div>
                <div class="douyin-comment__list" v-else>
                  <div
                    v-for="(comment, cIndex) in getLoadedRegionComments()"
                    :key="cIndex"
                    class="douyin-comment__item"
                  >
                    <a-avatar
                      :size="32"
                      :style="{
                        backgroundColor: getRandomColor(comment.uid || cIndex),
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
                        <span class="user-info__time">{{ getCommentTime(comment) }}</span>
                      </div>
                      <div class="comment-item__text">
                        {{ comment.content || '' }}
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
              </div>
            </div>
          </div>
        </a-card>
      </div>

      <!-- 排序按钮区域（空状态隐藏） -->
      <div class="video-list__sort-buttons" v-show="videoList.length > 0">
        <span class="sort-buttons__label">快速排序：</span>
        <!-- 粉丝数量排序按钮 -->
        <a-button :type="sortConfig.fansCount.type" @click="toggleSort('fansCount')" class="sort-btn">
          粉丝数量
          <a-icon :type="sortConfig.fansCount.icon" class="sort-icon" />
        </a-button>
        <!-- 关注数量排序按钮 -->
        <a-button :type="sortConfig.followCount.type" @click="toggleSort('followCount')" class="sort-btn">
          关注数量
          <a-icon :type="sortConfig.followCount.icon" class="sort-icon" />
        </a-button>
        <a-select
          v-model="queryParam.ipAddress"
          show-search
          style="width: 200px"
          allow-clear
          show-arrow
          :filter-option="filterOption"
          @change="getList"
          placeholder="请选择归属地"
        >
          <a-select-option v-for="(d, index) in ipList" :key="index" :value="d.label">
            {{ d.label }}
          </a-select-option>
        </a-select>
        <!-- 重置排序按钮 -->
        <a-button type="default" icon="reload" @click="resetSort" class="reset-btn"> 重置 </a-button>
      </div>

      <!-- 视频列表区域 -->
      <a-spin :spinning="loading">
        <!-- 视频列表空状态 -->
        <div v-if="!loading && videoList.length === 0" class="empty-state empty-state--main">
          <i class="iconfont icon-video"></i>
          <h3>暂无视频数据</h3>
          <p class="empty-state__hint">刷新页面重试</p>
          <a-button type="primary" @click="getList"> 刷新数据 </a-button>
        </div>

        <div class="video-list__card-wrap" v-else>
          <a-card
            v-for="(video, index) in videoList"
            :key="`video-${video.uid}-${index}`"
            class="video-list__video-card"
            hoverable
          >
            <!-- 核心修改：左右布局 - 左侧信息 + 右侧主页图片 -->
            <div class="video-card__layout">
              <!-- 左侧：作者信息区域（精细化布局） -->
              <div class="video-card__info-section">
                <!-- 顶部操作区 - 按钮放在用户信息平层最右侧 -->
                <div class="info-section__header">
                  <div class="header__title">用户信息</div>
                </div>

                <!-- 核心信息区 -->
                <div class="info-section__content">
                  <!-- 头像+基础信息行 -->
                  <div class="content__avatar-row">
                    <a-avatar
                      @click.stop="video.status != '0' && video.status != '9' && goDetailPage(video)"
                      :size="88"
                      :src="getUrl(video.userInfo?.touxiang || video.touxiang)"
                      :style="{
                        backgroundColor: getRandomColor(video.uid || index),
                      }"
                      class="avatar-row__avatar"
                    >
                      {{ getShortNickname(video.userInfo?.nickname || video.nickname || '匿') }}
                    </a-avatar>

                    <!-- 昵称+ID+属地+状态 -->
                    <div class="avatar-row__info">
                      <div class="info__nickname-row">
                        <span class="nickname__text">
                          {{ video.userInfo?.nickname || video.nickname || '未知作者' }}
                        </span>
                        <span v-if="video.userInfo?.real_name" class="nickname__realname">
                          ({{ video.userInfo.real_name }})
                        </span>
                      </div>

                      <div class="info__meta-row">
                        <!-- 抖音ID -->
                        <span
                          v-if="video.douyinId || video.userInfo?.douyinId"
                          class="meta-row__item meta-row__douyin-id"
                        >
                          <a-icon type="idcard" size="small" />
                          {{ video.douyinId || video.userInfo?.douyinId }}
                        </span>

                        <!-- 属地 -->
                        <span class="meta-row__item meta-row__region">
                          <a-icon type="environment" size="small" />
                          {{ video.userInfo?.region || video.region || '未知属地' }}
                        </span>

                        <!-- 核心修改1：状态区域 - 已获取时显示按钮 -->
                        <div class="meta-row__item status-button-wrapper tooltip-header__btn-wrap">
                          <!-- 非已获取状态：保持原有样式 -->
                          <span
                            v-if="getStatusText(video.status) !== '已获取'"
                            class="info-fetch-status"
                            :class="getStatusClass(video.status)"
                            @click.stop="video.status == '9' && $refs.CreateForm.handleAdd(video)"
                          >
                            <a-spin size="12" v-if="video.status == '1' || video.status === 'fetching'" />
                            {{ getStatusText(video.status) }}
                          </span>
                          <!-- 已获取状态：显示按钮 -->
                          <a-button
                            v-else
                            type="primary"
                            size="small"
                            @click.stop="video.status != '0' && video.status != '9' && goDetailPage(video)"
                          >
                            查看人员信息
                          </a-button>
                        </div>
                      </div>
                      <!-- 核心修改2：添加查看视频按钮到状态下方 -->
                      <div class="tooltip-header__btn-wrap">
                        <a-button
                          class="status-fetched-btn"
                          type="primary"
                          size="small"
                          @click="openVideoModal(video, index)"
                        >
                          <a-icon type="video-camera" /> 当前位置视频
                        </a-button>
                      </div>
                    </div>
                  </div>

                  <!-- 分割线 -->
                  <a-divider class="content__divider" />

                  <!-- 简介区域 - 修复 v-else 无对应 v-if 的问题 -->
                  <div class="content__profile" v-if="video.userInfo?.profile_text || video.profile_text">
                    <div class="profile__label">
                      <a-icon type="file-text" size="small" />
                      个人简介
                    </div>
                    <div class="profile__content">
                      {{ video.userInfo?.profile_text || video.profile_text }}
                    </div>
                  </div>
                  <!-- 简介空状态 - 现在 v-else 有对应的 v-if 了 -->
                  <div v-else class="content__profile content__profile--empty">
                    <div class="profile__label">
                      <a-icon type="file-text" size="small" />
                      个人简介
                    </div>
                    <div class="profile__content profile__content--empty">暂无个人简介信息</div>
                  </div>

                  <!-- 分割线 -->
                  <a-divider class="content__divider" />

                  <!-- 数据统计区 - 仅调整文字大小解决换行问题 -->
                  <div class="content__stats">
                    <div class="stats__label">
                      <a-icon type="dashboard" size="small" />
                      账号数据
                    </div>
                    <div class="stats__grid">
                      <div class="stats-grid__item">
                        <div class="stats-grid__icon stats-grid__icon--likes">
                          <a-icon type="like" />
                        </div>
                        <div class="stats-grid__value">
                          {{ video.userInfo?.likes_count || video.likes_count || 0 }}
                        </div>
                        <div class="stats-grid__label">获赞数</div>
                      </div>
                      <div class="stats-grid__item">
                        <div class="stats-grid__icon stats-grid__icon--follow">
                          <a-icon type="user-add" />
                        </div>
                        <div class="stats-grid__value">
                          {{ video.userInfo?.follow_count || video.follow_count || 0 }}
                        </div>
                        <div class="stats-grid__label">关注数</div>
                      </div>
                      <div class="stats-grid__item">
                        <div class="stats-grid__icon stats-grid__icon--fans">
                          <a-icon type="star" />
                        </div>
                        <div class="stats-grid__value">
                          {{ video.userInfo?.fans_count || video.fans_count || 0 }}
                        </div>
                        <div class="stats-grid__label">粉丝数</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 右侧：主页图片展示（固定300x700） -->
              <div class="video-card__image-section">
                <div class="image-section__header">
                  <a-icon type="picture" size="small" />
                  个人主页截图
                </div>
                <div class="zhuye-img-container" v-if="video.userInfo?.zhuye || video.zhuye">
                  <img
                    :src="getUrl(video.userInfo?.zhuye || video.zhuye)"
                    alt="个人主页图片"
                    class="zhuye-img"
                    @error="
                      (e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }
                    "
                  />
                  <div class="zhuye-img__fallback">图片加载失败</div>
                </div>
                <!-- 主页截图空状态优化 -->
                <div class="zhuye-empty" v-else>
                  <i class="iconfont icon-image"></i>
                  <p>暂无主页截图</p>
                  <p class="zhuye-empty__hint">该用户暂未采集到主页截图</p>
                </div>
              </div>
            </div>
          </a-card>
        </div>

        <a-pagination
          class="video-list__pagination"
          :current="queryParam.pageNum"
          :total="total"
          :page-size="queryParam.pageSize"
          :showTotal="(total) => `共 ${total} 条`"
          @change="changeSize"
          :show-less-items="false"
        />
      </a-spin>

      <!-- 视频评论弹窗 -->
      <a-modal v-model="modalVisible" width="70%" destroyOnClose :footer="null" class="custom-modal-top">
        <VideoCommentModalItem
          :video="currentModalVideo"
          :video-index="currentModalVideoIndex"
          :comment-loaded-status="commentLoadedStatus"
          @load-more-comments="loadMoreComments"
        />
      </a-modal>

      <a-back-top />
      <create-form :deviceData="deviceData" @ok="getList" ref="CreateForm" />
    </div>
  </div>
</template>

<script>
  // 导入API（根据项目实际路径调整）
  import { AddressVideo, getAccount, deviceList, AddressVideoIp } from '@/api/module/Basic';

  import videojs from 'video.js';
  import 'video.js/dist/video-js.css';
  import VideoCommentModalItem from '@/components/VideoCommentModalItem/index.vue';
  import CreateForm from '../Basic/modules/CreateForm.vue';

  export default {
    name: 'AddressDetailList',
    components: { VideoCommentModalItem, CreateForm },
    data() {
      return {
        queryParam: {
          pageNum: 1,
          pageSize: 10,
          devId: '',
          ipAddress: undefined,
          douyinId: '',
          sortField: '', // 排序字段：fansCount/followCount
          sortOrder: '', // 排序方向：asc/desc
        },
        deviceData: [],

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
        playerInstances: {},
        ipList: [],
        modalVisible: false,
        currentModalVideo: { comments: [], jsonString: {} },
        currentModalVideoIndex: 0,
        // 排序配置
        sortConfig: {
          fansCount: { type: 'default', icon: '' },
          followCount: { type: 'default', icon: '' },
        },
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
      const { devId, douyinId, type } = this.$route.query || {};
      this.queryParam = {
        ...this.queryParam,
        devId: devId || '',
        ...(type === '1' || type === 1
          ? { douyinId: douyinId || '' }
          : type === '2' || type === 2
          ? { address: douyinId || '' }
          : {}),
      };
      this.fetchUserInfo(devId, douyinId);
      this.getList();

      deviceList({
        pageNum: 1,
        pageSize: 9999,
      }).then((response) => {
        this.deviceData = response.rows;
      });

      AddressVideoIp({
        address: douyinId,
      }).then((response) => {
        this.ipList = response.data.map((region) => ({
          label: region,
          value: region,
        }));
      });
    },
    beforeDestroy() {
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
          this.parsedAccountJson = this.accountInfo.jsonString ? JSON.parse(this.accountInfo.jsonString) : {};
          if (!Array.isArray(this.parsedAccountJson.comments)) {
            this.parsedAccountJson.comments = [];
          }
          this.userInfo = this.parsedAccountJson || {};
        } catch (error) {
          console.error('获取用户/地区信息失败：', error);
          this.userInfo = {};
          this.accountInfo = {};
          this.parsedAccountJson = {};
        }
      },

      // 获取视频列表
      async getList() {
        this.loading = true;
        try {
          const response = await AddressVideo(this.queryParam);
          this.videoList =
            response.rows?.map((item) => {
              try {
                const content = item.content ? JSON.parse(item.content) : [];
                const jsonString = item.jsonString ? JSON.parse(item.jsonString) : {};
                const videoUserInfo = item.userJson?.jsonString
                  ? typeof item.userJson?.jsonString === 'string'
                    ? JSON.parse(item.userJson?.jsonString)
                    : item.userJson.jsonString
                  : {};
                return {
                  ...item,
                  comments: Array.isArray(content) ? content : [],
                  jsonString: jsonString || {},
                  userInfo: videoUserInfo,
                  status: item.status || '9',
                };
              } catch (e) {
                console.error(`解析content失败:`, e);
                return {
                  ...item,
                  comments: [],
                  jsonString: {},
                  userInfo: {},
                  status: '', // 解析失败也默认未获取
                };
              }
            }) || [];
          this.total = response.total || 0;
          this.initCommentLoadedStatus();
          this.$nextTick(() => {
            this.initVideoPlayers();
          });
        } catch (error) {
          console.error('获取视频列表失败：', error);
          this.videoList = [];
          this.total = 0;
          this.$message.error('获取视频列表失败，请重试');
        } finally {
          this.loading = false;
        }
      },

      // 初始化所有视频播放器
      initVideoPlayers() {
        Object.values(this.playerInstances).forEach((player) => {
          if (player && player.dispose) {
            player.dispose();
          }
        });
        this.playerInstances = {};

        this.videoList.forEach((video) => {
          const playerId = `video-player-${video.uid}`;
          const playerElement = document.getElementById(playerId);
          if (playerElement) {
            const player = videojs(playerElement, {
              autoplay: false,
              controls: true,
              responsive: true,
              fluid: true,
              playbackRates: [0.5, 1, 1.5, 2],
              language: 'zh-CN',
              controlBar: {
                volumePanel: {
                  inline: false,
                  vertical: true,
                },
                currentTimeDisplay: true,
                durationDisplay: true,
                timeDivider: true,
                remainingTimeDisplay: false,
              },
              preload: 'metadata',
            });

            player.on('loadedmetadata', () => {
              player.controlBar.currentTimeDisplay.show();
              player.controlBar.durationDisplay.show();
              player.controlBar.timeDivider.show();
            });

            player.on('play', () => {
              this.handleVideoPlay(video.uid);
            });

            player.on('pause', () => {
              this.handleVideoPause(video.uid);
            });

            this.playerInstances[video.uid] = player;
          }
        });
      },
      filterOption(inputValue, option) {
        if (!inputValue) return true;
        // option.children 对应a-option标签内的文字（Vue2版本的option对象结构）
        return option.componentOptions.children[0].text.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0;
      },
      // 地区评论加载相关方法
      getLoadedRegionComments() {
        if (!this.parsedAccountJson.comments || this.parsedAccountJson.comments.length === 0) {
          return [];
        }
        return this.parsedAccountJson.comments.slice(0, this.regionCommentStatus.loadedCount);
      },
      hasMoreRegionComments() {
        return this.regionCommentStatus.loadedCount < this.totalRegionComments;
      },
      loadMoreRegionComments() {
        if (this.regionCommentStatus.loading || !this.hasMoreRegionComments()) return;
        this.regionCommentStatus.loading = true;
        setTimeout(() => {
          try {
            this.regionCommentStatus.loadedCount += this.regionCommentStatus.pageSize;
            this.regionCommentStatus.loading = false;
          } catch (error) {
            console.error('加载地区评论失败：', error);
            this.regionCommentStatus.loading = false;
          }
        }, 600);
      },

      // 视频评论加载相关方法
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
            console.error('加载评论失败：', error);
            this.$set(this.commentLoadedStatus, videoIndex, {
              ...loadedStatus,
              loading: false,
            });
          }
        }, 500);
      },

      // 视频播放控制
      handleVideoPlay(currentVideoId) {
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
          return (num / 10000).toFixed(1) + '万';
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
      scrollToTop() {},
      getUrl(url) {
        if (!url) return '';
        return window.origin + process.env.VUE_APP_BASE_API + url;
      },
      getRandomColor(id) {
        const colors = [
          '#fe2c55',
          '#ff6b35',
          '#ff9500',
          '#ffcc00',
          '#34c759',
          '#007aff',
          '#5856d6',
          '#af52de',
          '#ff2d55',
          '#8e8e93',
        ];
        return colors[id % colors.length];
      },
      getCommentNickname(comment, short = true) {
        if (!comment.content) return short ? '匿' : '匿名用户';
        const nicknameMatch = comment.content.match(/^([^0-9\u4e00-\u9fa5]*[\u4e00-\u9fa5a-zA-Z]+)[0-9]/);
        if (nicknameMatch && nicknameMatch[1]) {
          const nickname = nicknameMatch[1].trim();
          return short ? (nickname.length > 2 ? nickname.substring(0, 2) : nickname) : nickname;
        }
        return '匿名';
      },
      getCommentTime(comment) {
        if (!comment.content) return '未知时间';
        const timeMatch = comment.content.match(/(20\d{2}-\d{1,2}-\d{1,2}|(\d+)小时前|(\d+)天前|(\d+)分钟前)/);
        return timeMatch && timeMatch[0] ? timeMatch[0] : '未知时间';
      },
      getReplyContent(replyTo, comments) {
        const targetComment = comments.find((item) => item.nickname === replyTo);
        return targetComment
          ? targetComment.text.length > 20
            ? targetComment.text.substring(0, 20) + '...'
            : targetComment.text
          : '该评论已删除';
      },
      getShortNickname(nickname) {
        if (!nickname) return '匿';
        const maxLen = 2;
        return nickname.length > maxLen ? nickname.substring(0, maxLen) : nickname;
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
      openVideoModal(video, index) {
        this.currentModalVideo = video;

        this.currentModalVideoIndex = index;
        this.modalVisible = true;
      },
      modalClose() {
        this.currentModalVideo = { comments: [], jsonString: {} };
        this.currentModalVideoIndex = 0;
        this.modalVisible = false;
      },

      // 排序逻辑
      toggleSort(field) {
        const otherField = field === 'fansCount' ? 'followCount' : 'fansCount';
        this.$set(this.sortConfig, otherField, { type: 'default', icon: '' });
        const currentType = this.sortConfig[field].type;
        const currentIcon = this.sortConfig[field].icon;
        if (currentType === 'default' && currentIcon === '') {
          this.$set(this.sortConfig, field, { type: 'primary', icon: 'down' });
          this.queryParam.sortField = field;
          this.queryParam.sortOrder = 'desc';
        } else if (currentIcon === 'down') {
          this.$set(this.sortConfig, field, { type: 'primary', icon: 'up' });
          this.queryParam.sortField = field;
          this.queryParam.sortOrder = 'asc';
        } else {
          this.$set(this.sortConfig, field, { type: 'default', icon: '' });
          this.queryParam.sortField = '';
          this.queryParam.sortOrder = '';
        }
        this.queryParam.pageNum = 1;
        this.getList();
        this.scrollToTop();
      },
      resetSort() {
        this.$set(this.sortConfig, 'fansCount', { type: 'default', icon: '' });
        this.$set(this.sortConfig, 'followCount', { type: 'default', icon: '' });
        this.queryParam.sortField = '';
        this.queryParam.sortOrder = '';
        this.queryParam.pageNum = 1;
        this.queryParam.ipAddress = undefined;

        this.getList();
        this.scrollToTop();
        this.$message.success('排序已重置');
      },
      // 状态→样式类映射
      getStatusClass(status) {
        switch (status) {
          case '0':
            return 'pending'; // 待执行
          case '1':
            return 'fetching'; // 正在获取
          case '9':
            return 'unfetch'; // 未获取
          case 'fetching':
            return 'fetching'; // 正在获取（字符串状态）
          default:
            return 'fetched'; // 其他状态→已获取
        }
      },
      // 状态→文本映射
      getStatusText(status) {
        switch (status) {
          case '0':
            return '待执行';
          case '1':
            return '正在获取';
          case '9':
            return '未获取';
          case 'fetching':
            return '正在获取';
          default:
            return '已获取';
        }
      },
      goDetailPage(item) {
        if (!item.douyinId) return this.$message.error('抖音号不存在！');
        const routeData = this.$router.resolve({
          name: 'basicDetailPage',
          query: {
            devId: item.devId,
            douyinId: item.douyinId,
            type: '1',
          },
        });

        // 打开新标签页
        window.open(routeData.href, '_blank');
      },
    },
  };
</script>

<style lang="less">
  // 分页样式 + 排序按钮样式
  .ant-pagination-jump-next,
  .ant-pagination-jump-prev,
  .ant-pagination-ellipsis {
    display: none !important;
    visibility: hidden !important;
    width: 0 !important;
    height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .video-list__pagination {
    text-align: right;
    .ant-pagination-item-list > li.ant-pagination-item:nth-child(n + 9) {
      display: none !important;
    }
  }

  .video-list__sort-buttons {
    margin: 0 0 20px 0;
    padding: 16px 20px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    display: flex;
    align-items: center;
    gap: 12px;

    .sort-buttons__label {
      font-size: 14px;
      color: #333;
      font-weight: 500;
      margin-right: 4px;
    }

    .sort-btn {
      min-width: 120px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .sort-icon {
      font-size: 14px !important;
    }

    .reset-btn {
      margin-left: 8px;
    }
  }

  // 个人信息获取状态标识样式
  .info-fetch-status {
    padding: 3px 10px;
    border-radius: 16px;
    font-size: 12px;
    cursor: default;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    transition: all 0.2s ease;

    &.unfetch {
      background-color: #e6f7ff;
      color: #1890ff;
      cursor: pointer;

      &:hover {
        background-color: #bae7ff;
      }
    }

    &.fetching {
      background-color: #f5f5f5;
      color: #888;
    }

    &.pending {
      background-color: #f5f5f5;
      color: #888;
    }

    &.fetched {
      background-color: #f0f9ff00;
      color: #52c41a;
      border: 1px solid #52c41a;
    }
  }

  // 空状态通用样式
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    text-align: center;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
    margin: 24px 0;

    &--main {
      min-height: 400px;
      margin: 48px 0;
    }

    &--img {
      width: 100%;
      height: 100%;
      color: #999;
    }

    &--comment {
      height: 100%;
      color: #999;
    }

    i {
      font-size: 64px !important;
      color: #ccc;
      margin-bottom: 16px;
    }

    h3 {
      font-size: 18px;
      color: #333;
      margin: 0 0 8px 0;
      font-weight: 500;
    }

    p {
      font-size: 14px;
      color: #999;
      margin: 0 0 24px 0;
    }

    .empty-state__hint {
      font-size: 13px !important;
      color: #bbb !important;
    }

    .ant-btn {
      border-radius: 8px;
      padding: 8px 24px;
    }
  }

  // 个人简介空状态
  .content__profile--empty {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .profile__content--empty {
      color: #999;
      background-color: #fafafa !important;
      font-style: italic;
    }
  }

  // 主页截图空状态优化
  .zhuye-empty__hint {
    font-size: 12px;
    color: #bbb;
    margin-top: 8px;
  }

  // 视频播放器基础样式
  .video-js {
    .vjs-current-time,
    .vjs-duration,
    .vjs-time-divider {
      display: block !important;
    }
  }

  // 核心：卡片整体样式
  .video-list__video-card {
    border-radius: 16px;
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    border: none;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
      transform: translateY(-2px);
    }

    .ant-card-body {
      padding: 32px !important;
    }

    // 左右布局容器
    .video-card__layout {
      display: flex;
      gap: 32px;
      width: 100%;
      height: 100%;
      align-items: flex-start;
    }

    // 左侧信息区域（精细化布局）
    .video-card__info-section {
      flex: 1;
      min-width: 0; // 防止内容溢出
      display: flex;
      flex-direction: column;
      gap: 24px;

      // 信息区头部（标题+按钮平层）
      .info-section__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 16px;
        border-bottom: 1px solid #f5f5f5;

        .header__title {
          font-size: 18px;
          font-weight: 600;
          color: #222;
          display: flex;
          align-items: center;
          gap: 8px;

          &::before {
            content: '';
            display: inline-block;
            width: 4px;
            height: 18px;
            background-color: #1890ff;
            border-radius: 2px;
          }
        }
      }
      .tooltip-header__btn-wrap {
        button {
          padding: 0 10px; // 增大按钮内边距
          border-radius: 6px;
        }
        .anticon {
          font-size: 14px !important;
        }
      }
      // 信息区内容主体
      .info-section__content {
        display: flex;
        flex-direction: column;
        gap: 20px;

        // 头像+基础信息行
        .content__avatar-row {
          display: flex;
          align-items: center;
          gap: 20px;

          .avatar-row__avatar {
            flex-shrink: 0;
            border: 3px solid #f8f9fa;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            transition: all 0.2s ease;

            &:hover {
              transform: scale(1.05);
            }
          }

          .avatar-row__info {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 12px;

            // 昵称行
            .info__nickname-row {
              display: flex;
              align-items: center;
              gap: 8px;
              flex-wrap: wrap;

              .nickname__text {
                font-size: 18px;
                font-weight: 600;
                color: #222;
              }

              .nickname__realname {
                font-size: 14px;
                color: #888;
                font-weight: 400;
                padding: 2px 8px;
                background-color: #f8f9fa;
                border-radius: 8px;
              }
            }

            // 元信息行（ID/属地/状态）
            .info__meta-row {
              display: flex;
              align-items: center;
              gap: 12px;
              flex-wrap: wrap;

              .meta-row__item {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                font-size: 14px;

                .anticon {
                  font-size: 14px !important;
                }
              }

              .meta-row__douyin-id {
                padding: 2px 8px;
                background-color: #f0f8ff;
                border-radius: 8px;
              }

              .meta-row__region {
                color: #666;
                padding: 2px 8px;
                background-color: #f8f9fa;
                border-radius: 8px;
              }
            }
          }
        }

        // 分割线样式优化
        .content__divider {
          margin: 16px 0 !important;
          background-color: #f5f5f5;
          border: none;
          height: 1px;
        }

        // 简介区域
        .content__profile {
          display: flex;
          flex-direction: column;
          gap: 8px;

          .profile__label {
            font-size: 14px;
            font-weight: 500;
            color: #666;
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .profile__content {
            font-size: 15px;
            line-height: 1.8;
            color: #333;
            padding: 12px 16px;
            background-color: #f8f9fa;
            border-radius: 8px;
            word-break: break-word;
            min-height: 60px;
          }
        }

        // 数据统计区
        .content__stats {
          display: flex;
          flex-direction: column;
          gap: 12px;

          .stats__label {
            font-size: 14px;
            font-weight: 500;
            color: #666;
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .stats__grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;

            .stats-grid__item {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 20px 16px;
              background-color: #f8f9fa;
              border-radius: 12px;
              transition: all 0.2s ease;

              &:hover {
                transform: translateY(-4px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
              }

              .stats-grid__icon {
                width: 40px;
                height: 40px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 12px;

                .anticon {
                  font-size: 20px !important;
                  color: #fff;
                }

                &--follow {
                  background: linear-gradient(135deg, #1890ff, #40a9ff);
                }

                &--fans {
                  background: linear-gradient(135deg, #fa8c16, #ffc53d);
                }

                &--likes {
                  background: linear-gradient(135deg, #ff4d4f, #ff7a45);
                }
              }

              .stats-grid__value {
                font-size: 20px;
                font-weight: 700;
                color: #222;
                line-height: 1;
                margin-bottom: 4px;
                text-align: center;
              }

              .stats-grid__label {
                font-size: 13px;
                color: #888;
              }
            }
          }
        }
      }
    }

    // 右侧图片区域
    .video-card__image-section {
      flex-shrink: 0;
      width: 300px;
      display: flex;
      flex-direction: column;
      gap: 12px;

      .image-section__header {
        font-size: 16px;
        font-weight: 500;
        color: #333;
        display: flex;
        align-items: center;
        gap: 6px;
        padding-bottom: 8px;
        border-bottom: 1px solid #f5f5f5;
      }

      .zhuye-img-container {
        width: 300px;
        height: 700px;
        border: 1px solid #eee;
        border-radius: 12px;
        overflow: hidden;
        background: #fafafa;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;

        .zhuye-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          transition: all 0.3s ease;

          &:hover {
            transform: scale(1.02);
          }
        }

        .zhuye-img__fallback {
          display: none;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          color: #999;
          font-size: 14px;
        }
      }

      .zhuye-empty {
        width: 300px;
        height: 700px;
        border: 1px dashed #eee;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #999;
        font-size: 14px;
        background: #fafafa;
        gap: 16px;

        .iconfont {
          font-size: 56px !important;
          opacity: 0.5;
        }
      }
    }
  }

  // 其他基础样式
  .custom-modal-top {
    .ant-modal {
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      top: 50px !important;
    }
  }

  .ant-divider-horizontal {
    margin: 12px !important;
  }

  .address {
    .anticon {
      font-size: 19px !important;
    }

    .video-list-container {
      padding: 32px;
      max-width: 1600px;
      margin: 0 auto;
      width: 100%;
      box-sizing: border-box;
      overflow: hidden;
      background-color: #f7f8fa;
    }

    .video-list__page-header {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 24px;
    }

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

    .douyin-card__region-header {
      display: flex;
      align-items: flex-start;
      gap: 20px;
      background-color: #f9f9f9;
      border-radius: 12px;
      border: 1px solid #f0f0f0;
      padding: 20px;

      .region-header__avatar-wrap {
        position: relative;
        flex-shrink: 0;

        .avatar-wrap__decoration {
          position: absolute;
          top: -6px;
          left: -6px;
          width: 92px;
          height: 92px;
          background: radial-gradient(circle, rgba(254, 44, 85, 0.1) 0%, transparent 70%);
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
    }

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

    .douyin-card__region-img {
      width: 100%;
      height: 100%;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      position: relative;
      background-color: #f9f9f9;

      .region-img__wrapper {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        position: relative;
      }

      .region-img__content {
        height: 100%;
        display: block;
      }

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
        pointer-events: none;
      }

      &:hover {
        .region-img__mask {
          opacity: 1;
        }
      }
    }

    .ant-image-img[src$='region-placeholder.png'] {
      background-color: #f5f5f5;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
      font-size: 14px;
    }

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

    &.player-height--92 {
      .vjs-tech,
      .vjs-poster {
        min-height: 92% !important;
        height: 92% !important;
      }
    }

    &.player-height--full {
      .vjs-tech,
      .vjs-poster {
        height: 100% !important;
        min-height: 100% !important;
      }
    }

    .video-list__card-wrap {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 32px;
      width: 100%;
      box-sizing: border-box;
      margin-bottom: 32px;
    }

    .video-comment__scroll {
      flex: 1;
      height: 100%;
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

    .video-comment__header {
      font-size: 13px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
    }

    .video-comment__list {
      display: flex;
      flex-direction: column;
      gap: 12px;

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
            border-radius: 6px;
            font-size: 12px;
            color: #666;
            margin-bottom: 4px;
          }

          .comment-item__text {
            font-size: 13px;
            color: #333;
            line-height: 1.5;
          }

          .comment-item__actions {
            display: flex;
            gap: 12px;
            margin-top: 4px;
            font-size: 11px;
            color: #999;

            .actions__item {
              display: flex;
              align-items: center;
              gap: 4px;
              cursor: pointer;

              &:hover {
                color: #1890ff;
              }
            }
          }
        }
      }
    }

    .video-comment__load-more {
      text-align: center;
      padding: 8px 0;
      font-size: 12px;

      .load-more__text {
        color: #1890ff;
        cursor: pointer;

        &:hover {
          text-decoration: underline;
        }
      }

      .load-more__no-more {
        color: #999;
      }
    }
  }

  .address {
    min-height: 100%;
    padding: 18px;
    background: linear-gradient(180deg, #f7fbff 0%, #f1f6fc 100%);

    .video-list-container {
      max-width: 1600px;
      margin: 0 auto;
    }

    .video-list__page-header {
      margin-bottom: 22px;
    }

    .video-list__douyin-card {
      border: 0;
      border-radius: 30px;
      overflow: hidden;
      background: linear-gradient(180deg, #f8fbff 0%, #eef6ff 100%);
      box-shadow: 0 14px 36px rgba(22, 119, 255, 0.08);
      border: 1px solid #e2eefb;

      .ant-card-body {
        padding: 28px !important;
      }

      .douyin-card__content {
        gap: 26px;
        align-items: stretch;
      }

      .douyin-card__left,
      .douyin-card__right {
        background: #ffffff;
        border: 1px solid #e4eef9;
        border-radius: 24px;
        box-shadow: 0 8px 24px rgba(22, 119, 255, 0.05);
      }

      .douyin-card__left {
        padding: 18px;
      }

      .douyin-card__right {
        padding: 22px;
      }

      .douyin-comment__title,
      .comment-item__text,
      .user-info__username {
        color: #1f2d3d !important;
      }

      .user-info__time,
      .load-more__no-more,
      .empty-state__hint {
        color: #8aa0b8 !important;
      }

      .douyin-comment__item {
        border-bottom-color: #edf3fa !important;
      }
    }

    .video-list__sort-buttons {
      position: sticky;
      top: 12px;
      z-index: 5;
      margin-bottom: 24px;
      padding: 18px 20px;
      border-radius: 22px;
      border: 1px solid #e4eef9;
      background: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(14px);
      box-shadow: 0 12px 28px rgba(22, 119, 255, 0.06);
    }

    .video-list__sort-buttons .sort-buttons__label {
      color: #355070;
      font-weight: 600;
    }

    .video-list__sort-buttons .sort-btn,
    .video-list__sort-buttons .reset-btn {
      border-radius: 10px;
    }

    .video-list__sort-buttons .sort-btn.ant-btn-primary {
      background: #1677ff;
      border-color: #1677ff;
      box-shadow: none;
    }

    .video-list__sort-buttons .sort-btn,
    .video-list__sort-buttons .reset-btn,
    .video-list__sort-buttons .ant-select {
      height: 40px;
    }

    .video-list__video-card {
      border-radius: 26px;
      background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
      box-shadow: 0 16px 36px rgba(22, 119, 255, 0.06);
      border: 1px solid #e5eef8;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 20px 40px rgba(22, 119, 255, 0.1);
      }

      .ant-card-body {
        padding: 28px !important;
      }

      .video-card__layout {
        gap: 28px;
      }

      .video-card__info-section {
        padding: 24px;
        border-radius: 22px;
        background: linear-gradient(180deg, #ffffff 0%, #f7fbff 100%);
        border: 1px solid #e4eef9;
      }

      .info-section__header {
        border-bottom-color: #e8eef5 !important;
      }

      .header__title {
        font-size: 19px;
        font-weight: 700;
        color: #1f2d3d;
      }

      .avatar-row__avatar {
        box-shadow: 0 12px 28px rgba(14, 165, 233, 0.2);
        border: 4px solid #fff;
      }

      .nickname__text {
        font-size: 24px;
        font-weight: 700;
        color: #0f172a;
      }

      .meta-row__item {
        padding: 8px 12px;
        border-radius: 999px;
        background: #f3f8ff;
        color: #355070;
        border: 1px solid #dbeafe;
      }

      .content__divider {
        margin: 4px 0 !important;
        background: #e9f1fb;
      }

      .profile__content,
      .profile__content--empty,
      .content__data-item,
      .video-comment__item,
      .zhuye-card__content {
        border-radius: 18px;
      }
    }

    .video-list__video-card .profile__content,
    .video-list__video-card .profile__content--empty,
    .video-list__video-card .content__data-item,
    .video-list__video-card .zhuye-card__content,
    .video-list__video-card .video-comment__item,
    .video-list__video-card .stats-grid__item {
      background: #f7fbff !important;
      border: 1px solid #e4eef9;
      box-shadow: none !important;
    }

    .video-list__video-card .profile__label,
    .video-list__video-card .stats__label,
    .video-list__video-card .data-section__title,
    .video-list__video-card .video-comment__header {
      color: #4f6783;
      font-weight: 600;
    }

    .video-list__video-card .comment-item__quote {
      background: #edf5ff;
      color: #58708c;
    }

    .video-list__video-card .video-section__player-wrap,
    .video-list__video-card .video-section__cover-wrap,
    .video-list__video-card .zhuye-card__img-wrap {
      border-radius: 20px;
      overflow: hidden;
      border: 1px solid #e4eef9;
      box-shadow: 0 8px 24px rgba(22, 119, 255, 0.06);
    }

    .video-list__card-wrap {
      gap: 24px;
    }

    .empty-state {
      border-radius: 24px;
      border: 1px solid #e4eef9;
      box-shadow: 0 14px 32px rgba(22, 119, 255, 0.05);
    }

    .video-list__pagination {
      margin-top: 8px;
    }

    @media (max-width: 1280px) {
      .video-list__card-wrap {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 960px) {
      padding: 12px;

      .video-list__sort-buttons {
        position: static;
        flex-wrap: wrap;
      }

      .video-list__douyin-card .douyin-card__content,
      .video-list__video-card .video-card__layout {
        flex-direction: column;
      }

      .video-list__video-card .video-card__info-section {
        padding: 18px;
      }
    }
  }

  .address.address--light-douyin {
    position: relative;
    overflow: hidden;
    background:
      radial-gradient(circle at 8% 2%, rgba(37, 244, 238, 0.2), transparent 26%),
      radial-gradient(circle at 82% 0%, rgba(22, 119, 255, 0.16), transparent 30%),
      radial-gradient(circle at 96% 26%, rgba(254, 44, 85, 0.09), transparent 26%),
      linear-gradient(180deg, #f8fbff 0%, #eef6ff 58%, #f7fbff 100%) !important;

    &::before {
      position: absolute;
      inset: 0;
      pointer-events: none;
      content: '';
      background-image:
        linear-gradient(rgba(22, 119, 255, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(22, 119, 255, 0.03) 1px, transparent 1px);
      background-size: 46px 46px;
      mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.58), transparent 76%);
    }

    .video-list-container {
      position: relative;
      z-index: 1;
      max-width: 1680px;
    }

    .video-list__douyin-card {
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.72) !important;
      border-radius: 30px !important;
      background:
        linear-gradient(135deg, rgba(255, 255, 255, 0.88), rgba(255, 255, 255, 0.58)),
        radial-gradient(circle at 0% 0%, rgba(22, 119, 255, 0.15), transparent 34%),
        radial-gradient(circle at 96% 0%, rgba(37, 244, 238, 0.18), transparent 36%) !important;
      box-shadow: 0 24px 64px rgba(22, 119, 255, 0.12) !important;
      backdrop-filter: blur(22px) saturate(150%);

      &::before {
        position: absolute;
        inset: 0;
        padding: 1px;
        pointer-events: none;
        border-radius: inherit;
        content: '';
        background: linear-gradient(120deg, rgba(255, 255, 255, 0.9), rgba(22, 119, 255, 0.26), rgba(37, 244, 238, 0.26), rgba(254, 44, 85, 0.14));
        -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
      }

      .ant-card-body {
        position: relative;
        z-index: 1;
        padding: 28px !important;
      }

      .douyin-card__content {
        gap: 24px !important;
      }

      .douyin-card__left,
      .douyin-card__right {
        border: 1px solid #e2eefb !important;
        border-radius: 24px !important;
        background: rgba(255, 255, 255, 0.64) !important;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 10px 26px rgba(22, 119, 255, 0.06) !important;
        backdrop-filter: blur(16px);
      }

      .douyin-card__region-img {
        border-radius: 20px;
        border: 1px solid #dcecff;
        background: rgba(247, 251, 255, 0.74);
        backdrop-filter: blur(10px);
      }

      .douyin-comment__title {
        color: #10233f !important;
        font-weight: 800;

        i {
          color: #fe2c55;
        }
      }

      .douyin-comment__item {
        border-bottom-color: #edf3fa !important;
      }

      .user-info__username,
      .comment-item__text {
        color: #25364d !important;
      }

      .user-info__time,
      .empty-state__hint,
      .load-more__no-more {
        color: #8aa0b8 !important;
      }

      .load-more__btn {
        color: #1677ff !important;
      }
    }

    .video-list__sort-buttons {
      border: 1px solid #dcecff !important;
      border-radius: 22px !important;
      background: rgba(255, 255, 255, 0.72) !important;
      box-shadow: 0 14px 32px rgba(22, 119, 255, 0.09) !important;
      backdrop-filter: blur(18px) saturate(150%);

      .sort-buttons__label {
        color: #355070 !important;
        font-weight: 800 !important;

        &::before {
          display: inline-block;
          width: 8px;
          height: 8px;
          margin-right: 8px;
          border-radius: 50%;
          background: #fe2c55;
          box-shadow: 0 0 12px rgba(254, 44, 85, 0.38);
          content: '';
        }
      }

      .sort-btn,
      .reset-btn {
        border-radius: 999px !important;
        border-color: #d9eaff !important;
        color: #355070;
        font-weight: 600;
      }

      .sort-btn.ant-btn-primary {
        background: #1677ff !important;
        border-color: #1677ff !important;
        box-shadow: 0 10px 22px rgba(22, 119, 255, 0.22) !important;
      }

      .ant-select-selection {
        border-color: #d9eaff;
        border-radius: 999px;
        background: rgba(247, 251, 255, 0.76);
        backdrop-filter: blur(10px);
      }
    }

    .video-list__video-card {
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.72) !important;
      border-radius: 28px !important;
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.86), rgba(251, 253, 255, 0.64)),
        radial-gradient(circle at 0% 0%, rgba(22, 119, 255, 0.08), transparent 32%) !important;
      box-shadow: 0 18px 42px rgba(22, 119, 255, 0.09) !important;
      backdrop-filter: blur(18px) saturate(145%);

      &::before {
        position: absolute;
        inset: 0;
        padding: 1px;
        pointer-events: none;
        border-radius: inherit;
        content: '';
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.86), rgba(22, 119, 255, 0.16), rgba(37, 244, 238, 0.18));
        -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
      }

      &:hover {
        transform: translateY(-4px);
        border-color: #bfddff !important;
        box-shadow: 0 22px 50px rgba(22, 119, 255, 0.14), 0 0 0 1px rgba(37, 244, 238, 0.18) !important;
      }

      .ant-card-body {
        position: relative;
        z-index: 1;
        padding: 26px !important;
      }

      .video-card__info-section {
        border: 1px solid #e2eefb !important;
        border-radius: 24px !important;
        background: rgba(255, 255, 255, 0.64) !important;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.88);
        backdrop-filter: blur(14px);
      }

      .info-section__header {
        border-bottom-color: #edf3fa !important;
      }

      .header__title {
        color: #10233f !important;
        font-size: 19px !important;
        font-weight: 800 !important;

        &::before {
          display: inline-block;
          width: 8px;
          height: 8px;
          margin-right: 8px;
          border-radius: 50%;
          background: #25d6d2;
          box-shadow: 0 0 12px rgba(37, 214, 210, 0.4);
          content: '';
        }
      }

      .avatar-row__avatar {
        border: 4px solid #fff !important;
        box-shadow: 0 0 0 4px rgba(22, 119, 255, 0.09), 0 14px 28px rgba(22, 119, 255, 0.16) !important;
      }

      .nickname__text {
        color: #10233f !important;
        font-size: 24px !important;
        font-weight: 800 !important;
      }

      .meta-row__item {
        border: 1px solid #d9eaff !important;
        border-radius: 999px !important;
        background: #f3f8ff !important;
        color: #355070 !important;
        font-weight: 600;
      }

      .meta-row__region {
        border-color: rgba(37, 214, 210, 0.35) !important;
        background: rgba(37, 244, 238, 0.08) !important;
        color: #0f8f9a !important;
      }

      .status-fetched-btn,
      .status-button-wrapper .ant-btn-primary {
        border-radius: 999px !important;
        background: #1677ff !important;
        border-color: #1677ff !important;
        box-shadow: 0 10px 22px rgba(22, 119, 255, 0.22) !important;
        font-weight: 700 !important;
      }

      .profile__content,
      .profile__content--empty,
      .content__data-item,
      .zhuye-card__content,
      .video-comment__item,
      .stats-grid__item {
        border: 1px solid #e2eefb !important;
        border-radius: 18px !important;
        background: rgba(247, 251, 255, 0.72) !important;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.82) !important;
        backdrop-filter: blur(10px);
      }

      .stats-grid__icon {
        background: rgba(22, 119, 255, 0.1) !important;
        color: #1677ff !important;
      }

      .stats-grid__icon--fans {
        background: rgba(254, 44, 85, 0.08) !important;
        color: #fe2c55 !important;
      }

      .stats-grid__icon--follow {
        background: rgba(37, 244, 238, 0.1) !important;
        color: #0f8f9a !important;
      }
    }

    .empty-state {
      border: 1px solid #e2eefb !important;
      border-radius: 24px !important;
      background: rgba(255, 255, 255, 0.72) !important;
      box-shadow: 0 14px 32px rgba(22, 119, 255, 0.06) !important;
      backdrop-filter: blur(16px);

      i {
        color: #1677ff !important;
      }
    }
  }
</style>

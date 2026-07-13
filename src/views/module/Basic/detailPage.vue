<template>
  <div class="basic">
    <div class="video-list-container">
      <!-- 头部卡片区域 -->
      <div class="video-list__page-header">
        <!-- 新增：用户信息卡片空状态 -->
        <a-card class="video-list__user-card empty-card" v-if="!userInfo.nickname && !loading" hoverable>
          <div class="empty-card__wrap">
            <a-empty image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg" description="暂无用户信息">
              <a-button type="primary" @click="getList()">刷新重试</a-button>
            </a-empty>
          </div>
        </a-card>

        <!-- 原有用户信息卡片（优化布局：增加截图展示区域） -->
        <a-card class="video-list__user-card" v-else-if="userInfo.nickname" hoverable>
          <div class="user-card__wrap">
            <div class="user-card__avatar">
              <a-avatar :size="120" :src="getUrl(userInfo.touxiang)"></a-avatar>
            </div>
            <div class="user-card__base-info">
              <h3 class="base-info__nickname">
                {{ userInfo.nickname || '未知用户' }}
                <span style="color: purple; font-size: 14px">{{
                  userInfo.real_name ? ' (' + userInfo.real_name + ')' : ''
                }}</span>
              </h3>
              <!-- 抖音ID（优化样式） -->
              <p class="base-info__douyin-id">
                {{ '抖音号：' + accountData.douyinId }}
              </p>
              <!-- 用户简介：单行省略，适配长文本 -->
              <p class="base-info__profile" v-if="userInfo.profile_text">
                <span class="base-info__label">简介：</span>
                <span class="base-info__text">{{ userInfo.profile_text || '暂无简介' }}</span>
              </p>
              <!-- 性别/年龄等任意字段：纯标签化包裹，不判断内容 -->
              <div class="base-info__tags">
                <span class="base-info__tag">{{ userInfo.gender || '' }}</span>
              </div>
              <div class="base-info__meta">
                <span class="meta__item"> <a-icon type="like" /> 获赞数：{{ userInfo.likes_count || '未知' }} </span>

                <!-- 关注数：根据是否可点击动态切换样式 -->
                <span class="meta__item">
                  <a-icon type="star" /> 关注数：
                  <template v-if="accountData.followStatus == 1">
                    <a href="javascript:;" class="meta__clickable-link" @click="openUserDetails(accountData, '5')">
                      {{ userInfo.follow_count || '未知' }}
                    </a>
                  </template>
                  <template v-else>
                    {{ userInfo.follow_count || '未知' }}
                  </template>
                </span>

                <!-- 粉丝数：根据是否可点击动态切换样式 -->
                <span class="meta__item">
                  <a-icon type="user-add" /> 粉丝数：
                  <template v-if="accountData.fansStatus == 1">
                    <a href="javascript:;" class="meta__clickable-link" @click="openUserDetails(accountData, '4')">
                      {{ userInfo.fans_count || '未知' }}
                    </a>
                  </template>
                  <template v-else>
                    {{ userInfo.fans_count || '未知' }}
                  </template>
                </span>

                <!-- 历史爬取事件A标签 - 鼠标悬浮显示对比数据 -->
                <span class="meta__item history-crawl-item" v-if="accountData.oldString">
                  <a-icon type="clock-circle" style="color: #1890ff" />
                  <a
                    href="javascript:;"
                    class="history-crawl-link"
                    @mouseenter="showCrawlCompareTooltip($event)"
                    @mouseleave="hideCrawlCompareTooltip"
                  >
                    更新时间：{{ accountData.updateTime || '未获取' }}
                  </a>
                </span>

                <!-- 获取全部视频按钮 -->
                <div class="tooltip-header__btn-wrap" v-if="checkHasSingleSixTag(accountData.tags)">
                  <a-button
                    type="primary"
                    size="small"
                    @click="getAllVideo(accountData)"
                    :disabled="!accountData.douyinId"
                  >
                    <a-icon type="video-camera" /> 获取全部视频
                  </a-button>
                </div>
              </div>
              <div class="user-card__stats">
                <div class="stats__item">
                  <span class="stats__label">作品数</span>
                  <span class="stats__value">{{ total + ' / ' + userInfo.works_count || '未知' }}</span>
                </div>
                <div
                  class="stats__item ip-region-item"
                  @mouseenter="showIpHistoryTooltip($event)"
                  @mouseleave="handleIpTooltipLeave"
                >
                  <span class="stats__label">IP属地</span>
                  <span class="stats__value ip-region-value">
                    {{ userInfo.region || '未知' }}
                  </span>
                </div>
                <div class="stats__item">
                  <span class="stats__label">评论数</span>
                  <span class="stats__value history-crawl-item">
                    <a
                      v-if="accountData.counts"
                      href="javascript:;"
                      @click="openUserDetails(accountData, '3')"
                      class="history-crawl-link"
                    >
                      {{ accountData.counts }}
                    </a>
                    <span v-else>0</span>
                  </span>
                </div>
                <div class="stats__item">
                  <span class="stats__label">关联人员</span>
                  <span class="stats__value history-crawl-item">
                    <a
                      v-if="accountData.commentCount"
                      href="javascript:;"
                      @click="openUserDetails(accountData, '6')"
                      class="history-crawl-link"
                    >
                      {{ accountData.commentCount }}
                    </a>
                    <span v-else>0</span>
                  </span>
                </div>
              </div>
              <div class="user-card__operation-records" v-if="operationRecords.length > 0">
                <div class="operation-records__header">
                  <a-icon type="clock-circle-o" style="color: #1890ff" />
                  <span>操作记录</span>
                  <span class="operation-records__count">(共{{ operationRecords.length }}条)</span>
                </div>
                <div class="operation-records__list">
                  <div
                    v-for="record in operationRecords"
                    :key="`record-${record.id}`"
                    class="operation-record__item"
                    :class="`status-${record.status === '成功' ? 'success' : 'success'}`"
                  >
                    <div class="record-item__left">
                      <div class="record-item__type">{{ record.type }}</div>
                      <div class="record-item__content" :title="record.runingDetail">
                        {{ record.runingDetail }}
                      </div>
                    </div>
                    <div class="record-item__right">
                      <div class="record-item__time">
                        {{ record.createTime }}
                      </div>
                      <div class="record-item__status">
                        {{ record.status }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 核心修改：新增右侧截图展示区域（替代弹窗） -->
            <div class="user-card__screenshot">
              <div class="screenshot__header">
                <a-icon type="picture" style="color: #1890ff" />
                <span>个人信息截图</span>
              </div>
              <!-- 截图展示（适配长截图） -->
              <div class="screenshot__content">
                <div v-if="userInfo.zhuye" class="screenshot__img-wrap">
                  <img
                    :src="getUrl(userInfo.zhuye)"
                    alt="用户信息截图"
                    class="screenshot__img"
                    @error="handleImgError"
                    @click="previewScreenshot()"
                  />
                </div>
                <div v-else class="screenshot__empty">
                  <a-empty
                    image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                    description="暂无截图信息"
                    :imageStyle="{ width: '60px' }"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- 新增：操作记录区域 -->
        </a-card>
      </div>

      <!-- 视频列表区域 -->
      <a-spin :spinning="loading">
        <!-- 新增：视频列表空状态 -->
        <div class="video-list__empty" v-if="!loading && videoList.length === 0">
          <a-empty image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg" description="暂无视频数据">
            <a-button type="primary" @click="getList()">刷新获取视频</a-button>
          </a-empty>
        </div>

        <!-- 原有视频列表（仅当有数据时显示） -->
        <div class="video-list__card-wrap" v-else>
          <a-card
            v-for="(video, index) in videoList"
            :key="`video-${video.id}-${index}`"
            class="video-list__video-card"
            hoverable
          >
            <div class="video-card__content">
              <div class="video-card__main">
                <!-- 左侧视频区域 -->
                <div class="video-card__left">
                  <!-- 视频播放区域 - 核心修复 -->
                  <div class="video-card__player-wrap">
                    <div ref="playerContainer" class="video-player-container" :data-video-id="video.id">
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
                    <div>
                      <a-icon type="message" />
                      <span style="margin-left: 7px"
                        >全部评论 {{ video.comments.length > 0 ? ' (' + video.comments.length + ')' : '' }}</span
                      >
                    </div>
                    <div class="btn_box" v-if="video.comments.length > 0">
                      <a href="javascript:;" rel="noopener noreferrer" @click="openUserDetails(video, '1')">
                        评论人员信息
                      </a>
                    </div>
                  </div>

                  <div class="video-comment__scroll">
                    <div class="video-comment__list" v-if="video.comments.length > 0">
                      <div
                        v-for="(comment, cIndex) in getLoadedComments(index)"
                        :key="`comment-${video.id}-${cIndex}`"
                        class="video-comment__item"
                      >
                        <a-popover
                          :placement="commentPopoverPlacement"
                          auto-adjust-overflow
                          :get-popup-container="getPopupContainer"
                          overlayClassName="comment-user-tooltip-popover"
                          :overlayStyle="{ maxWidth: 'calc(100vw - 24px)', maxHeight: 'calc(100vh - 24px)' }"
                          :mouseEnterDelay="0.15"
                          :mouseLeaveDelay="0.12"
                          arrow-point-at-center
                        >
                          <template slot="content">
                            <div
                              class="comment-user-tooltip-popover-content"
                              :class="{ 'has-screenshot': comment.zhuye }"
                            >
                              <div class="tooltip-header">
                                <!-- 左侧：用户基本信息 + 统计项 + 按钮 -->
                                <div class="tooltip-header__left">
                                  <!-- 头像+基础信息行 -->
                                  <div class="tooltip-avatar-row">
                                    <a-avatar
                                      v-if="comment.touxiang"
                                      :size="62"
                                      :style="{ color: '#fff' }"
                                      :src="getUrl(comment.touxiang)"
                                      class="comment-user-avatar"
                                    ></a-avatar>
                                    <div v-else class="tooltip-avatar">
                                      {{ getShortNickname(comment.nickname) }}
                                    </div>
                                    <div class="tooltip-user-basic">
                                      <div class="tooltip-username">
                                        {{ comment.nickname || '匿名用户' }}
                                        <span class="author-info__douyin-id" v-if="comment.userUid">
                                          <a-icon type="idcard" size="small" />
                                          {{ comment.userUid }}
                                        </span>
                                      </div>
                                      <p class="base-info__profile" v-if="comment.profileText">
                                        <span class="base-info__label">简介：</span>
                                        <span class="base-info__text">{{ comment.profileText || '暂无简介' }}</span>
                                      </p>
                                      <div class="tooltip-user-id" v-if="comment.region">
                                        {{ comment.region }}
                                      </div>
                                    </div>
                                  </div>

                                  <!-- 统计项横向区域 - 优化版 -->
                                  <div class="tooltip-stats-card">
                                    <!-- 新增卡片容器 -->
                                    <div class="tooltip-stats-row">
                                      <div class="stats-item">
                                        <div class="stats-icon-wrapper">
                                          <!-- 图标背景容器 -->
                                          <a-icon type="star" class="stats-icon follow-icon" />
                                        </div>
                                        <div class="stats-content">
                                          <span class="stats-label">关注数</span>
                                          <!-- 去掉冒号更简洁 -->
                                          <span class="stats-value">{{ comment.followCount || 0 }}</span>
                                        </div>
                                      </div>
                                      <div class="stats-item divider"></div>
                                      <!-- 分隔线 -->
                                      <div class="stats-item">
                                        <div class="stats-icon-wrapper">
                                          <a-icon type="user-add" class="stats-icon fans-icon" />
                                        </div>
                                        <div class="stats-content">
                                          <span class="stats-label">粉丝数</span>
                                          <span class="stats-value">{{ comment.fansCount || 0 }}</span>
                                        </div>
                                      </div>
                                      <div class="stats-item divider"></div>
                                      <!-- 分隔线 -->
                                      <div class="stats-item">
                                        <div class="stats-icon-wrapper">
                                          <a-icon type="video-camera" class="stats-icon work-icon" />
                                        </div>
                                        <div class="stats-content">
                                          <span class="stats-label">作品数</span>
                                          <span class="stats-value">{{ comment.worksCount || 0 }}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <!-- 获取全部视频按钮 -->
                                  <div class="tooltip-header__btn-wrap" v-if="comment.status == 0">
                                    <a-button
                                      type="primary"
                                      size="small"
                                      @click="getAllVideo(comment)"
                                      :disabled="!comment.userUid"
                                    >
                                      <a-icon type="video-camera" /> 获取全部视频
                                    </a-button>
                                  </div>
                                </div>

                                <!-- 右侧：仅截图展示区域（有截图时显示） -->
                                <div
                                  class="tooltip-header__right"
                                  :class="{
                                    'has-screenshot': comment.zhuye,
                                  }"
                                >
                                  <div
                                    class="tooltip-screenshot__wrap tooltip-screenshot__wrap--loading"
                                    v-if="comment.zhuye"
                                    @click="previewUserScreenshot(comment)"
                                  >
                                    <img
                                      :src="getUrl(comment.zhuye)"
                                      alt="用户截图"
                                      class="tooltip-screenshot__img"
                                      @error="handleImgError"
                                      @load="handleTooltipImgLoad"
                                    />
                                  </div>
                                </div>
                              </div>
                              <!-- 浮窗底部：装饰线 -->
                              <div class="tooltip-footer"></div>
                            </div>
                          </template>

                          <span
                            class="comment-popover-trigger"
                            @mouseenter="setCommentPopoverPlacement($event, comment)"
                          >
                            <a-avatar
                              v-if="comment.touxiang"
                              :size="24"
                              :style="{ color: '#fff' }"
                              :src="getUrl(comment.touxiang)"
                              @click.stop="goDetailPage(comment, video)"
                              class="comment-user-avatar"
                            ></a-avatar>

                            <a-avatar
                              v-else
                              :size="24"
                              @click.stop="goDetailPage(comment, video)"
                              :style="{
                                backgroundColor: getRandomColor(comment.id),
                                color: '#fff',
                              }"
                              class="comment-user-avatar"
                            >
                              {{ getShortNickname(comment.nickname) }}
                            </a-avatar>
                          </span>
                        </a-popover>
                        <div class="comment-item__content">
                          <div class="comment-item__header">
                            <!-- 用户名增加悬浮事件 -->
                            <span class="comment-item__username">{{ comment.nickname }}</span>
                            <span class="comment-item__time">{{ comment.commentTime }}</span>
                          </div>
                          <div v-if="comment.replyTo" class="comment-item__quote">
                            <i class="el-icon-chat-line-round quote__icon"></i>
                            <span class="quote__label">@{{ comment.replyTo }}：</span>
                            <span class="quote__text">{{ getReplyContent(comment.replyTo, video.comments) }}</span>
                          </div>
                          <p class="comment-item__text">
                            {{ comment.commentText }}
                          </p>
                        </div>
                      </div>

                      <div class="video-comment__load-more">
                        <a-spin size="small" v-if="getCommentStatus(index).loading" />
                        <a-button
                          v-else-if="hasMoreComments(index)"
                          type="text"
                          size="small"
                          @click.stop="loadMoreComments(index)"
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
            </div>
          </a-card>
        </div>

        <!-- 分页组件（仅当有数据时显示） -->
        <a-pagination
          v-show="!loading && Number(total) > 0"
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

      <!-- 新增：截图全屏预览弹窗（点击截图时放大查看） -->
      <a-modal
        v-model="fullscreenScreenshotVisible"
        title="个人信息截图预览"
        width="40%"
        destroyOnClose
        :footer="null"
        @cancel="fullscreenScreenshotVisible = false"
      >
        <div class="fullscreen-screenshot__wrap">
          <img
            :src="getUrl(userInfo.zhuye)"
            alt="用户信息截图"
            class="fullscreen-screenshot__img"
            @error="handleImgError"
          />
        </div>
      </a-modal>

      <!-- 引入视频列表弹窗组件 -->
      <VideoListModal ref="videoListModalRef" :visible.sync="videoListModalVisible" />

      <!-- 原有：历史爬取对比数据浮窗 -->
      <div
        v-if="crawlCompareTooltipVisible"
        class="crawl-compare-tooltip"
        :style="{
          left: `${crawlCompareTooltipPos.x + 10}px`,
          top: `${crawlCompareTooltipPos.y + 10}px`,
        }"
      >
        <div class="compare-tooltip__header">
          <a-icon type="history" /> 上次爬取数据对比（{{ accountData.oldTime }}）
        </div>
        <div class="compare-tooltip__body">
          <div class="compare-item">
            <span class="compare-item__label">关注数：</span>
            <span class="compare-item__last" style="color: #999">上次{{ lastCrawlInfo.follow_count }}</span>
            <span class="compare-item__current" style="color: #1890ff">当前{{ userInfo.follow_count }}</span>
            <span :class="['compare-item__diff', getCompareClass(userInfo.follow_count, lastCrawlInfo.follow_count)]">
              {{ getCompareDiff(userInfo.follow_count, lastCrawlInfo.follow_count) }}
            </span>
          </div>
          <div class="compare-item">
            <span class="compare-item__label">粉丝数：</span>
            <span class="compare-item__last" style="color: #999">上次{{ lastCrawlInfo.fans_count }}</span>
            <span class="compare-item__current" style="color: #1890ff">当前{{ userInfo.fans_count }}</span>
            <span :class="['compare-item__diff', getCompareClass(userInfo.fans_count, lastCrawlInfo.fans_count)]">
              {{ getCompareDiff(userInfo.fans_count, lastCrawlInfo.fans_count) }}
            </span>
          </div>
          <div class="compare-item">
            <span class="compare-item__label">获赞数：</span>
            <span class="compare-item__last" style="color: #999">上次{{ lastCrawlInfo.likes_count }}</span>
            <span class="compare-item__current" style="color: #1890ff">当前{{ userInfo.likes_count }}</span>
            <span :class="['compare-item__diff', getCompareClass(userInfo.likes_count, lastCrawlInfo.likes_count)]">
              {{ getCompareDiff(userInfo.likes_count, lastCrawlInfo.likes_count) }}
            </span>
          </div>
          <div class="compare-item">
            <span class="compare-item__label">作品数：</span>
            <span class="compare-item__last" style="color: #999">上次{{ lastCrawlInfo.video_count }}</span>
            <span class="compare-item__current" style="color: #1890ff">当前{{ userInfo.works_count }}</span>
            <span :class="['compare-item__diff', getCompareClass(userInfo.works_count, lastCrawlInfo.video_count)]">
              {{ getCompareDiff(userInfo.works_count, lastCrawlInfo.video_count) }}
            </span>
          </div>
        </div>
      </div>
      <!-- IP属地历史记录悬浮弹窗 -->
      <div
        v-if="ipHistoryTooltipVisible"
        class="ip-history-tooltip"
        :style="{
          left: `${ipHistoryTooltipPos.x + 10}px`,
          top: `${ipHistoryTooltipPos.y + 10}px`,
        }"
        @mouseenter="handleIpTooltipEnter"
        @mouseleave="handleIpTooltipLeave"
      >
        <div class="ip-history__header">
          <a-icon type="environment" style="color: #fa8c16" />
          IP属地历史获取记录
        </div>
        <div class="ip-history__body">
          <!-- 模拟历史IP列表 -->
          <div class="ip-history__list" v-if="ipHistoryList.length > 0">
            <div v-for="(item, idx) in ipHistoryList" :key="idx" class="ip-history__item">
              <span class="ip-history__region">{{ item.ipAddress }}</span>
              <span class="ip-history__time">{{ item.createTime }}</span>
            </div>
          </div>
          <div class="ip-history__empty" v-else>暂无IP属地历史记录</div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
  import { videoList, getAccount, ipAddressList, tags, updateComment, RunLog } from '@/api/module/Basic';
  import videojs from 'video.js';
  import 'video.js/dist/video-js.css';
  import VideoListModal from '@/components/VideoListModal';

  export default {
    name: 'VideoDetailList',
    components: { VideoListModal },
    data() {
      return {
        videoList: [],
        operationRecords: [],
        queryParam: {
          pageNum: 1,
          pageSize: 10,
          devId: '',
          douyinId: '',
        },
        loading: false,
        // 模拟含中文单位的测试数据（核心测试2.5万/1.2k这种格式）
        userInfo: {
          nickname: '',
          real_name: '',
          gender: '',
          follow_count: '', // 字符串+万单位
          fans_count: '', // 字符串+万单位
          likes_count: '', // 字符串+万单位
          works_count: '', // 纯数字
          region: '', // IP属地
          signature: '',
          touxiang: '',
          douyinId: '',
          zhuye: '', // 新增：用户信息截图字段
        },
        // 上次爬取的中文单位数据
        lastCrawlInfo: {
          follow_count: '', // 2万 → 20000
          fans_count: '', // 6万 → 60000
          likes_count: '', // 12万 → 120000
        },
        accountData: {},
        currentPlayVideoId: null,
        total: 0,
        commentLoadedStatus: {},
        playerInstances: {},
        tooltipVisible: false,
        tooltipPosition: { x: 0, y: 0 },
        currentUserInfo: {},
        videoListModalVisible: false,
        crawlCompareTooltipVisible: false,
        crawlCompareTooltipPos: { x: 0, y: 0 },
        // IP历史弹窗相关
        ipHistoryTooltipVisible: false,
        ipHistoryTooltipPos: { x: 0, y: 0 },
        ipHistoryList: [],
        // 修复3：新增延迟隐藏的定时器变量，核心控制弹窗显隐
        ipTooltipTimer: null,
        // 新增：截图全屏预览弹窗
        fullscreenScreenshotVisible: false,
        // 新增：用户浮窗延迟隐藏定时器
        tooltipHideTimer: null,
        commentPopoverPlacement: 'rightTop',
      };
    },
    mounted() {
      const { devId, douyinId } = this.$route.query || {};
      if (devId && douyinId) {
        this.queryParam.devId = devId;
        this.queryParam.douyinId = douyinId;
        this.fetchUserInfo(devId, douyinId);
        this.getList();
      } else {
        this.initCommentLoadedStatus();
      }
    },
    beforeDestroy() {
      Object.values(this.playerInstances).forEach((player) => {
        if (player && player.dispose) player.dispose();
      });
      this.playerInstances = {};
      // 修复4：组件销毁时清除定时器，避免内存泄漏
      clearTimeout(this.ipTooltipTimer);
      // 清除浮窗延迟隐藏定时器
      clearTimeout(this.tooltipHideTimer);
    },
    methods: {
      setCommentPopoverPlacement(event, comment) {
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
        const triggerY = event?.clientY || 0;
        const bottomSpace = viewportHeight - triggerY;
        const needBottomSpace = comment?.zhuye ? 520 : 340;

        if (bottomSpace < needBottomSpace) {
          this.commentPopoverPlacement = 'rightBottom';
        } else if (triggerY < 220) {
          this.commentPopoverPlacement = 'rightTop';
        } else {
          this.commentPopoverPlacement = 'right';
        }
      },
      // 新增：打开全屏截图预览
      previewScreenshot() {
        if (this.userInfo.zhuye) {
          this.fullscreenScreenshotVisible = true;
        } else {
          this.$message.warning('暂无截图可预览');
        }
      },
      // 新增：预览用户浮窗中的截图
      previewUserScreenshot(comment) {
        const target = comment || this.currentUserInfo;
        if (target.zhuye) {
          // 临时替换用户信息截图用于预览
          this.userInfo.zhuye = target.zhuye;
          this.fullscreenScreenshotVisible = true;
        } else {
          this.$message.warning('暂无截图可预览');
        }
      },
      // 新增：图片加载失败处理
      handleImgError(e) {
        e.target.src = 'https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg';
        e.target.alt = '截图加载失败';
        e.target.classList.add('is-loaded');
        e.target.parentElement?.classList.remove('tooltip-screenshot__wrap--loading');
      },
      handleTooltipImgLoad(e) {
        e.target.classList.add('is-loaded');
        e.target.parentElement?.classList.remove('tooltip-screenshot__wrap--loading');
      },
      // 核心转换方法【将2.5万/1k/1234等格式转为纯数字】
      formatToNumber(numStr) {
        if (!numStr || numStr === '未知' || numStr === '无') return 0;
        const str = String(numStr).trim();
        if (str.includes('万')) return Number.parseFloat(str.replace('万', '')) * 10000;
        if (str.includes('k') || str.includes('K')) return Number.parseFloat(str.replace(/k|K/g, '')) * 1000;
        return Number.parseFloat(str) || 0;
      },
      // 可选：将纯数字转回 万/k 格式
      formatToUnit(num, unitType = '万') {
        if (!num || num === 0) return '0';
        if (unitType === '万') return (num / 10000).toFixed(2) + '万';
        if (unitType === 'k') return (num / 1000).toFixed(1) + 'k';
        return num.toString();
      },
      // 获取用户信息
      async fetchUserInfo(devId, douyinId) {
        try {
          const userRes = await getAccount({ devId, douyinId });
          const ipAddress = await ipAddressList({ douyinId });

          this.ipHistoryList = ipAddress.rows;

          this.accountData = userRes.account;
          this.userInfo = userRes.account.jsonString ? JSON.parse(userRes.account.jsonString) : {};

          console.log(this.userInfo);

          this.lastCrawlInfo = userRes.account.oldString ? JSON.parse(userRes.account.oldString) : {};
        } catch (error) {
          // this.userInfo = {};
          this.$message.error('获取用户信息失败');
        }
      },
      // 获取视频列表
      async getList() {
        this.loading = true;
        try {
          const response = await videoList(this.queryParam);
          const logData = await RunLog({ douyinId: this.queryParam.douyinId });
          this.operationRecords = logData.rows;
          this.videoList =
            response.rows?.map((item) => {
              try {
                const content = item.content ? JSON.parse(item.content) : [];

                const jsonString = item.jsonString ? JSON.parse(item.jsonString) : {};
                return {
                  ...item,
                  comments: Array.isArray(content) ? content : [],
                  jsonString: jsonString || {},
                };
              } catch (e) {
                console.error(`解析content失败:`, e);
                return { ...item, comments: [], jsonString: {} };
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

      // 核心：判断tags中是否包含"单六条"
      checkHasSingleSixTag(valye) {
        if (!valye) return false;
        let tags = valye.split(',');
        if (!Array.isArray(tags)) return false;
        // 遍历数组，判断是否存在'单六条'这个值
        return tags.some((tag) => tag == '前六条');
      },
      // 初始化视频播放器
      initVideoPlayers() {
        Object.values(this.playerInstances).forEach((player) => {
          if (player && player.dispose) player.dispose();
        });
        this.playerInstances = {};
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
              language: 'zh-CN',
              controlBar: {
                volumePanel: { inline: false, vertical: true },
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
              this.handleVideoPlay(video.id);
            });
            player.on('pause', () => {
              this.handleVideoPause(video.id);
            });
            this.playerInstances[video.id] = player;
          }
        });
      },
      // 评论加载相关
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
            if (player && !player.paused()) player.pause();
          }
        });
        this.currentUserInfo = currentVideoId;
      },
      handleVideoPause(pauseVideoId) {
        if (this.currentPlayVideoId === pauseVideoId) {
          this.currentPlayVideoId = null;
        }
      },
      // 工具方法
      changeSize(pageNum) {
        this.queryParam.pageNum = pageNum;
        this.getList();
        this.scrollToTop();
      },
      scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      getUrl(url) {
        if (!url) return;
        return window.origin + process.env.VUE_APP_BASE_API + url;
      },
      openUserDetails(video, type) {
        this.videoListModalVisible = true;
        this.$nextTick(() => {
          this.$refs.videoListModalRef.getListByParams(type, type == 1 ? video.uid : video.douyinId);
        });
      },

      handleCountClick(video, type) {
        this.videoListModalVisible = true;
        this.$nextTick(() => {
          this.$refs.videoListModalRef.getListByParams(type, type == 1 ? video.uid : video.douyinId);
        });
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
      getReplyContent(replyTo, comments) {
        const targetComment = comments.find((item) => item.nickname === replyTo);
        return targetComment?.commentText || '该评论已删除';
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

      getAllVideo(item) {
        let data = {
          devId: item.devId,
          douyinId: item.userUid,
          taskId: 4,
          tags: '视频,基本信息,评论',
          userId: this.accountData.douyinId,
        };
        tags(data).then((response) => {
          updateComment({ userUid: item.userUid, status: 1 });
          this.fetchUserInfo(this.queryParam.devId, this.queryParam.douyinId);
          item.status = 1;

          this.videoList.forEach((video, videoIndex) => {
            if (video.devId == item.devId && Array.isArray(video.comments)) {
              video.comments.forEach((comment, commentIndex) => {
                if (comment.userUid == item.douyinId) {
                  this.$set(this.videoList[videoIndex].comments[commentIndex], 'status', 1);
                }
              });
            }
          });

          this.$forceUpdate();
          this.$notification.success({
            message: '获取全部视频的任务已启动，结果会同步更新，您可先进行其他操作',
          });
        });
      },
      getPopupContainer() {
        return document.body;
      },
      // 新增：延迟隐藏浮窗
      hideUserTooltipDelay() {
        // 设置300ms延迟隐藏，给用户足够时间移到浮窗内
        this.tooltipHideTimer = setTimeout(() => {
          this.tooltipVisible = false;
          this.currentUserInfo = {};
        }, 300);
      },
      // 新增：取消隐藏浮窗（鼠标移入浮窗时调用）
      cancelHideUserTooltip() {
        clearTimeout(this.tooltipHideTimer);
      },

      goDetailPage(item, video) {
        if (!item.userUid) return this.$message.error('抖音号不存在！');

        const routeData = this.$router.resolve({
          name: 'basicDetailPage',
          query: {
            devId: video.devId,
            douyinId: item.userUid,
            type: '1',
          },
        });
        // 打开新标签页
        window.open(routeData.href, '_blank');
      },
      // 原有隐藏方法保留（兼容）
      hideUserTooltip() {
        this.tooltipVisible = false;
        this.currentUserInfo = {};
      },
      // 历史爬取对比浮窗
      showCrawlCompareTooltip(event) {
        this.crawlCompareTooltipPos = { x: event.clientX, y: event.clientY };
        this.crawlCompareTooltipVisible = true;
        this.$nextTick(() => {
          const tooltipEl = document.querySelector('.crawl-compare-tooltip');
          if (tooltipEl) {
            const tooltipRect = tooltipEl.getBoundingClientRect();
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            if (tooltipRect.right > windowWidth) this.crawlCompareTooltipPos.x = event.clientX - tooltipRect.width - 10;
            if (tooltipRect.bottom > windowHeight)
              this.crawlCompareTooltipPos.y = event.clientY - tooltipRect.height - 10;
          }
        });
      },
      hideCrawlCompareTooltip() {
        this.crawlCompareTooltipVisible = false;
      },
      // 修复5：IP弹窗核心方法 - 显示弹窗（清除原有定时器）
      showIpHistoryTooltip(event) {
        // 清除延迟隐藏的定时器，避免重复隐藏
        clearTimeout(this.ipTooltipTimer);
        this.ipHistoryTooltipPos = { x: event.clientX, y: event.clientY };
        this.ipHistoryTooltipVisible = true;
        // 位置自适应：超出屏幕边界自动偏移
        this.$nextTick(() => {
          const tooltipEl = document.querySelector('.ip-history-tooltip');
          if (!tooltipEl) return;
          const tooltipRect = tooltipEl.getBoundingClientRect();
          const windowWidth = window.innerWidth;
          const windowHeight = window.innerHeight;
          // 超出右侧 → 左移
          if (tooltipRect.right > windowWidth) this.ipHistoryTooltipPos.x = event.clientX - tooltipRect.width - 10;
          // 超出下侧 → 上移
          if (tooltipRect.bottom > windowHeight) this.ipHistoryTooltipPos.y = event.clientY - tooltipRect.height - 10;
        });
      },
      // 修复6：IP弹窗核心方法 - 鼠标进入弹窗，清除定时器保持显示
      handleIpTooltipEnter() {
        clearTimeout(this.ipTooltipTimer);
      },
      // 修复7：IP弹窗核心方法 - 鼠标离开（IP属地/弹窗），延迟300ms隐藏
      handleIpTooltipLeave() {
        clearTimeout(this.ipTooltipTimer);
        this.ipTooltipTimer = setTimeout(() => {
          this.ipHistoryTooltipVisible = false;
        }, 300);
      },
      // 计算差值
      getCompareDiff(current, last) {
        const currentNum = this.formatToNumber(current);
        const lastNum = this.formatToNumber(last);
        const diff = currentNum - lastNum;
        if (diff > 0) return `+${diff} ↑`;
        if (diff < 0) return `${diff} ↓`;
        return `0 —`;
      },
      // 判断样式
      getCompareClass(current, last) {
        const currentNum = this.formatToNumber(current);
        const lastNum = this.formatToNumber(last);
        const diff = currentNum - lastNum;
        if (diff > 0) return 'increase';
        if (diff < 0) return 'decrease';
        return 'same';
      },
    },
  };
</script>
<style lang="less">
  .tooltip-header {
    background: linear-gradient(135deg, #f8fbff 0%, #e8f4ff 100%);
    padding: 16px 20px;
    border-radius: 12px 12px 0 0;
    display: flex;
    align-items: flex-start;
    gap: 20px;
    border-bottom: 1px solid #e5eef7;
    width: 100%;
    max-height: calc(100vh - 92px);
    box-sizing: border-box;
    overflow-x: hidden;
    overflow-y: auto;

    .tooltip-header__left {
      flex: 0 0 380px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 0;
      max-width: 380px;

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
          box-shadow: 0 2px 8px rgba(0, 122, 255, 0.2); // 头像加阴影
        }

        .tooltip-user-basic {
          flex: 1;

          .tooltip-username {
            font-size: 15px; // 增大字体
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
              margin-left: 8px; // 增加间距
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

      // 统计项卡片容器 - 核心美化
      .tooltip-stats-card {
        background: #fff; // 白色背景突出
        border-radius: 8px;
        padding: 12px 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); // 轻微阴影
        border: 1px solid #f0f5ff;

        .tooltip-stats-row {
          display: flex;
          justify-content: space-around; // 均匀分布
          align-items: center;
          gap: 8px;

          .stats-item {
            display: flex;
            flex-direction: column; // 图标在上，文字在下
            align-items: center;
            gap: 6px;
            flex: 1; // 均分宽度
            padding: 8px 0;

            // 分隔线样式
            &.divider {
              width: 1px;
              height: 40px;
              background: #e5eef7;
              flex: none;
              padding: 0;
            }

            // 图标背景容器
            .stats-icon-wrapper {
              width: 36px;
              height: 36px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;

              // 不同统计项不同背景色
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
              font-size: 18px; // 增大图标

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
                // 数值加高亮效果
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
        text-align: center; // 按钮居中

        button {
          padding: 0 16px; // 增大按钮内边距
          border-radius: 6px;
        }
      }
    }

    .tooltip-header__right {
      flex: 0 0 320px !important;
      width: auto !important;
      max-width: 320px;
      display: none;

      &.has-screenshot {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .tooltip-screenshot__wrap {
        position: relative;
        width: 100%;
        height: 430px;
        max-height: calc(100vh - 170px);
        min-height: 260px;
        border-radius: 8px;
        overflow: hidden;
        background: #f5f9ff;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        cursor: zoom-in;

        &.tooltip-screenshot__wrap--loading::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(100deg, #eef5ff 0%, #ffffff 45%, #eef5ff 90%);
          background-size: 220% 100%;
          animation: tooltipImageLoading 1.2s ease-in-out infinite;
        }

        &.tooltip-screenshot__wrap--loading::after {
          content: '图片加载中';
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          color: #8aa0b8;
          font-size: 12px;
          letter-spacing: 0;
        }

        .tooltip-screenshot__img {
          display: block;
          width: 100%;
          height: 100%;
          max-height: none;
          min-height: 0;
          object-fit: contain; // 完整展示图片
          object-position: center; // 居中显示
          opacity: 0;
          transition: opacity 0.25s ease, transform 0.2s ease;

          &.is-loaded {
            opacity: 1;
          }

          &:hover {
            transform: scale(1.02); // 轻微放大效果
          }
        }
      }
    }
  }

  @keyframes tooltipImageLoading {
    0% {
      background-position: 120% 0;
    }

    100% {
      background-position: -120% 0;
    }
  }

  .comment-user-tooltip-popover {
    max-width: calc(100vw - 24px);

    &.ant-popover-placement-right,
    &.ant-popover-placement-rightTop,
    &.ant-popover-placement-rightBottom {
      transform: translateX(14px);
    }

    &.ant-popover-placement-left,
    &.ant-popover-placement-leftTop,
    &.ant-popover-placement-leftBottom {
      transform: translateX(-14px);
    }

    &.ant-popover-placement-top,
    &.ant-popover-placement-topLeft,
    &.ant-popover-placement-topRight {
      transform: translateY(-12px);
    }

    &.ant-popover-placement-bottom,
    &.ant-popover-placement-bottomLeft,
    &.ant-popover-placement-bottomRight {
      transform: translateY(12px);
    }

    .ant-popover-inner {
      border-radius: 12px;
      overflow: hidden;
    }

    .ant-popover-inner-content {
      padding: 0;
    }
  }

  .comment-popover-trigger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .comment-user-tooltip-popover-content {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    width: 400px;
    max-width: calc(100vw - 24px);
    max-height: calc(100vh - 24px);
    overflow: hidden;
    font-size: 12px;
    color: #333;
    cursor: default;
  }

  .comment-user-tooltip-popover-content.has-screenshot {
    width: 780px;
  }

  @media (max-width: 860px) {
    .comment-user-tooltip-popover-content,
    .comment-user-tooltip-popover-content.has-screenshot {
      width: calc(100vw - 32px);
    }

    .tooltip-header {
      flex-direction: column;
      gap: 14px;
      padding: 14px;

      .tooltip-header__left {
        width: 100%;
        min-width: 0;
        max-width: none;
      }

      .tooltip-header__right {
        width: 100% !important;
        max-width: none;

        .tooltip-screenshot__wrap {
          height: 42vh;
          max-height: 42vh;
          min-height: 160px;
        }

        .tooltip-screenshot__img {
          max-height: none;
          min-height: 160px;
        }
      }
    }
  }

  .tooltip-footer {
    height: 4px;
    background: linear-gradient(90deg, #007aff 0%, #5856d6 100%);
    border-radius: 0 0 12px 12px;
  }
</style>

<style lang="less" scoped>
  /* 确保video.js控制栏的时长控件可见 */
  .video-js .vjs-current-time,
  .video-js .vjs-duration,
  .video-js .vjs-time-divider {
    display: block !important;
  }

  .ant-divider-horizontal {
    margin: 12px !important;
  }

  .btn_box {
    float: right;
    margin-right: 6px;

    a {
      font-weight: 700;
      font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
      text-decoration: underline;
      text-underline-offset: 4px;
      text-decoration-thickness: 1px;
      text-decoration-color: #1890ff;
    }
  }

  // 全屏截图预览样式
  .fullscreen-screenshot__wrap {
    padding: 10px 0;
    text-align: center;

    .fullscreen-screenshot__img {
      max-width: 100%;
      max-height: 70vh;
      object-fit: contain;
      border-radius: 4px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }
  }

  .basic {
    .video-list-container {
      padding: 20px;
      max-width: 1600px;
      margin: 0 auto;
      width: 100%;
      box-sizing: border-box;
      overflow: hidden;
      background-color: #f7f8fa;
      position: relative;

      // 截图展示区域样式 - 核心修改：无截图时隐藏
      .user-card__screenshot {
        flex: 0 0 280px;
        min-width: 240px;
        padding: 12px;
        border-left: 1px solid #eee;
        margin-left: 16px;
        // 无截图时隐藏整个右侧区域
        &.screenshot-hidden {
          display: none;
        }

        .screenshot__header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          font-weight: 600;
          color: #1890ff;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #f0f8ff;
        }

        .screenshot__content {
          width: 100%;
          min-height: 180px;
          display: flex;
          align-items: center;
          justify-content: center;

          .screenshot__img-wrap {
            width: 100%;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            transition: all 0.3s ease;
            cursor: zoom-in;

            &:hover {
              box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
              transform: translateY(-2px);
            }

            .screenshot__img {
              width: 100%;
              height: auto;
              display: block;
              object-fit: contain;
            }
          }

          .screenshot__empty {
            width: 100%;
            padding: 20px 0;
            text-align: center;
          }
        }
      }

      // 抖音ID样式
      .base-info__douyin-id {
        color: #9f9191;
        font-size: 14px;
      }

      /* 页面头部 */
      .video-list__page-header {
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin-bottom: 24px;
      }

      /* 空状态卡片样式 */
      .empty-card {
        .empty-card__wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          min-height: 200px;
        }
      }

      /* 视频列表空状态样式 */
      .video-list__empty {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 80px 20px;
        min-height: 400px;
        width: 100%;
      }

      .author-info__douyin-id {
        font-size: 12px;
        color: #007aff;
        display: inline-flex;
        align-items: center;
        gap: 2px;
        vertical-align: middle;
        background: #f0f8ff;
        padding: 2px 6px;
        border-radius: 4px;
        line-height: 1.2;
      }

      /* 用户信息卡片 */
      .video-list__user-card {
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

        .user-card__wrap {
          display: flex;
          flex-wrap: wrap;
          gap: 30px; /* 头像和信息区域间距加大 */
          align-items: flex-start;
          padding: 25px; /* 卡片内边距加大，整体更宽松 */

          .user-card__avatar {
            flex-shrink: 0;
          }

          .meta__clickable-link {
            color: #1890ff;
            // 核心：默认无下划线，hover 显示下划线
            text-decoration: none;
            transition: all 0.2s ease; // 过渡动画，更丝滑

            &:hover {
              text-decoration: underline; // 鼠标经过显示下划线
              color: #096dd9; // 可选：hover 时颜色稍深，交互更明显
            }
          }

          .user-card__base-info {
            flex: 1;
            min-width: 200px;
            padding-right: 15px; /* 右侧留白 */

            // 核心：左侧信息区域间距全面加大
            .base-info__nickname {
              margin: 0 0 18px 0;
              font-size: 22px;
              font-weight: bold;
              color: #2ec6eb;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 100%;
              display: flex;
              align-items: center;
              flex-wrap: wrap;
              gap: 8px;
            }

            .base-info__douyin-id {
              margin: 0 0 18px 0;
            }

            .base-info__profile {
              margin: 0 0 18px 0;
              display: flex;
              align-items: center;

              .base-info__label {
                color: #666;
                font-weight: 500;
                margin-right: 4px;
                flex-shrink: 0;
              }

              .base-info__text {
                flex: 1;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                color: #333;
              }
            }

            .base-info__tags {
              display: inline-flex;
              align-items: center;
              margin: 0 0 20px 0;

              .base-info__tag {
                display: inline-block;
                padding: 2px 8px;
                border-radius: 4px;
                background-color: #f0f2f5;
                color: #333;
                font-size: 12px;
                line-height: 1.4;
                border: 1px solid #e5e6eb;

                &:empty {
                  display: none;
                }
              }
            }

            .base-info__meta {
              display: flex;
              flex-wrap: wrap;
              gap: 25px; /* 关注/粉丝/获赞间距加大 */
              margin: 0 0 25px 0; /* 上下间距加大 */
              font-size: 14px;
              color: #666;

              .meta__item {
                display: flex;
                align-items: center;
                gap: 4px;
              }
            }

            // 统计区域样式（宽松版）
            .user-card__stats {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
              gap: 20px 15px; /* 统计项间距加大 */
              padding: 20px;
              margin-top: 25px;
              background-color: #f8f9fa;
              border-radius: 8px;
              border: 1px solid #e9ecef;
              border-left: 3px solid #1890ff;

              .stats__item {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                gap: 8px;
                padding: 10px 15px;
                border-radius: 6px;
                transition: background-color 0.2s ease;

                &:hover {
                  background-color: #e8f4ff;
                }

                .stats__label {
                  font-size: 13px;
                  color: #6c757d;
                  font-weight: 500;
                  letter-spacing: 0.5px;
                }

                .stats__value {
                  font-size: 16px;
                  color: #212529;
                  font-weight: 600;
                  line-height: 1.4;
                  word-break: break-all;
                }
              }

              .ip-region-item {
                cursor: pointer;

                .ip-region-value {
                  color: #1890ff;
                  position: relative;

                  &:hover {
                    color: #40a9ff;

                    &::after {
                      content: '';
                      position: absolute;
                      bottom: -2px;
                      left: 0;
                      width: 100%;
                      height: 2px;
                      background-color: #40a9ff;
                      border-radius: 1px;
                    }
                  }
                }
              }

              .history-crawl-link {
                color: #1890ff;

                &:hover {
                  color: #40a9ff;
                  text-decoration: none;

                  &::after {
                    content: '';
                    display: block;
                    width: 100%;
                    height: 2px;
                    background-color: #40a9ff;
                    border-radius: 1px;
                  }
                }
              }
            }
          }

          .history-crawl-item {
            a.history-crawl-link {
              color: #1890ff;
              cursor: pointer;

              &:hover {
                color: #40a9ff;
                text-decoration: underline;
              }
            }
          }
        }

        // 新增：操作记录样式
        .user-card__operation-records {
          margin-top: 25px;
          padding: 20px;
          background-color: #fafbfc;
          border-radius: 8px;
          border: 1px solid #f0f2f5;
          border-left: 3px solid #722ed1;

          .operation-records__header {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 16px;
            font-weight: 600;
            color: #2f5496;
            margin-bottom: 16px;
            padding-bottom: 10px;
            border-bottom: 1px solid #e8eaed;

            .operation-records__count {
              font-size: 12px;
              font-weight: normal;
              color: #86909c;
              margin-left: 8px;
            }
          }

          .operation-records__list {
            display: flex;
            flex-direction: column;
            gap: 12px;
            max-height: 300px;
            overflow-y: auto;
            padding-right: 8px;

            // 滚动条样式适配
            &::-webkit-scrollbar {
              width: 6px;
            }
            &::-webkit-scrollbar-thumb {
              background-color: #dcdfe6;
              border-radius: 3px;
            }
            &::-webkit-scrollbar-track {
              background-color: #f5f7fa;
            }
          }

          .operation-record__item {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 12px;
            background-color: #fff;
            border-radius: 6px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
            transition: all 0.2s ease;

            &:hover {
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
              transform: translateY(-1px);
            }

            // 状态样式区分
            &.status-success {
              border-left: 3px solid #52c41a;
            }
            &.status-failed {
              border-left: 3px solid #ff4d4f;
            }

            .record-item__left {
              flex: 1;
              display: flex;
              flex-direction: column;
              gap: 6px;
              padding-right: 15px;

              .record-item__type {
                font-size: 14px;
                font-weight: 600;
                color: #1d2129;
              }

              .record-item__content {
                font-size: 13px;
                color: #4e5969;
                line-height: 1.4;
                overflow: hidden;
                text-overflow: ellipsis;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
              }

              .record-item__meta {
                display: flex;
                gap: 15px;
                font-size: 11px;
                color: #86909c;

                span {
                  display: flex;
                  align-items: center;
                  gap: 3px;
                }
              }

              .record-item__reason {
                font-size: 12px;
                color: #ff4d4f;
                margin-top: 4px;
                padding: 4px 8px;
                background-color: #fff2f0;
                border-radius: 4px;
                display: flex;
                align-items: center;
                gap: 4px;
              }
            }

            .record-item__right {
              flex: 0 0 180px;
              display: flex;
              flex-direction: column;
              align-items: flex-end;
              gap: 4px;

              .record-item__time {
                font-size: 12px;
                color: #86909c;
              }

              .record-item__status {
                font-size: 12px;
                padding: 2px 8px;
                border-radius: 4px;
                &.status-success {
                  background-color: #f6ffed;
                  color: #52c41a;
                }
                &.status-failed {
                  background-color: #fff2f0;
                  color: #ff4d4f;
                }
              }
            }
          }
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

        .video-card__content {
          display: flex;
          gap: 15px;
          min-height: 840px;
          max-height: 840px;
          box-sizing: border-box;
        }

        .video-card__main {
          display: flex;
          flex-direction: row;
          gap: 15px;
          flex: 1;
        }

        .video-card__left {
          flex: 0 0 48%;
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-height: 100%;
          box-sizing: border-box;
          overflow: hidden;
        }

        .video-card__player-wrap {
          flex: 1;
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

          .video-js {
            width: 100% !important;
            height: 100% !important;
          }

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

        .video-card__right {
          flex: 0 0 52%;
          height: 94%;
          border-left: 1px solid #eee;
          padding-left: 15px;
          box-sizing: border-box;
        }
      }

      /* 视频评论区 */
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
        justify-content: space-between;
        gap: 8px;
        width: 100%;
      }

      .video-comment__list {
        display: flex;
        flex-direction: column;
        gap: 12px;

        padding: 4px 0;
      }

      .video-comment__item {
        display: flex;
        gap: 8px;
        padding: 4px 0;
        border-bottom: 1px solid #f5f5f5;
        padding-bottom: 8px;

        .comment-user-avatar {
          flex-shrink: 0;
          cursor: pointer;
        }

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
              cursor: pointer;
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

      /deep/ .comment-user-tooltip-popover {
        .ant-popover-inner-content {
          padding: 0;
        }

        .ant-popover-inner {
          border-radius: 12px;
          overflow: hidden;
        }
      }

      .comment-user-tooltip-popover-content {
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        min-width: 380px;
        max-width: calc(100vw - 20px);
        max-height: calc(100vh - 20px);
        overflow: hidden;
        font-size: 12px;
        color: #333;
        cursor: default;
      }

      // 核心美化样式 - 统计项相关
      .comment-user-tooltip {
        position: fixed !important; // 强制固定定位
        z-index: 99999 !important; // 最高层级
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        padding: 0;
        min-width: 380px;
        max-width: calc(100vw - 20px); // 最大宽度不超过视口（留10px边距）
        width: auto;
        max-height: calc(100vh - 20px); // 最大高度不超过视口
        overflow: hidden !important; // 强制隐藏溢出内容
        font-size: 12px;
        color: #333;
        transition: all 0.2s ease;
        transform: scale(0.98);
        opacity: 0;
        animation: tooltipFadeIn 0.2s ease forwards;
        cursor: default;
        // 修复动画可能导致的位置偏移
        @keyframes tooltipFadeIn {
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        // 强制限制位置范围
        &:after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
        }
      }

      // 历史爬取对比浮窗样式
      .crawl-compare-tooltip {
        position: fixed;
        z-index: 9998;
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        padding: 10px 16px;
        min-width: 320px;
        font-size: 13px;
        color: #333;
        transition: all 0.2s ease;
        transform: scale(0.98);
        opacity: 0;
        animation: tooltipFadeIn 0.2s ease forwards;

        .compare-tooltip__header {
          font-size: 14px;
          font-weight: 600;
          color: #1890ff;
          margin-bottom: 8px;
          padding-bottom: 6px;
          border-bottom: 1px solid #f5f5f5;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .compare-tooltip__body {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .compare-item {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: nowrap;

          .compare-item__label {
            flex: 0 0 60px;
            color: #666;
          }

          .compare-item__last {
            flex: 0 0 80px;
          }

          .compare-item__current {
            flex: 0 0 80px;
          }

          .compare-item__diff {
            flex: 1;
            &.increase {
              color: #f5222d;
              font-weight: 600;
            }

            &.decrease {
              color: #52c41a;
              font-weight: 600;
            }

            &.same {
              color: #999;
            }
          }
        }
      }

      // IP属地历史记录悬浮弹窗
      .ip-history-tooltip {
        position: fixed;
        z-index: 9997;
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        padding: 10px 16px;
        min-width: 280px;
        font-size: 13px;
        color: #333;
        transition: all 0.2s ease;
        transform: scale(0.98);
        opacity: 0;
        animation: tooltipFadeIn 0.2s ease forwards;

        .ip-history__header {
          font-size: 14px;
          font-weight: 600;
          color: #fa8c16;
          margin-bottom: 8px;
          padding-bottom: 6px;
          border-bottom: 1px solid #f5f5f5;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .ip-history__body {
          max-height: 200px;
          overflow-y: auto;
          padding-right: 4px;

          .ip-history__list {
            display: flex;
            flex-direction: column;
            gap: 4px;

            .ip-history__item {
              display: flex;
              justify-content: space-between;
              padding: 4px 0;
              border-bottom: 1px solid #f9f9f9;

              .ip-history__region {
                color: #333;
                font-weight: 500;
              }

              .ip-history__time {
                color: #999;
                font-size: 11px;
              }
            }
          }

          .ip-history__empty {
            text-align: center;
            padding: 20px 0;
            color: #999;
            font-size: 12px;
          }
        }
      }
    }
  }
</style>

<template>
  <a-modal
    :visible="visible"
    :title="title"
    width="90%"
    max-width="1200px"
    :footer="null"
    destroyOnClose
    @cancel="handleCancel"
  >
    <!-- 完全复用你原有的列表DOM结构，新增简介展示区域 -->
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
              <div
                class="author-info__inner"
                style="
                  display: flex;
                  align-items: center;
                  gap: 20px;
                  width: 100%;
                "
              >
                <!-- 原有头像：保留所有属性，仅微调样式更精致 -->
                <a-avatar
                  :size="62"
                  :src="getUrl(video.userInfo?.touxiang || video.touxiang)"
                  :key="`avatar-${video.id}-${queryParam.pageNum}`"
                  @error="(e) => (e.target.src = '')"
                  :style="{
                    backgroundColor: '#f5f5f5',
                    border: '1px solid #eee',
                    objectFit: 'cover',
                  }"
                >
                  {{
                    getShortNickname(
                      video.userInfo?.nickname || video.nickname || "匿"
                    )
                  }}
                </a-avatar>

                <!-- 原有作者信息区：占满剩余宽度，排版更紧凑 -->
                <div class="author-info__base" style="flex: 1; margin: 0">
                  <p
                    class="author-info__nickname"
                    style="
                      margin: 0 0 10px 0;
                      font-size: 16px;
                      font-weight: 500;
                      color: #333;
                      line-height: 1;
                    "
                  >
                    {{
                      video.userInfo?.nickname || video.nickname || "未知作者"
                    }}
                    <span
                      v-if="video.userInfo?.real_name"
                      style="
                        font-size: 12px;
                        color: #999;
                        margin-left: 6px;
                        font-weight: 400;
                      "
                    >
                      ({{ video.userInfo.real_name }})
                    </span>
                    <!-- ✅ 新增：抖音ID（带小标签样式） -->
                    <span
                      v-if="video.douyinId || video.userInfo?.douyinId"
                      class="author-info__douyin-id"
                    >
                      <a-icon type="idcard" size="small" />
                      {{ video.douyinId || video.userInfo?.douyinId }}
                    </span>
                    <span
                      style="
                        font-size: 12px;
                        color: #999;
                        margin-left: 8px;
                        align-items: center;
                        gap: 2px;
                      "
                    >
                      <a-icon type="environment" size="small" />
                      {{ video.userInfo?.region || video.region || "未知属地" }}
                    </span>
                  </p>

                  <!-- ✅ 新增：简介展示区域（存在才显示） -->
                  <div
                    class="author-info__profile"
                    v-show="video.userInfo?.profile_text || video.profile_text"
                    style="
                      margin: 0 0 8px 0;
                      font-size: 13px;
                      line-height: 1.4;
                      color: #666;
                    "
                  >
                    <span
                      style="font-weight: 500; color: #999; margin-right: 4px"
                      >简介：</span
                    >
                    <span>{{
                      video.userInfo?.profile_text || video.profile_text
                    }}</span>
                  </div>

                  <div
                    class="author-info__meta"
                    style="
                      display: flex;
                      gap: 20px;
                      font-size: 13px;
                      color: #666;
                      margin: 0;
                    "
                  >
                    <span
                      style="
                        display: inline-flex;
                        align-items: center;
                        gap: 3px;
                      "
                    >
                      <a-icon type="user-add" size="small" />
                      {{ video.userInfo?.follow_count || 0 }} 关注
                    </span>
                    <span
                      style="
                        display: inline-flex;
                        align-items: center;
                        gap: 3px;
                      "
                    >
                      <a-icon type="star" size="small" />
                      {{ video.userInfo?.fans_count || 0 }} 粉丝
                    </span>
                    <span
                      style="
                        display: inline-flex;
                        align-items: center;
                        gap: 3px;
                      "
                    >
                      <a-icon type="like" size="small" />
                      {{ video.userInfo?.likes_count || 0 }} 获赞
                    </span>
                  </div>
                </div>

                <!-- 新增：总评论数模块（简约高级，绑定video.count，视觉突出） -->
                <!-- 极简优化版：仅调尺寸/间距，色彩保留原风格 -->
                <!-- 优化版：评论数模块（保留原有排版UI，仅精致化样式） -->
                <div
                  style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 8px 16px; /* 缩减内边距，更紧凑 */
                    background: #e6f7ff;
                    border-radius: 6px; /* 小圆角更精致，贴合Antd风格 */
                    min-width: 70px; /* 适配缩减的内边距，缩小最小宽度 */
                    flex-shrink: 0;
                    height: 62px; /* 与头像同高，完美垂直居中 */
                    box-sizing: border-box; /* 高度包含内边距，避免溢出 */
                  "
                >
                  <span
                    style="
                      font-size: 22px; /* 微放大数字，更突出 */
                      font-weight: 700;
                      color: #1890ff; /* 改主色更聚焦，比深灰更贴合浅蓝底 */
                      line-height: 1;
                      margin-bottom: 2px; /* 数字和文字微间距，更透气 */
                    "
                    >{{ video.count || video.commentCount || 0 }}</span
                  >
                  <span
                    style="
                      font-size: 12px;
                      color: #597ef7; /* 浅一点的蓝灰，和主色呼应，比#666更协调 */
                      line-height: 1; /* 取消margin-top，用数字的margin-bottom控间距更精准 */
                    "
                    >评论数</span
                  >
                </div>
              </div>
            </div>
          </a-card>
        </div>

        <!-- 空状态 -->
        <div
          class="video-list__empty"
          v-if="!loading && videoList.length === 0"
        >
          <a-empty description="暂无相关视频数据" />
        </div>

        <!-- 分页组件：完全复用原有代码 -->
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
</template>

<script>
import {
  accountContentList,
  addressAccountContent,
  accountListByDid,
  accountCommentList,
} from "@/api/module/Basic";
import { message } from "ant-design-vue";

export default {
  name: "VideoListModal",
  props: {
    // 仅保留弹窗显隐的props，由父组件控制
    visible: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  data() {
    return {
      // 查询参数：仅保留分页基础参数，核心业务参数由父组件传入
      queryParam: {
        pageNum: 1,
        pageSize: 15,
      },
      loading: false,
      videoList: [],
      total: 0,
      title: "关注列表",
      isType: "",
      // 存储父组件传入的核心业务参数（分页时复用）
      coreParams: {},
    };
  },
  watch: {
    // 关闭弹窗时重置状态，防止下次打开残留数据
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
    // 核心：暴露给父组件的方法【父组件通过$refs调用】，接收父传的参数并请求列表
    async getListByParams(type, id) {
      let data = {};
      this.isType = type;
      if (type == 1) {
        this.title = "关注列表";
        data.vUid = id;
      } else if (type == 2) {
        data.aVId = id;
        this.title = "粉丝列表";
      }
      // 存储核心业务参数（分页时需要拼接）
      this.coreParams = data || {};
      // 重置页码为1
      this.queryParam.pageNum = 1;
      // 发起接口请求
      await this.getVideoList();
    },
    // 实际接口请求方法：拼接 核心业务参数 + 分页参数
    async getVideoList() {
      this.loading = true;
      try {
        // 关键：合并父组件传入的核心参数 + 分页参数
        const requestParams = { ...this.coreParams, ...this.queryParam };
        var res;
        console.log(this.isType );
        
        if (this.isType == 1) {
          res = await accountContentList(requestParams);
        } else if (this.isType == 2) {
          res = await addressAccountContent(requestParams);
        } else if (this.isType == 3) {
          res = await accountListByDid(requestParams);
        } 
        // 遍历解析每个item的jsonString到userInfo
        this.videoList = (res.rows || []).map((item) => {
          let userInfo = {};
          // 防错：仅当jsonString存在且为字符串时解析
          if (item.jsonString && typeof item.jsonString === "string") {
            try {
              userInfo = JSON.parse(item.jsonString);
            } catch (e) {
              console.error(`解析${item.id || item.vUid}的jsonString失败：`, e);
              userInfo = {};
            }
          }
          // 替换为解析后的userInfo对象
          return { ...item, userInfo };
        });
        this.total = res.total || 0;
      } catch (err) {
        this.videoList = [];
        this.total = 0;
        message.error("获取视频列表失败，请重试");
        console.error("视频列表接口请求失败：", err);
      } finally {
        this.loading = false;
      }
    },
    // 分页切换：自动携带父组件传入的核心参数，重新请求
    changeSize(pageNum) {
      this.queryParam.pageNum = pageNum;
      this.getVideoList();
      // 分页后滚动到弹窗顶部
      this.$nextTick(() => {
        document.querySelector(".video-list-modal__content")?.scrollTo(0, 0);
      });
    },
    // 原有工具方法：完全复用，无修改
    getUrl(url) {
      if (!url) return "";
      return window.origin + process.env.VUE_APP_BASE_API + url;
    },
    getRandomColor(id) {
      const colors = [
        "#1890ff",
        "#52c41a",
        "#faad14",
        "#f5222d",
        "#722ed1",
        "#ff7a45",
        "#597ef7",
      ];
      return colors[Number(id) % colors.length];
    },
    getShortNickname(nickname) {
      if (!nickname) return "匿";
      const maxLen = 2;
      return nickname.length > maxLen
        ? nickname.substring(0, maxLen)
        : nickname;
    },
    // 弹窗关闭：通知父组件更新visible
    handleCancel() {
      this.$emit("update:visible", false);
    },
  },
};
</script>
<style >
.card .ant-card-body {
  padding: 6px !important;
}
</style>
<style lang="less" scoped>
// 样式完全复用，新增简介样式
.video-list-modal__content {
  padding-right: 8px;
  box-sizing: border-box;
}
.video-list__card-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
  width: 100%;
  box-sizing: border-box;
}
.video-list__video-card {
  width: calc(33.333% - 12px);
  min-width: 300px;
  box-sizing: border-box;
}

.video-card__author-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  width: 100%;
  box-sizing: border-box;
}
.author-info__inner {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}
.author-info__nickname {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}
.author-info__realname {
  font-size: 12px;
  color: #999;
  margin-left: 4px;
}
.author-info__region {
  font-size: 12px;
  color: #999;
  margin-left: 8px;
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

// ✅ 新增：简介样式（与现有样式风格统一）
.author-info__profile {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  // 超出部分省略号显示，避免换行过多
  .profile-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: calc(100% - 30px);
  }
}

.author-info__meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #666;
}
.author-info__douyin-id {
  margin: 0 4px;
  font-size: 12px;
  color: #007aff; /* 抖音蓝，和属地的灰色区分 */
  display: inline-flex;
  align-items: center;
  gap: 2px; /* 图标和文字间距 */
  vertical-align: middle;
}
.meta__item {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.video-list__empty {
  text-align: center;
  padding: 40px 0;
  background: #fafafa;
  border-radius: 8px;
  margin-bottom: 24px;
}
.video-list__pagination {
  text-align: right;
  margin-top: 16px;
}
@media (max-width: 768px) {
  .video-list__video-card {
    width: 100%;
  }
  .video-list__pagination {
    text-align: center;
  }
}
</style>
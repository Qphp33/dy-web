<template>
  <a-modal
    title="地址任务明细"
    :visible="open"
    :footer="null"
    width="92%"
    @cancel="cancel"
    class="userModalBox"
    wrapClassName="address-user-modal"
  >
    <a-table
      class="user-modal__table"
      :loading="loading"
      rowKey="id"
      :columns="columns"
      :data-source="list"
      :pagination="false"
      :scroll="{ x: 1180 }"
      aria-hidden="false"
    >
      <template slot="douyinId" slot-scope="text">
        <div class="address-cell">
          <a-icon type="environment" />
          <span>{{ text || "-" }}</span>
        </div>
      </template>

      <span slot="tags" slot-scope="text, record">
        <div class="tag-list">
          <a-tag
            v-for="(tag, tagIndex) in (record.tags || '')
              .split(',')
              .filter(Boolean)"
            :key="tagIndex"
            :title="tag"
            color="blue"
          >
            {{ tag }}
          </a-tag>
        </div>
      </span>

      <span slot="status" slot-scope="text, record">
        <a-tag
          :color="getStatusMeta(record.status).color"
          class="status-tag"
          :style="getStatusTagStyle(record.status)"
        >
          {{ getStatusMeta(record.status).text }}
        </a-tag>
      </span>

      <span slot="createTime" slot-scope="text, record">
        <div class="time-cell">
          <span>{{ record.createTime.split(" ")[0] }}</span>
          <small>{{ record.createTime.split(" ")[1] }}</small>
        </div>
      </span>

      <template slot="remark" slot-scope="text, record">
        <editable-cell
          :ref="`remarkCell_${record.id}`"
          :key="`${record.id}-remark`"
          :text="record.remark"
          @change="(value) => onCellChange(record.id, 'remark', value)"
        />
      </template>

      <template slot="works" slot-scope="text">
        <div class="works-cell">{{ text || "暂无数据" }}</div>
      </template>

      <span slot="operation" slot-scope="text, record">
        <a-button
          type="link"
          class="detail-link"
          @click="goDetailPage(record)"
          v-if="record.status !== 0"
        >
          <a-icon type="arrow-right" />查看详情
        </a-button>

        <a-button
          type="link"
          class="detail-link"
          style="margin-left: 10px; color: red"
          @click="deleteRow(record)"
        >
          <a-icon type="delete" />删除
        </a-button>

        <a-button
          type="link"
          class="detail-link"
          style="margin-left: 10px"
          @click="retweetRow(record)"
        >
          <a-icon type="retweet" />重新获取
        </a-button>
      </span>
    </a-table>

    <div class="user-modal__footer">
      <a-pagination
        class="ant-table-pagination"
        show-size-changer
        show-quick-jumper
        :current="queryParam.pageNum"
        :total="total"
        :page-size="queryParam.pageSize"
        :showTotal="(total) => `共 ${total} 条`"
        @showSizeChange="onShowSizeChange"
        @change="changeSize"
      />
    </div>
  </a-modal>
</template>

<script>
import { VideoTags, updateVideoTags, deleteVideoTag } from "@/api/module/Basic";
const EditableCell = {
  props: { text: String },
  data() {
    return { value: this.text, editable: false };
  },
  render(h) {
    if (this.editable) {
      return h(
        "div",
        {
          class: "editable-cell",
          attrs: { "aria-hidden": false },
        },
        [
          h(
            "div",
            {
              class: "editable-cell-input-wrapper",
              attrs: { tabindex: 0 },
            },
            [
              h("a-input", {
                attrs: { value: this.value, "aria-hidden": false },
                on: {
                  change: (e) => {
                    this.value = e.target.value;
                  },
                  pressEnter: () => {
                    this.check();
                  },
                },
              }),
              h("a-icon", {
                attrs: {
                  type: "check",
                  tabindex: -1,
                },
                class: "editable-cell-icon-check",
                on: {
                  click: () => {
                    this.check();
                  },
                },
              }),
            ]
          ),
        ]
      );
    }
    return h(
      "div",
      {
        class: "editable-cell",
        attrs: { "aria-hidden": false },
      },
      [
        h(
          "div",
          {
            class: "editable-cell-text-wrapper",
            attrs: { tabindex: -1 },
          },
          [
            this.value || " ",
            h("a-icon", {
              attrs: {
                type: "edit",
                tabindex: -1,
              },
              class: "editable-cell-icon",
              on: {
                click: () => {
                  this.edit();
                },
              },
            }),
          ]
        ),
      ]
    );
  },
  methods: {
    check() {
      this.editable = false;
      this.$emit("change", this.value);
    },
    edit() {
      this.editable = true;
    },
  },
};

export default {
  name: "userPage",
  props: ["deviceData"],
  components: { EditableCell },
  data() {
    return {
      loading: false,
      open: false,
      list: [],
      total: 0,
      queryParam: {
        pageNum: 1,
        taskId: "",
        pageSize: 10,
      },
      columns: [
        {
          title: "地址",
          dataIndex: "douyinId",
          scopedSlots: { customRender: "douyinId" },
          ellipsis: true,
          width: 220,
          align: "left",
        },
        {
          title: "创建时间",
          dataIndex: "createTime",
          scopedSlots: { customRender: "createTime" },
          width: 160,
          align: "center",
        },
        {
          title: "执行任务",
          scopedSlots: { customRender: "tags" },
          width: 240,
          align: "left",
        },
        {
          title: "备注",
          scopedSlots: { customRender: "remark" },
          width: 220,
          align: "left",
        },
        {
          title: "抓取信息",
          dataIndex: "works",
          scopedSlots: { customRender: "works" },
          align: "left",
          width: 240,
        },
        {
          title: "视频数",
          dataIndex: "videoCount",
          align: "center",
          width: 90,
        },
        {
          title: "评论数",
          dataIndex: "comments_count",
          align: "center",
          width: 90,
        },
        {
          title: "状态",
          scopedSlots: { customRender: "status" },
          width: 160,
          ellipsis: true,
          align: "center",
        },
        {
          title: "操作",
          dataIndex: "operation",
          width: 240,
          scopedSlots: { customRender: "operation" },
          align: "center",
        },
      ],
    };
  },
  methods: {
    getList() {
      this.loading = true;
      VideoTags(this.queryParam).then((response) => {
        const jsonFieldTemplate = {
          nickname: "",
          real_name: "",
          follow_count: "",
          fans_count: "",
          works_count: "",
          region: "",
          age: "",
        };
        this.list = response.rows.map((item) => {
          const originalData = { ...item };
          let parsedJson = {};
          try {
            parsedJson = item.account.jsonString
              ? JSON.parse(item.account.jsonString)
              : {};
          } catch (e) {
            console.warn("解析 jsonString 失败:", e, item.account.jsonString);
            parsedJson = {};
          }

          const completeJsonData = { ...jsonFieldTemplate, ...parsedJson };
          return {
            ...originalData,
            ...completeJsonData,
          };
        });

        this.total = response.total;
        this.loading = false;
      });
    },
    onClose() {
      this.open = false;
    },
    cancel() {
      this.open = false;
    },
    handleAdd(row) {
      this.open = true;
      this.queryParam.taskId = row.id;
      this.getList();
    },
    onShowSizeChange(current, pageSize) {
      this.queryParam.pageSize = pageSize;
      this.getList();
    },
    changeSize(current, pageSize) {
      this.queryParam.pageNum = current;
      this.queryParam.pageSize = pageSize;
      this.getList();
    },
    async onCellChange(id, dataIndex, value) {
      if (!value) return;
      const target = this.list.find((item) => item.id === id);
      if (!target) return;
      const originValue = target[dataIndex];
      target[dataIndex] = value;

      try {
        await updateVideoTags({ id, remark: value });
        this.$message?.success("备注修改成功");
      } catch (err) {
        this.$message?.error("编辑失败，已回滚");
        target[dataIndex] = originValue;
        await this.getList();
        const cellRef = this.$refs[`remarkCell_${id}`];
        if (cellRef) {
          cellRef.value = originValue;
          cellRef.editable = false;
        }
      }
    },
    // 删除单条记录
    deleteRow(record) {
      this.$confirm({
        title: "确认删除",
        content: `确定要删除地址：${record.douyinId || "该记录"} 吗？`,
        okText: "确认删除",
        cancelText: "取消",
        okType: "danger",
        onOk: async () => {
          try {
            // 调用删除接口
            await deleteVideoTag(record.id);
            this.$message.success("删除成功");
            this.getList(); // 刷新列表
          } catch (err) {
            this.$message.error("删除失败：" + err.message);
          }
        },
      });
    },

    retweetRow(record) {
      this.$confirm({
        title: "重新获取数据",
        content: `确定要重新获取：${record.douyinId || "该记录"} 吗？`,
        okText: "确认",
        cancelText: "取消",
        okType: "danger",
        onOk: async () => {
          try {
            // 调用删除接口
            await updateVideoTags({ id: record.id, status: "0", runNum: 0 });
            this.$message.success("获取中...");
            this.getList(); // 刷新列表
          } catch (err) {
            this.$message.error("失败：" + err.message);
          }
        },
      });
    },
    goDetailPage(item) {
      const routeData = this.$router.resolve({
        name: "addressDetailPage",
        query: {
          devId: item.devId,
          douyinId: item.douyinId,
          type: 2,
        },
      });
      window.open(routeData.href, "_blank");
    },
    getStatusMeta(status) {
      const map = {
        0: { text: "等待处理", color: "default" },
        1: { text: "正在处理", color: "processing" },
        3: { text: "异常,待重新执行", color: "error" },
      };
      return map[status] || { text: "已完成", color: "success" };
    },
    getStatusTagStyle(status) {
      const map = {
        0: { color: "#8c8c8c", borderColor: "#d9d9d9", background: "#fafafa" },
        1: { color: "#1677ff", borderColor: "#91caff", background: "#f0f7ff" },
        3: { color: "#ff4d4f", borderColor: "#ffb3b3", background: "#fff1f0" },
      };
      return (
        map[status] || {
          color: "#52c41a",
          borderColor: "#b7eb8f",
          background: "#f6ffed",
        }
      );
    },
  },
};
</script>

<style>
.address-user-modal .ant-modal-content {
  border-radius: 28px;
  overflow: hidden;
}

.address-user-modal .ant-modal-header {
  padding: 20px 28px;
  background: #1677ff;
  border-bottom: 0;
}

.address-user-modal .ant-modal-title,
.address-user-modal .ant-modal-close-x {
  color: #fff;
}

.address-user-modal .ant-modal-body {
  padding: 24px 28px 28px;
  background: linear-gradient(180deg, #f8fbff 0%, #f3f8ff 100%);
}

.userModalBox {
  padding: 0 0 30px 0;
}

.address-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #0f172a;
  font-weight: 600;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.status-tag {
  border-radius: 999px;
  padding: 2px 10px;
  font-weight: 500;
}

.time-cell span,
.time-cell small {
  display: block;
}

.time-cell small,
.works-cell {
  color: #64748b;
}

.detail-link {
  padding: 0;
  font-weight: 600;
}

.user-modal__footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}

.editable-cell {
  position: relative;
  min-height: 34px;
}

.editable-cell-input-wrapper,
.editable-cell-text-wrapper {
  padding-right: 24px;
}

.editable-cell-text-wrapper {
  padding: 5px 24px 5px 5px;
  line-height: 1.6;
}

.editable-cell-icon,
.editable-cell-icon-check {
  position: absolute;
  right: 0;
  width: 20px;
  cursor: pointer;
  font-size: 16px;
}

.editable-cell-icon {
  line-height: 18px;
  display: none;
}

.editable-cell-icon-check {
  line-height: 28px;
}

.editable-cell:hover .editable-cell-icon {
  display: inline-block;
}

.editable-cell-icon:hover,
.editable-cell-icon-check:hover {
  color: #108ee9;
}

.editable-add-btn {
  margin-bottom: 8px;
}

.user-modal__table .ant-table-thead > tr > th {
  background: #f7fbff;
  color: #355070;
  font-weight: 700;
}

.user-modal__table .ant-table-tbody > tr > td {
  background: rgba(255, 255, 255, 0.96);
  border-bottom: 1px solid #eaf1fb;
}
</style>

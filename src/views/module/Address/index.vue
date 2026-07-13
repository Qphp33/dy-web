<template>
  <div class="address-page">
    <a-card :bordered="false" class="address-panel">
      <div class="table-operations address-hero">
        <div class="address-hero__content">
          <div class="address-hero__eyebrow">
            <span></span>
            Douyin Location
          </div>
          <p>点击任意任务行可查看地址明细、归属地用户和当前位置视频。</p>
          <div class="address-hero__metrics">
            <div class="address-metric">
              <strong>{{ taskCountText }}</strong>
              <small>采集任务</small>
            </div>
            <div class="address-metric address-metric--cyan">
              <strong>{{ deviceCountText }}</strong>
              <small>关联设备</small>
            </div>
          </div>
        </div>
        <div class="table-operations__actions address-hero__actions">
          <a-button type="primary" class="address-create-btn" @click="$refs.CreateForm.handleAdd()">
            <a-icon type="plus" />新建位置信息任务
          </a-button>
          <div class="address-setting-pill">
            <table-setting
              :table-size.sync="tableSize"
              v-model="columns"
              :refresh-loading="loading"
              @refresh="getList"
            />
          </div>
        </div>
      </div>

      <a-table
        class="address-table"
        :loading="loading"
        :size="tableSize"
        rowKey="id"
        :columns="columns"
        :data-source="list"
        :customRow="
          (record) => ({
            on: {
              click: () => {
                this.$refs.UserPage?.handleAdd(record);
              },
            },
            attrs: { class: 'custom-table-row' },
          })
        "
        :pagination="false"
      >
        <template slot="taskName" slot-scope="text, record">
          <div class="task-cell">
            <strong>{{ record.taskName || '未命名任务' }}</strong>
          </div>
        </template>

        <template slot="devId" slot-scope="text, record">
          <div class="device-cell">
            <a-icon type="api" />
            <span>{{ record.devId || '-' }}</span>
          </div>
        </template>

        <template slot="createTime" slot-scope="text">
          <div class="time-cell">
            <span>{{ text ? text.split(' ')[0] : '--' }}</span>
            <small>{{ text ? text.split(' ')[1] : '' }}</small>
          </div>
        </template>

        <span slot="tags" slot-scope="text, record">
          <div class="tag-list">
            <a-tag
              v-for="(tag, tagIndex) in (record.tags || '').split(',').filter(Boolean)"
              :key="tagIndex"
              :color="tagColor(tag)"
            >
              {{ tag }}
            </a-tag>
          </div>
        </span>

        <template slot="statusSummary" slot-scope="text">
          <div class="status-chip">
            <i></i>
            <span>{{ text || '待处理' }}</span>
          </div>
        </template>

        <template slot="remark" slot-scope="text">
          <div class="remark-cell">{{ text || '暂无备注' }}</div>
        </template>

        <!-- 编辑按钮 -->
        <template slot="action" slot-scope="text, record">
          <a-button type="link" @click.stop="handleEdit(record)"> <a-icon type="edit" />编辑 </a-button>
          <a-button style="color: red" type="link" @click.stop="handleDelete(record)">
            <a-icon type="delete" />删除
          </a-button>
        </template>
      </a-table>

      <a-pagination
        class="ant-table-pagination address-pagination"
        show-size-changer
        show-quick-jumper
        :current="queryParam.pageNum"
        :total="total"
        :page-size="queryParam.pageSize"
        :showTotal="(total) => `共 ${total} 条`"
        @showSizeChange="onShowSizeChange"
        @change="changeSize"
      />

      <create-form :deviceData="deviceData" @ok="getList" ref="CreateForm" />
      <user-page ref="UserPage" />
    </a-card>
  </div>
</template>

<script>
  import { videoTask, deviceList, deleteVideoTask } from '@/api/module/Basic';
  import { tableMixin } from '@/store/table-mixin';
  import CreateForm from './modules/CreateForm';
  import UserPage from './userPage.vue';

  export default {
    name: 'Address',
    components: {
      CreateForm,
      UserPage,
    },
    mixins: [tableMixin],
    data() {
      return {
        deviceData: [],
        list: [],
        selectedRowKeys: [],
        selectedRows: [],
        multiple: true,
        ids: [],
        loading: false,
        total: 0,
        queryParam: {
          pageNum: 1,
          pageSize: 10,
          type: 2,
        },
        columns: [
          {
            title: '任务名称',
            dataIndex: 'taskName',
            scopedSlots: { customRender: 'taskName' },
            width: 240,
            align: 'left',
          },
          {
            title: '设备 ID',
            dataIndex: 'devId',
            scopedSlots: { customRender: 'devId' },
            width: 180,
            align: 'center',
          },
          {
            title: '创建时间',
            dataIndex: 'createTime',
            scopedSlots: { customRender: 'createTime' },
            width: 170,
            align: 'center',
          },
          {
            title: '执行任务',
            scopedSlots: { customRender: 'tags' },
            width: 290,
            align: 'left',
          },
          {
            title: '任务状态',
            dataIndex: 'statusSummary',
            scopedSlots: { customRender: 'statusSummary' },
            align: 'center',
            width: 270,
          },
          {
            title: '备注',
            dataIndex: 'remark',
            scopedSlots: { customRender: 'remark' },
            align: 'left',
          },
          // 加了这一列 → 操作
          {
            title: '操作',
            key: 'action',
            scopedSlots: { customRender: 'action' },
            width: 210,
            align: 'center',
          },
        ],
      };
    },
    computed: {
      taskCountText() {
        return this.total || this.list.length || 0;
      },
      deviceCountText() {
        return this.deviceData.length || 0;
      },
    },
    created() {
      this.getList();
    },
    methods: {
      async getList() {
        this.loading = true;
        try {
          const [deviceRes, taskRes] = await Promise.all([
            deviceList({ pageNum: 1, pageSize: 9999 }),
            videoTask(this.queryParam),
          ]);
          Object.assign(this, {
            deviceData: deviceRes.rows,
            list: taskRes.rows,
            total: taskRes.total,
          });
        } catch (err) {
          console.error('数据加载失败:', err);
        } finally {
          this.loading = false;
        }
      },

      handleEdit(record) {
        this.$refs.CreateForm.handleEdit(record);
      },

      handleQuery() {
        this.queryParam.pageNum = 1;
        this.getList();
      },
      resetQuery() {
        this.queryParam = {
          pageNum: 1,
          pageSize: 10,
          type: 2,
        };
        this.handleQuery();
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
      onSelectChange(selectedRowKeys, selectedRows) {
        this.selectedRowKeys = selectedRowKeys;
        this.selectedRows = selectedRows;
        this.ids = this.selectedRows.map((item) => item.id);
        this.multiple = !selectedRowKeys.length;
      },
      cancel() {
        this.form.remark = undefined;
        this.form.groupName = undefined;
        this.form.devId = [];
        this.form.users = [];
      },
      handleDelete(row) {
        var that = this;
        const ids = row.id || this.ids;
        this.$confirm({
          title: '确认删除所选数据?',
          content: '当前选中为 ' + row.taskName + ' 的任务',
          onOk() {
            return deleteVideoTask(ids).then(() => {
              that.getList();
              that.$message.success('删除成功', 3);
            });
          },
          onCancel() {},
        });
      },
      handleExport() {
        var that = this;
        this.$confirm({
          title: '是否确认导出?',
          content: '此操作将导出当前条件下所有数据而非选中数据',
          onOk() {
            that.download(
              'module/inquireall/export',
              {
                ...that.queryParam,
              },
              `inquireall_${new Date().getTime()}.xlsx`
            );
          },
          onCancel() {},
        });
      },
      tagColor(tag) {
        const colorMap = {
          视频: 'blue',
          基本信息: 'cyan',
          评论: 'gold',
          地址: 'geekblue',
          单用户前六条视频: 'green',
          单用户所有视频: 'green',
          前六条: 'green',
          综合视频: 'geekblue',
        };
        return colorMap[tag] || 'default';
      },
    },
  };
</script>

<style scoped>
  .address-page {
    position: relative;
    padding: 18px;
    overflow: hidden;
    background:
      radial-gradient(circle at 10% 4%, rgba(37, 244, 238, 0.22), transparent 26%),
      radial-gradient(circle at 84% 0%, rgba(22, 119, 255, 0.18), transparent 28%),
      radial-gradient(circle at 94% 26%, rgba(254, 44, 85, 0.1), transparent 24%),
      linear-gradient(180deg, #f8fbff 0%, #eef6ff 58%, #f7fbff 100%);
    min-height: 100%;
  }

  .address-page::before {
    position: absolute;
    inset: 0;
    pointer-events: none;
    content: '';
    background-image:
      linear-gradient(rgba(22, 119, 255, 0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(22, 119, 255, 0.035) 1px, transparent 1px);
    background-size: 42px 42px;
    mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.6), transparent 76%);
  }

  .address-panel {
    position: relative;
    z-index: 1;
    border: 0;
    border-radius: 28px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.72);
    box-shadow: 0 24px 64px rgba(22, 119, 255, 0.14);
    backdrop-filter: blur(22px) saturate(150%);
  }

  .address-panel::before {
    position: absolute;
    inset: 0;
    padding: 1px;
    pointer-events: none;
    border-radius: inherit;
    content: '';
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(22, 119, 255, 0.26), rgba(37, 244, 238, 0.22), rgba(254, 44, 85, 0.14));
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
  }

  :deep(.address-panel .ant-card-body) {
    padding: 28px;
  }

  .table-operations {
    display: flex;
    align-items: stretch;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 24px;
    padding: 28px;
    position: relative;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.72);
    border-radius: 26px;
    background:
      linear-gradient(135deg, rgba(255, 255, 255, 0.86), rgba(255, 255, 255, 0.58)),
      radial-gradient(circle at 0% 0%, rgba(22, 119, 255, 0.16), transparent 34%),
      radial-gradient(circle at 96% 0%, rgba(37, 244, 238, 0.18), transparent 36%);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.95), 0 18px 42px rgba(22, 119, 255, 0.1);
    backdrop-filter: blur(18px) saturate(140%);
  }

  .address-hero::before {
    position: absolute;
    inset: 0;
    padding: 1px;
    pointer-events: none;
    border-radius: inherit;
    content: '';
    background: linear-gradient(120deg, rgba(255, 255, 255, 0.88), rgba(22, 119, 255, 0.28), rgba(37, 244, 238, 0.3), rgba(254, 44, 85, 0.18));
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
  }

  .address-hero::after {
    position: absolute;
    right: -64px;
    top: -64px;
    width: 220px;
    height: 220px;
    border-radius: 999px;
    content: '';
    background: radial-gradient(circle, rgba(37, 244, 238, 0.28), transparent 64%);
    filter: blur(6px);
  }

  .address-hero__content,
  .address-hero__actions {
    position: relative;
    z-index: 1;
  }

  .address-hero__eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
    color: #1677ff;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .address-hero__eyebrow span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #fe2c55;
    box-shadow: 0 0 14px rgba(254, 44, 85, 0.46);
  }

  .address-hero p {
    margin: 0;
    color: #62748f;
    font-size: 14px;
    line-height: 1.7;
  }

  .address-hero__metrics {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 20px;
  }

  .address-metric {
    min-width: 112px;
    padding: 12px 14px;
    border: 1px solid #d9eaff;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.62);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.92), 0 10px 22px rgba(22, 119, 255, 0.08);
    backdrop-filter: blur(12px);
  }

  .address-metric--cyan {
    border-color: rgba(37, 214, 210, 0.35);
    background: rgba(37, 244, 238, 0.1);
  }

  .address-metric strong,
  .address-metric small {
    display: block;
  }

  .address-metric strong {
    color: #10233f;
    font-size: 24px;
    line-height: 1;
  }

  .address-metric small {
    margin-top: 8px;
    color: #7487a3;
  }

  .table-operations__actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .address-hero__actions {
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-end;
    min-width: 240px;
  }

  .address-create-btn {
    height: 42px;
    padding: 0 20px;
    border-radius: 999px;
    box-shadow: 0 12px 24px rgba(22, 119, 255, 0.22);
    font-weight: 700;
  }

  .address-setting-pill {
    display: inline-flex;
    align-items: center;
    min-height: 40px;
    padding: 8px 12px;
    border: 1px solid #dcecff;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.62);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.88);
    backdrop-filter: blur(12px);
  }

  .task-cell strong {
    display: block;
    font-size: 15px;
    color: #10233f;
    margin-bottom: 4px;
  }

  .task-cell span,
  .time-cell small {
    color: #94a3b8;
  }

  .device-cell {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 999px;
    background: linear-gradient(135deg, #eef7ff, #f6fbff);
    border: 1px solid #d9eaff;
    color: #1677ff;
    font-weight: 600;
  }

  .time-cell span,
  .time-cell small {
    display: block;
  }

  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .tag-list :deep(.ant-tag) {
    border-radius: 999px;
    padding: 2px 10px;
    font-weight: 600;
  }

  .status-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    border-radius: 999px;
    border: 1px solid #d9eaff;
    background: #f0f7ff;
    color: #1677ff;
    font-weight: 600;
  }

  .status-chip i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
    box-shadow: 0 0 12px rgba(22, 119, 255, 0.45);
  }

  .remark-cell {
    color: #475569;
    line-height: 1.7;
  }

  .address-pagination {
    margin-top: 22px;
  }

  :deep(.address-table .ant-table-thead > tr > th) {
    background: rgba(243, 248, 255, 0.84);
    color: #355070;
    font-weight: 700;
    border-bottom: 1px solid #e6eff8;
    backdrop-filter: blur(12px);
  }

  :deep(.address-table .ant-table-tbody > tr > td) {
    border-bottom: 1px solid #edf3fa;
    padding-top: 18px;
    padding-bottom: 18px;
    transition: all 0.2s ease;
  }

  :deep(.ant-table-tbody > tr.custom-table-row:hover > td) {
    cursor: pointer;
    background: transparent !important;
    box-shadow: none;
  }

  :deep(.address-pagination .ant-pagination-item) {
    border-radius: 10px;
  }

  :deep(.address-pagination .ant-pagination-item-active) {
    border-color: #1677ff;
    box-shadow: 0 8px 18px rgba(22, 119, 255, 0.18);
  }

  @media (max-width: 960px) {
    .table-operations {
      flex-direction: column;
      align-items: stretch;
    }

    .address-page {
      padding: 12px;
    }

    .address-hero__actions {
      align-items: stretch;
      min-width: 0;
    }
  }
</style>

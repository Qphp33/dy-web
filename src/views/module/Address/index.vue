<template>
  <div class="address-page">
    <a-card :bordered="false" class="address-panel">
      <div class="table-operations">
        <div class="table-operations__title">
          <h3>任务列表</h3>
          <p>点击任意任务行可查看该任务下的地址明细。</p>
        </div>
        <div class="table-operations__actions">
          <a-button type="primary" @click="$refs.CreateForm.handleAdd()">
            <a-icon type="plus" />新建位置信息任务
          </a-button>
          <table-setting :table-size.sync="tableSize" v-model="columns" :refresh-loading="loading" @refresh="getList" />
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
    padding: 8px;
    background: linear-gradient(180deg, #f7fbff 0%, #f1f6fc 100%);
    min-height: 100%;
  }

  .address-panel {
    border: 0;
    border-radius: 26px;
    overflow: hidden;
    background: #fff;
    box-shadow: 0 12px 32px rgba(22, 119, 255, 0.08);
  }

  :deep(.address-panel .ant-card-body) {
    padding: 28px;
  }

  .table-operations {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 22px;
    padding: 4px 2px 18px;
    border-bottom: 1px solid #e8f1fb;
  }

  .table-operations__title h3 {
    margin: 0 0 6px;
    font-size: 20px;
    color: #1f2d3d;
  }

  .table-operations__title p {
    margin: 0;
    color: #6b7a90;
  }

  .table-operations__actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .task-cell strong {
    display: block;
    font-size: 15px;
    color: #0f172a;
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
    background: #f0f7ff;
    color: #1677ff;
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

  .status-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    border-radius: 999px;
    background: #f0f7ff;
    color: #1677ff;
    font-weight: 600;
  }

  .status-chip i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
  }

  .remark-cell {
    color: #475569;
    line-height: 1.7;
  }

  .address-pagination {
    margin-top: 22px;
  }

  :deep(.address-table .ant-table-thead > tr > th) {
    background: #f7fbff;
    color: #355070;
    font-weight: 700;
    border-bottom: 1px solid #e6eff8;
  }

  :deep(.address-table .ant-table-tbody > tr > td) {
    border-bottom: 1px solid #edf3fa;
    padding-top: 18px;
    padding-bottom: 18px;
  }

  :deep(.ant-table-tbody > tr.custom-table-row:hover > td) {
    cursor: pointer;
    transition: all 0.2s ease;
    background: #f5faff !important;
  }

  @media (max-width: 960px) {
    .table-operations {
      flex-direction: column;
      align-items: stretch;
    }
  }
</style>

<template>
  <div class="basic-page">
    <a-card :bordered="false" class="basic-panel">
      <!-- 条件搜索 -->
      <!-- <div class="table-page-search-wrapper">
      <a-form layout="inline">
        <a-row :gutter="48">
          <a-col :md="6" :sm="24">
            <a-form-item label="用户名" prop="userName">
              <a-input v-model.trim="queryParam.userName" placeholder="请输入用户名" allow-clear />
            </a-form-item>
          </a-col>

          <a-col :md="6" :sm="24">
            <a-form-item label="类型" prop="type">
              <a-input v-model.trim="queryParam.type" placeholder="请输入类型" allow-clear />
            </a-form-item>
          </a-col>

          <a-col :md="8" :sm="24">
            <span class="table-page-search-submitButtons">
              <a-button type="primary" @click="handleQuery"><a-icon type="search" />查询</a-button>
              <a-button style="margin-left: 8px" @click="resetQuery"><a-icon type="redo" />重置</a-button>
            </span>
          </a-col>
        </a-row>
      </a-form>
    </div> -->
      <!-- 操作 -->
      <div class="table-operations">
        <a-button type="primary" @click="$refs.CreateForm.handleAdd()"> <a-icon type="plus" />新增任务 </a-button>
        <div class="table-operations__right">
          <table-setting :table-size.sync="tableSize" v-model="columns" :refresh-loading="loading" @refresh="getList" />
        </div>
      </div>
      <!-- :row-selection="{ selectedRowKeys: selectedRowKeys, onChange: onSelectChange }" -->
      <a-table
        class="basic-table"
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
              mouseenter: () => {}, // 可选：鼠标进入
            },
            attrs: { class: 'custom-table-row' },
          })
        "
        :pagination="false"
      >
        <span slot="tags" slot-scope="text, record">
          <div class="tag-list">
            <a-tag
              v-for="(tag, tagIndex) in (record.tags || '').split(',').filter(Boolean)"
              :key="tagIndex"
              :title="tag"
              color="blue"
            >
              {{ tag }}
            </a-tag>
          </div>
        </span>
        <span slot="operation" slot-scope="text, record">
          <div class="operation-buttons">
            <a-button type="link" @click.stop="handleEdit(record)"> <a-icon type="edit" />编辑 </a-button>
            <a-button style="color: red" type="link" @click.stop="handleDelete(record)">
              <a-icon type="delete" />删除
            </a-button>
          </div>
        </span>
      </a-table>
      <!-- 分页 -->
      <a-pagination
        class="ant-table-pagination basic-pagination"
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
    name: 'Basic',
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
        // 查询参数
        queryParam: {
          pageNum: 1,
          pageSize: 10,
          type: 1,
        },
        columns: [
          {
            title: '任务名',
            dataIndex: 'taskName',
            ellipsis: true,
            width: 220,
            align: 'center',
          },
          {
            title: '设备ID',
            dataIndex: 'devId',
            ellipsis: true,
            width: 220,
            align: 'center',
          },
          {
            title: '创建时间',
            dataIndex: 'createTime',
            ellipsis: true,
            width: 220,
            align: 'center',
          },

          {
            title: '执行的任务',
            scopedSlots: { customRender: 'tags' },
            ellipsis: true,
            width: 250,
            align: 'left',
          },
          {
            title: '状态',
            dataIndex: 'statusSummary',
            align: 'center',
            width: 250,
          },

          {
            title: '备注',
            dataIndex: 'remark',
            align: 'left',
          },

          {
            title: '操作',
            key: 'operation',
            scopedSlots: { customRender: 'operation' },
            width: 140,
            align: 'center',
          },
        ],
      };
    },
    filters: {},
    created() {
      this.getList();
    },

    methods: {
      /** 查询搜索日志列表 */
      // getList() {
      //   this.loading = true;
      //   deviceList({
      //     pageNum: 1,
      //     pageSize: 9999,
      //   }).then((response) => {
      //     this.deviceData = response.rows;
      //   });
      //   groupAll().then((response) => {
      //     this.groupOption = response.data;
      //   });
      //   task().then((response) => {
      //     this.loading = false;
      //     this.list = response.rows;
      //     this.total = response.total;
      //   });
      // },
      async getList() {
        this.loading = true;
        try {
          // 并行请求，解构结果
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

      /** 搜索按钮操作 */
      handleQuery() {
        this.queryParam.pageNum = 1;
        this.getList();
      },

      /** 重置按钮操作 */
      resetQuery() {
        this.queryParam = {
          user: undefined,
          time: undefined,
          deptName: undefined,
          userName: undefined,
          content: undefined,
          type: undefined,
          pageNum: 1,
          pageSize: 10,
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
      handleEdit(record) {
        this.$refs.CreateForm.handleEdit(record);
      },
      /** 删除按钮操作 */
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
      /** 导出按钮操作 */
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
    },
  };
</script>

<style scoped>
  .basic-page {
    min-height: 100%;
    padding: 8px;
    background: linear-gradient(180deg, #f7fbff 0%, #f1f6fc 100%);
  }

  .basic-panel {
    border: 0;
    border-radius: 24px;
    overflow: hidden;
    background: #fff;
    box-shadow: 0 12px 32px rgba(22, 119, 255, 0.08);
  }

  :deep(.basic-panel .ant-card-body) {
    padding: 28px;
  }

  .table-operations {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 22px;
    padding: 4px 2px 18px;
    border-bottom: 1px solid #e8f1fb;
  }

  .table-operations__right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .operation-buttons {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    white-space: nowrap;
  }

  .operation-buttons .ant-btn {
    padding: 0;
  }

  .basic-pagination {
    margin-top: 22px;
  }

  :deep(.basic-table .ant-table) {
    border-radius: 18px;
    overflow: hidden;
  }

  :deep(.basic-table .ant-table-thead > tr > th) {
    background: #f7fbff;
    color: #355070;
    font-weight: 700;
    border-bottom: 1px solid #e6eff8;
  }

  :deep(.basic-table .ant-table-tbody > tr > td) {
    border-bottom: 1px solid #edf3fa;
    color: #475569;
    padding-top: 18px;
    padding-bottom: 18px;
  }

  /* 注意：scoped样式需穿透，否则无法覆盖antd默认样式 */
  :deep(.ant-table-tbody > tr.custom-table-row:hover > td) {
    cursor: pointer; /* 鼠标移到行上显示手型，提示可点击 */
    transition: background-color 0.2s ease; /* 渐变过渡，更丝滑 */
    background-color: #e6f7ff !important; /* 浅蓝色hover背景（可自定义颜色） */
  }
  :deep(.basic-table .ant-table-tbody > tr.custom-table-row:hover > td) {
    transition: all 0.2s ease;
    background-color: #f5faff !important;
  }

  @media (max-width: 960px) {
    .table-operations {
      align-items: stretch;
      flex-direction: column;
    }

    .table-operations__right {
      justify-content: flex-start;
    }
  }
</style>

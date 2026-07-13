<template>
  <page-header-wrapper :breadcrumb="false">
    <a-card :bordered="false">
      <!-- 条件搜索 -->
      <div class="table-page-search-wrapper">
        <a-form layout="inline">
          <a-row :gutter="48">
            <a-col :md="6" :sm="24">
              <a-form-item label="抖音ID">
                <a-input v-model="queryParam.douyinId" placeholder="请输入抖音ID" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :md="6" :sm="24">
              <a-form-item label="状态">
                <a-select placeholder="请选择状态" v-model="queryParam.status" style="width: 100%" allow-clear>
                  <a-select-option value="0">等待处理</a-select-option>
                  <a-select-option value="1">正在处理</a-select-option>
                  <a-select-option value="3">异常,待重新执行</a-select-option>
                  <a-select-option value="2">已完成</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :md="6">
              <span class="table-page-search-submitButtons">
                <a-button type="primary" @click="handleQuery"><a-icon type="search" />查询</a-button>
                <a-button style="margin-left: 8px" @click="resetQuery"><a-icon type="redo" />重置</a-button>
              </span>
            </a-col>
          </a-row>
        </a-form>
      </div>

      <!-- 数据表格 -->
      <a-table
        :loading="loading"
        :size="tableSize"
        rowKey="id"
        :columns="columns"
        :data-source="list"
        :pagination="false"
        @change="handleTableChange"
        :bordered="tableBordered"
      >
        <!-- 任务标签 -->
        <span slot="tags" slot-scope="text, record">
          <a-tag
            style="margin: 2px 2px"
            v-for="(tag, tagIndex) in (record.tags || '').split(',').filter(Boolean)"
            :key="tagIndex"
            :title="tag"
            color="blue"
            >{{ tag }}</a-tag
          >
        </span>

        <!-- 状态 -->
        <span slot="status" slot-scope="text, record">
          <a-tag color="#2db7f5" v-if="record.status == 1">正在处理</a-tag>
          <a-tag color="#ccc" v-else-if="record.status == 0">等待处理</a-tag>
          <a-tag color="#F56C6C" v-else-if="record.status == 3">异常,待重新执行</a-tag>
          <a-tag color="#87d068" v-else>已完成</a-tag>
        </span>

        <!-- 作品数 -->
        <span slot="works_count" slot-scope="text, record">
          {{ (record.videoCount || 0) + ' / ' + (record.works_count || 0) }}
        </span>

        <!-- 实名信息 -->
        <span slot="age" slot-scope="text, record">
          {{ record.real_name ? record.real_name : '未实名' }}
          {{ record.age ? ' (' + record.age + ')' : '' }}
        </span>

        <!-- 创建时间 -->
        <span slot="updateTime" slot-scope="text, record">
          {{ record.updateTime.split(' ')[0] }}<br />
          {{ record.updateTime.split(' ')[1] }}
        </span>

        <!-- 可编辑备注 -->
        <template slot="remark" slot-scope="text, record">
          <editable-cell
            :ref="`remarkCell_${record.id}`"
            :text="record.remark"
            @change="(value) => onCellChange(record.id, 'remark', value)"
          />
        </template>

        <!-- 操作 -->
        <span slot="operation" slot-scope="text, record">
          <a @click="goDetailPage(record)"> <a-icon type="right-square" />详情页 </a>
          <a-divider type="vertical" />
          <a @click="deleteTag(record)"> <a-icon type="delete" />删除 </a>

          <span v-if="record.status != 0">
            <a-divider type="vertical" />
            <a @click="reprobeTag(record)"> <a-icon type="redo" />重新探测 </a>
          </span>
        </span>
      </a-table>

      <!-- 分页 -->
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
    </a-card>
  </page-header-wrapper>
</template>

<script>
  import { VideoTags, updateVideoTags, editTags, deleteVideoTag } from '@/api/module/Basic';
  import { tableMixin } from '@/store/table-mixin';

  // 可编辑单元格组件
  const EditableCell = {
    props: { text: String },
    data() {
      return { value: this.text, editable: false };
    },
    render(h) {
      if (this.editable) {
        return h('div', { class: 'editable-cell' }, [
          h('div', { class: 'editable-cell-input-wrapper' }, [
            h('a-input', {
              attrs: { value: this.value },
              on: {
                change: (e) => {
                  this.value = e.target.value;
                },
                pressEnter: () => {
                  this.check();
                },
              },
            }),
            h('a-icon', {
              attrs: { type: 'check' },
              class: 'editable-cell-icon-check',
              on: {
                click: () => {
                  this.check();
                },
              },
            }),
          ]),
        ]);
      }
      return h('div', { class: 'editable-cell' }, [
        h('div', { class: 'editable-cell-text-wrapper' }, [
          this.value || ' ',
          h('a-icon', {
            attrs: { type: 'edit' },
            class: 'editable-cell-icon',
            on: {
              click: () => {
                this.edit();
              },
            },
          }),
        ]),
      ]);
    },
    methods: {
      check() {
        this.editable = false;
        this.$emit('change', this.value);
      },
      edit() {
        this.editable = true;
      },
    },
  };

  export default {
    name: 'FacilityUserPage',
    components: { EditableCell },
    mixins: [tableMixin],
    data() {
      return {
        list: [],
        loading: false,
        total: 0,
        tableSize: 'middle',
        queryParam: {
          pageNum: 1,
          pageSize: 10,
          taskId: '',
          douyinId: '',
          status: undefined,
        },
        columns: [
          {
            title: '抖音ID',
            dataIndex: 'douyinId',
            width: 160,
            align: 'center',
            ellipsis: true,
          },
          {
            title: '创建时间',
            dataIndex: 'updateTime',
            scopedSlots: { customRender: 'updateTime' },
            width: 110,
            align: 'center',
          },
          {
            title: '执行的任务',
            scopedSlots: { customRender: 'tags' },
            width: 240,
            align: 'left',
          },
          { title: '昵称', dataIndex: 'nickname', width: 130, align: 'left' },
          {
            title: '实名',
            scopedSlots: { customRender: 'age' },
            width: 130,
            align: 'left',
          },
          { title: '简介', dataIndex: 'gender', align: 'left', ellipsis: true },
          {
            title: '关注数',
            dataIndex: 'follow_count',
            width: 100,
            align: 'left',
          },
          { title: '粉丝数', dataIndex: 'fans_count', width: 100, align: 'left' },
          {
            title: '作品数',
            scopedSlots: { customRender: 'works_count' },
            width: 100,
            align: 'left',
          },
          { title: '评论数', dataIndex: 'counts', width: 90, align: 'left' },
          { title: '地区', dataIndex: 'region', width: 110, align: 'left' },
          {
            title: '状态',
            scopedSlots: { customRender: 'status' },
            width: 140,
            align: 'center',
          },
          {
            title: '操作',
            scopedSlots: { customRender: 'operation' },
            width: 220,
            align: 'left',
          },
        ],
      };
    },
    created() {
      this.getList();
    },
    methods: {
      handleTableChange(pagination, filters, sorter) {
        const sort = this.tableSorter(sorter);
        this.queryParam.orderByColumn = sort.orderByColumn;
        this.queryParam.isAsc = sort.isAsc;
        this.getList();
      },
      getList() {
        this.loading = true;
        VideoTags(this.queryParam).then((response) => {
          const jsonFieldTemplate = {
            nickname: '',
            real_name: '',
            follow_count: '',
            fans_count: '',
            works_count: '',
            region: '',
            age: '',
            id: '',
          };
          this.list = response.rows.map((item) => {
            let parsedJson = {};
            try {
              parsedJson = item.account?.jsonString ? JSON.parse(item.account.jsonString) : {};
            } catch (e) {
              parsedJson = {};
            }
            const completeJsonData = { ...jsonFieldTemplate, ...parsedJson };
            return { ...item, ...completeJsonData, id: item.id };
          });
          this.total = response.total;
          this.loading = false;
        });
      },
      handleQuery() {
        this.queryParam.pageNum = 1;
        this.getList();
      },
      resetQuery() {
        this.queryParam = {
          pageNum: 1,
          pageSize: 10,
          taskId: '',
          douyinId: '',
          status: '',
        };
        this.handleQuery();
      },
      onShowSizeChange(current, pageSize) {
        this.queryParam.pageSize = pageSize;
        this.getList();
      },
      changeSize(current) {
        this.queryParam.pageNum = current;
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
          this.$message.success('编辑成功');
        } catch (err) {
          this.$message.error('编辑失败，已回滚');
          target[dataIndex] = originValue;
          this.getList();
          const cellRef = this.$refs[`remarkCell_${id}`];
          if (cellRef) {
            cellRef.value = originValue;
            cellRef.editable = false;
          }
        }
      },
      goDetailPage(item) {
        if (!item.douyinId) return this.$message.error('抖音号不存在！');

        var routeData = {};
        if (item.tags?.includes('地址')) {
          routeData = this.$router.resolve({
            name: 'addressDetailPage',
            query: {
              devId: item.devId,
              douyinId: item.douyinId,
              type: 2,
            },
          });
        } else {
          routeData = this.$router.resolve({
            name: 'basicDetailPage',
            query: {
              devId: item.devId,
              douyinId: item.douyinId,
              type: item.tags?.includes('地址') ? '2' : '1',
            },
          });
        }

        window.open(routeData.href, '_blank');
      },

      reprobeTag(record) {
        editTags({ id: record.id, runNum: 0, status: '0' }).then((response) => {
          this.getList();
          this.$message.success('加入重新探测任务列表成功');
        });
      },
      deleteTag(record) {
        this.$confirm({
          title: '确认删除',
          content: `确定要删除：${record.douyinId || '该记录'} 吗？`,
          okText: '确认删除',
          cancelText: '取消',
          okType: 'danger',
          onOk: async () => {
            try {
              await deleteVideoTag(record.id);
              this.$message.success('删除成功');
              this.getList(); // 刷新列表
            } catch (err) {
              this.$message.error('删除失败：' + err.message);
            }
          },
        });
      },
    },
  };
</script>

<style>
  .editable-cell {
    position: relative;
    height: 34px;
  }
  .editable-cell-input-wrapper,
  .editable-cell-text-wrapper {
    padding-right: 24px;
  }
  .editable-cell-text-wrapper {
    padding: 5px 24px 5px 5px;
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
</style>

<template>
  <a-modal
    title="任务标签"
    :visible="open"
    :confirm-loading="submitLoading"
    @ok="submitForm"
    @cancel="cancel"
  >
    <a-form-model ref="form" :model="form" :rules="rules">
      <a-form-model-item label="任务名" prop="taskName">
        <a-input
          v-model.trim="form.taskName"
          placeholder="请填写任务名"
          allow-clear
        />
      </a-form-model-item>
      <a-form-model-item label="设备" prop="devId">
        <a-select
          placeholder="请选择设备分组"
          v-model="form.devId"
          style="width: 100%"
          allow-clear
        >
          <a-select-option
            v-for="(d, index) in deviceData"
            :key="index"
            :value="d.deviceCode"
            >{{ d.deviceName + "_" + d.id }}</a-select-option
          >
        </a-select>
      </a-form-model-item>

      <a-form-model-item :label="dynamicLabel" prop="douyinId">
        <a-textarea
          v-model="form.douyinId"
          placeholder="如需添加多个,换行输入"
          :auto-size="{ minRows: 3, maxRows: 20 }"
        />
      </a-form-model-item>

      <a-form-model-item label="勾选需要执行的任务" prop="tags">
        <a-checkbox-group v-model="form.tags">
          <a-checkbox value="视频">视频</a-checkbox>
          <a-checkbox value="基本信息">基本信息</a-checkbox>
          <a-checkbox value="评论">评论</a-checkbox>
          <a-checkbox value="地址">地址</a-checkbox>
        </a-checkbox-group>
      </a-form-model-item>

      <a-form-model-item label="备注" prop="remark">
        <a-input
          v-model.trim="form.remark"
          placeholder="请填写备注"
          allow-clear
        />
      </a-form-model-item>
    </a-form-model>
  </a-modal>
</template>

<script>
import { addTags } from "@/api/module/Pictures";

export default {
  name: "CreateForm",
  props: ["deviceData"],
  components: {},
  data() {
    return {
      submitLoading: false,
      // 表单参数
      form: {
        devId: undefined,
        douyinId: null,
        taskName: null,
        remark: null,
        tags: ["视频", "基本信息", "评论"],
      },
      // 1增加,2修改
      formType: 1,
      open: false,
      rules: {
        devId: [{ required: true, message: "请选择设备ID", trigger: "change" }],
        douyinId: [
          { required: true, message: "请输入", trigger: "blur" },
        ],
        taskName: [
          { required: true, message: "请填写任务名", trigger: "blur" },
        ],
        tags: [
          {
            type: "array", // 数组类型（多选框值为数组）
            required: true,
            message: "请选择至少一个任务",
            trigger: "change",
          },
        ],
      },
    };
  },
  filters: {},
  created() {},
   computed: {
    // 计算属性：动态返回label文本
    dynamicLabel() {
      // 判断tags数组中是否包含"地址"，包含则显示"地址"，否则显示"抖音ID"
      return this.form.tags.includes('地址') ? '地址' : '抖音ID';
    }
  },
  watch: {},
  mounted() {},
  methods: {
    onClose() {
      this.open = false;
    },

    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.formType = 1;
      this.form = {
        devId: undefined,
        remark: null,
        taskName: null,

        douyinId: null,
        tags: ["视频", "基本信息", "评论"],
      };
    },
    /** 新增按钮操作 */
    handleAdd(row) {
      this.reset();
      this.open = true;
    },
    /** 修改按钮操作 */
    handleUpdate(row, ids) {},
    /** 提交按钮 */
    submitForm: function () {
      this.$refs.form.validate((valid) => {
        if (valid) {
          this.submitLoading = true;
          let data = {
            devId: this.form.devId,
            taskName: this.form.taskName,
            douyinId: this.form.douyinId
              .split("\n") // 按换行符分割成数组
              .filter(Boolean) // 过滤空字符串（防止连续换行）
              .join(","),
            remark: this.form.remark,
            tags: this.form.tags
              .filter((tag) => tag?.trim())
              .join(",")
              .replace(/[\u3001\uff0c,]/g, ",")
              .replace(/\s+/g, "")
              .replace(/,+/g, ",")
              .replace(/^,|,$/g, ""),
          };
          addTags(data)
            .then((response) => {
              this.$message.success("新增任务完成", 3);
              this.open = false;
              this.$emit("ok");
            })
            .finally(() => {
              this.submitLoading = false;
            });
        } else {
          return false;
        }
      });
    },
  },
};
</script>

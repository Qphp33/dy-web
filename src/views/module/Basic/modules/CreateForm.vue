<template>
  <a-modal
    title="任务标签"
    :visible="open"
    :confirm-loading="submitLoading"
    width="1160px"
    wrapClassName="basic-create-modal"
    @ok="submitForm"
    @cancel="cancel"
  >
    <a-form-model
      ref="form"
      :model="form"
      :rules="rules"
      layout="vertical"
      class="basic-create-form"
    >
      <div class="basic-create-form__grid">
        <section class="basic-create-form__section">
          <div class="basic-create-form__section-title">
            <span>基础配置</span>
            <small>填写任务名并选择执行设备</small>
          </div>

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
        </section>

        <section class="basic-create-form__section">
          <div class="basic-create-form__section-title">
            <span>账号范围</span>
            <small>如需添加多个，换行输入</small>
          </div>

          <a-form-model-item label="抖音ID" prop="douyinId">
            <a-textarea
              v-model="form.douyinId"
              placeholder="如需添加多个,换行输入"
              :auto-size="{ minRows: 6, maxRows: 20 }"
            />
          </a-form-model-item>
        </section>
      </div>

      <div class="basic-create-form__grid basic-create-form__grid--bottom">
        <section class="basic-create-form__section">
          <div class="basic-create-form__section-title">
            <span>勾选需要执行的任务</span>
            <small>选择本次账号信息采集内容</small>
          </div>

          <a-form-model-item prop="tags">
            <a-checkbox-group v-model="form.tags">
              <div class="basic-task-tags__grid">
                <label class="basic-task-tag-card">
                  <a-checkbox value="视频">视频</a-checkbox>
                  <span>采集账号视频内容</span>
                </label>
                <label class="basic-task-tag-card">
                  <a-checkbox value="基本信息">基本信息</a-checkbox>
                  <span>采集账号基本资料</span>
                </label>
                <label class="basic-task-tag-card">
                  <a-checkbox value="评论">评论</a-checkbox>
                  <span>采集账号评论数据</span>
                </label>
              </div>
            </a-checkbox-group>
          </a-form-model-item>
        </section>

        <section class="basic-create-form__section">
          <div class="basic-create-form__section-title">
            <span>补充说明</span>
            <small>备注会显示在任务列表中</small>
          </div>

          <a-form-model-item label="备注" prop="remark">
            <a-input
              v-model.trim="form.remark"
              placeholder="请填写备注"
              allow-clear
            />
          </a-form-model-item>
        </section>
      </div>
    </a-form-model>
  </a-modal>
</template>

<script>
import { addTags, updateTags } from "@/api/module/Basic";

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
        type: 1,
        remark: null,
        tags: ["视频", "基本信息", "评论"],
      },
      // 1增加,2修改
      formType: 1,
      open: false,
      rules: {
        devId: [{ required: true, message: "请选择设备ID", trigger: "change" }],
        douyinId: [{ required: true, message: "请输入", trigger: "blur" }],
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
  computed: {},
  watch: {},
  mounted() {},
  methods: {
    onClose() {
      this.open = false;
    },
    clearFormValidate() {
      this.$nextTick(() => {
        if (this.$refs.form?.clearValidate) {
          this.$refs.form.clearValidate();
        }
      });
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
        type: 1,

        douyinId: null,
        tags: ["视频", "基本信息", "评论"],
      };
      this.clearFormValidate();
    },
    /** 新增按钮操作 */
    handleAdd(row) {
      this.reset();
      if (row) {
        this.form.douyinId = row.douyinId;
        this.form.taskName = row.douyinId;
        this.form.devId = this.deviceData[0].deviceCode;
      }
      this.open = true;
      this.clearFormValidate();
    },
    handleEdit(row) {
      this.open = true;
      this.$nextTick(() => {
        this.form = { ...row };

        if (this.form.douyinId) {
          this.form.douyinId = this.form.douyinId.split(",").join("\n");
        }
        if (this.form.tags) {
          this.form.tags = this.form.tags.split(",");
        }
        this.clearFormValidate();
      });
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
            type: 1,
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
          if (this.form.id) {
            data.id = this.form.id;
            updateTags(data)
              .then(() => {
                this.$message.success("修改任务成功", 3);
                this.open = false;
                this.$emit("ok");
              })
              .finally(() => {
                this.submitLoading = false;
              });
          } else {
            addTags(data)
              .then((response) => {
                this.$message.success("新增任务完成", 3);
                this.open = false;
                this.$emit("ok");
              })
              .finally(() => {
                this.submitLoading = false;
              });
          }
        } else {
          return false;
        }
      });
    },
  },
};
</script>

<style>
.basic-create-modal .ant-modal-content {
  border-radius: 28px;
  overflow: hidden;
}

.basic-create-modal .ant-modal-header {
  padding: 20px 28px;
  background: #1677ff;
  border-bottom: 0;
}

.basic-create-modal .ant-modal-title,
.basic-create-modal .ant-modal-close-x {
  color: #fff;
}

.basic-create-modal .ant-modal-body {
  padding: 28px;
  background: linear-gradient(180deg, #f8fbff 0%, #f3f8ff 100%);
}

.basic-create-modal .ant-modal-footer {
  padding: 16px 28px 24px;
  border-top: 0;
}

.basic-create-form__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.basic-create-form__grid--bottom {
  align-items: start;
  margin-top: 18px;
}

.basic-create-form__section {
  padding: 20px;
  border-radius: 22px;
  background: #fff;
  border: 1px solid #e4eef9;
  box-shadow: 0 10px 24px rgba(22, 119, 255, 0.05);
}

.basic-create-form__section-title {
  margin-bottom: 18px;
}

.basic-create-form__section-title span,
.basic-create-form__section-title small {
  display: block;
}

.basic-create-form__section-title span {
  margin: 0 0 6px;
  color: #0f172a;
  font-size: 18px;
  font-weight: 700;
}

.basic-create-form__section-title small {
  color: #64748b;
}

.basic-task-tags__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.basic-task-tag-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 92px;
  padding: 14px 16px;
  border-radius: 18px;
  background: #f8fbff;
  border: 1px solid #e4eef9;
  cursor: pointer;
}

.basic-task-tag-card span {
  color: #64748b;
  font-size: 12px;
  line-height: 1.6;
}

.basic-create-form .ant-form-item:last-child {
  margin-bottom: 0;
}

@media (max-width: 900px) {
  .basic-create-form__grid {
    grid-template-columns: 1fr;
  }

  .basic-task-tags__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .basic-task-tags__grid {
    grid-template-columns: 1fr;
  }
}
</style>

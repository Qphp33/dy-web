<template>
  <a-modal
    title="位置信息任务"
    :visible="open"
    :confirm-loading="submitLoading"
    width="1260px"
    wrapClassName="address-create-modal"
    okText="保存"
    cancelText="取消"
    @ok="submitForm"
    @cancel="cancel"
  >
    <a-form-model
      ref="form"
      :model="form"
      :rules="rules"
      layout="vertical"
      class="create-form"
    >
      <div class="create-form__grid">
        <section class="create-form__section">
          <div class="create-form__section-title">
            <span>基础配置</span>
            <small>先选执行设备并设置任务名</small>
          </div>

          <a-form-model-item label="任务名称" prop="taskName">
            <a-input
              v-model.trim="form.taskName"
              placeholder="例如：上海热门商圈地址采集"
              allow-clear
            />
          </a-form-model-item>

          <a-form-model-item label="执行设备" prop="devId">
            <a-select
              placeholder="请选择设备"
              v-model="form.devId"
              style="width: 100%"
              allow-clear
              show-search
              option-filter-prop="children"
            >
              <a-select-option
                v-for="(d, index) in deviceData"
                :key="index"
                :value="d.deviceCode"
              >
                {{ d.deviceName + "_" + d.id }}
              </a-select-option>
            </a-select>
          </a-form-model-item>
        </section>

        <section class="create-form__section">
          <div class="create-form__section-title">
            <span>采集范围</span>
            <small>支持一次提交多个位置名，按行分隔</small>
          </div>

          <a-form-model-item label="位置名称" prop="douyinId">
            <a-textarea
              v-model="form.douyinId"
              placeholder="例如：台北101大楼
              外滩"
              :auto-size="{ minRows: 7, maxRows: 14 }"
            />
          </a-form-model-item>
        </section>
      </div>

      <div class="create-form__grid create-form__grid--bottom">
        <section class="create-form__section">
          <div class="create-form__section-title">
            <span>采集内容</span>
            <small>勾选要执行的模块，并选择视频抓取范围</small>
          </div>

          <a-form-model-item prop="tags">
            <div class="task-tags">
              <a-checkbox-group v-model="form.tags">
                <div class="task-tags__grid">
                  <label class="task-tag-card">
                    <a-checkbox value="视频">视频</a-checkbox>
                    <span>抓取位置相关视频</span>
                  </label>
                  <label class="task-tag-card">
                    <a-checkbox value="基本信息">基本信息</a-checkbox>
                    <span>采集账号基本资料</span>
                  </label>
                  <label class="task-tag-card">
                    <a-checkbox value="评论">评论</a-checkbox>
                    <span>拉取评论内容与数量</span>
                  </label>
                  <label class="task-tag-card">
                    <a-checkbox value="地址">地址</a-checkbox>
                    <span>保留地址相关字段</span>
                  </label>
                </div>
              </a-checkbox-group>

              <div class="task-tags__divider"></div>

              <a-radio-group
                v-model="radioTag"
                @change="handleRadioChange"
                class="task-tags__radio"
              >
                <a-radio-button value="单用户前六条视频"
                  >单用户前六条视频</a-radio-button
                >
                <a-radio-button value="单用户所有视频"
                  >单用户所有视频</a-radio-button
                >
              </a-radio-group>
            </div>
          </a-form-model-item>
        </section>

        <section class="create-form__section">
          <div class="create-form__section-title">
            <span>补充说明</span>
            <small>备注会同步到任务列表，方便后续筛选</small>
          </div>

          <a-form-model-item label="备注" prop="remark">
            <a-input
              v-model.trim="form.remark"
              placeholder="例如：优先采集夜景和高热视频"
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
  data() {
    return {
      submitLoading: false,
      radioTag: "单用户前六条视频",
      form: {
        devId: undefined,
        douyinId: null,
        taskName: null,
        remark: null,
        type: 2,
        tags: ["视频", "基本信息", "评论", "地址", "单用户前六条视频"],
      },
      formType: 1,
      open: false,
      exclusiveTags: ["单用户所有视频", "单用户前六条视频"],
      rules: {
        devId: [
          { required: true, message: "请选择设备 ID", trigger: "change" },
        ],
        douyinId: [
          { required: true, message: "请输入位置名称", trigger: "blur" },
        ],
        taskName: [
          { required: true, message: "请填写任务名称", trigger: "blur" },
        ],
        tags: [
          {
            type: "array",
            required: true,
            message: "请至少选择一个任务项",
            trigger: "change",
          },
        ],
      },
    };
  },
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
    cancel() {
      this.open = false;
      this.reset();
    },
    reset() {
      this.formType = 1;
      this.radioTag = "单用户前六条视频";
      this.form = {
        devId: undefined,
        remark: null,
        taskName: null,
        type: 2,
        douyinId: null,
        tags: ["视频", "基本信息", "评论", "地址", "单用户前六条视频"],
      };
      this.clearFormValidate();
    },
    handleAdd() {
      this.reset();
      this.open = true;
      this.clearFormValidate();
    },
    // 编辑 → 回填数据
    // 编辑回填方法
    handleEdit(row) {
      this.open = true; // 打开弹窗
      this.$nextTick(() => {
        // 把当前行数据复制到表单
        this.form = { ...row };

        // 兼容处理：把后端的逗号字符串转回数组/多行
        if (this.form.douyinId) {
          this.form.douyinId = this.form.douyinId.split(",").join("\n");
        }
        if (this.form.tags) {
          this.form.tags = this.form.tags.split(",");
        }
 
        if (this.form.tags.includes("单用户前六条视频")) {
          this.radioTag = "单用户前六条视频";
        } else if (this.form.tags.includes("单用户所有视频")) {
          this.radioTag = "单用户所有视频";
        } else {
          this.radioTag = "单用户前六条视频";
        }
        this.clearFormValidate();
      });
    },
    handleUpdate(row, ids) {},
    handleRadioChange(e) {
      const selectTag = e.target?.value || this.radioTag;
      this.form.tags = this.form.tags.filter(
        (tag) => !this.exclusiveTags.includes(tag)
      );
      this.form.tags.push(selectTag);
    },
    submitForm() {
      this.$refs.form.validate((valid) => {
        if (!valid) {
          return false;
        }
        this.submitLoading = true;

        // 组装数据（和你原来一样）
        const data = {
          devId: this.form.devId,
          taskName: this.form.taskName,
          type: 2,
          douyinId: this.form.douyinId.split("\n").filter(Boolean).join(","),
          remark: this.form.remark,
          tags: this.form.tags
            .filter((tag) => tag?.trim())
            .join(",")
            .replace(/[\u3001\uff0c,]/g, ",")
            .replace(/\s+/g, "")
            .replace(/,+/g, ",")
            .replace(/^,|,$/g, ""),
        };

        // =============================================
        // 关键逻辑：有 ID 就修改，没有 ID 就新增
        // =============================================
        if (this.form.id) {
          // 编辑模式：带上 ID，调用修改接口
          data.id = this.form.id;

          // ========== 这里换成你的【修改任务接口】 ==========
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
          // 新增模式：保持你原来的逻辑不变
          addTags(data)
            .then(() => {
              this.$message.success("新增任务完成", 3);
              this.open = false;
              this.$emit("ok");
            })
            .finally(() => {
              this.submitLoading = false;
            });
        }
      });
    },
  },
};
</script>

<style>
.address-create-modal .ant-modal-content {
  border-radius: 28px;
  overflow: hidden;
}

.address-create-modal .ant-modal-header {
  padding: 20px 28px;
  background: #1677ff;
  border-bottom: 0;
}

.address-create-modal .ant-modal-title,
.address-create-modal .ant-modal-close-x {
  color: #fff;
}

.address-create-modal .ant-modal-body {
  padding: 28px;
  background: linear-gradient(180deg, #f8fbff 0%, #f3f8ff 100%);
}

.address-create-modal .ant-modal-footer {
  padding: 16px 28px 24px;
  border-top: 0;
}

.create-form__intro {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 18px 20px;
  margin-bottom: 22px;
  border-radius: 22px;
  background: #f4f9ff;
  border: 1px solid #dbeafe;
}

.create-form__intro-icon {
  width: 52px;
  height: 52px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1677ff, #69b1ff);
  color: #fff;
  font-size: 22px;
  box-shadow: 0 12px 24px rgba(22, 119, 255, 0.18);
}

.create-form__intro h3,
.create-form__section-title span {
  margin: 0 0 6px;
  color: #0f172a;
  font-size: 18px;
  font-weight: 700;
}

.create-form__intro p,
.create-form__section-title small {
  color: #64748b;
}

.create-form__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.create-form__grid--bottom {
  align-items: start;
  margin-top: 18px;
}

.create-form__section {
  padding: 20px;
  border-radius: 22px;
  background: #fff;
  border: 1px solid #e4eef9;
  box-shadow: 0 10px 24px rgba(22, 119, 255, 0.05);
}

.create-form__section-title {
  margin-bottom: 18px;
}

.create-form__section-title span,
.create-form__section-title small {
  display: block;
}

.task-tags__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.task-tag-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  border-radius: 18px;
  background: #f8fbff;
  border: 1px solid #e4eef9;
  cursor: pointer;
}

.task-tag-card span {
  color: #64748b;
  font-size: 12px;
  line-height: 1.6;
}

.task-tags__divider {
  height: 1px;
  margin: 18px 0;
  background: linear-gradient(90deg, transparent, #d6e6fb, transparent);
}

.task-tags__radio .ant-radio-button-wrapper {
  height: 40px;
  line-height: 38px;
  border-radius: 999px;
  margin-right: 10px;
  padding: 0 18px;
  border: 1px solid #d6e8ff !important;
  color: #4b5f7a;
  box-shadow: none !important;
}

.task-tags__radio .ant-radio-button-wrapper:not(:first-child)::before {
  display: none !important;
}

.task-tags__radio .ant-radio-button-wrapper-checked {
  background: linear-gradient(135deg, #1677ff, #69b1ff);
  border-color: transparent !important;
  box-shadow: 0 12px 24px rgba(22, 119, 255, 0.16);
  color: #fff !important;
}

.task-tags__radio .ant-radio-button-wrapper-checked:hover,
.task-tags__radio .ant-radio-button-wrapper-checked:focus,
.task-tags__radio .ant-radio-button-wrapper-checked:active {
  color: #fff !important;
}

.task-tags__radio .ant-radio-button-wrapper:hover {
  color: #1677ff;
  border-color: #91caff !important;
}

.create-form .ant-form-item:last-child {
  margin-bottom: 0;
}

@media (max-width: 900px) {
  .create-form__grid,
  .task-tags__grid {
    grid-template-columns: 1fr;
  }
}
</style>

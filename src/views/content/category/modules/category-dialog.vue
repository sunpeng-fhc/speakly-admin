<template>
  <ElDialog
    v-model="dialogVisible"
    :title="dialogType === 'add' ? '添加分类' : '编辑分类'"
    width="30%"
    align-center
  >
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="80px">
      <ElFormItem label="分类名称" prop="name">
        <ElInput v-model="formData.name" placeholder="请输入分类名称" />
      </ElFormItem>
      <ElFormItem label="分类标识" prop="slug">
        <ElInput v-model="formData.slug" placeholder="请输入分类标识" />
      </ElFormItem>
      <ElFormItem label="分类描述" prop="description">
        <ElInput v-model="formData.description" placeholder="请输入分类描述" />
      </ElFormItem>
      <ElFormItem label="启用">
        <ElSwitch v-model="formData.status" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit">提交</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  //修改分类
  import { updateCategory } from '@/api/content-manage'
  // 添加分类
  import { createCategory } from '@/api/content-manage'

  interface Props {
    visible: boolean
    type: string
    categoryData?: Partial<Api.ContentManage.CategoryListItem>
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'submit'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()
  // 对话框显示控制
  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const dialogType = computed(() => props.type)

  // 表单实例
  const formRef = ref<FormInstance>()

  // 表单数据
  const formData = reactive<Api.ContentManage.CategoryForm>({
    id: undefined,
    name: '',
    slug: '',
    description: '',
    status: true
  })

  // 表单验证规则
  const rules: FormRules = {
    name: [
      { required: true, message: '请输入分类名称', trigger: 'blur' },
      { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    slug: [
      { required: true, message: '请输入分类标识', trigger: 'blur' },
      { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    description: [
      { required: true, message: '请输入分类描述', trigger: 'blur' },
      { min: 2, max: 200, message: '长度在 2 到 200 个字符', trigger: 'blur' }
    ]
  }

  /**
   * 初始化表单数据
   * 根据对话框类型（新增/编辑）填充表单
   */
  const initFormData = () => {
    const isEdit = props.type === 'edit' && props.categoryData
    const row = props.categoryData

    Object.assign(formData, {
      id: isEdit && row ? row.id : undefined,
      name: isEdit && row ? row.name || '' : '',
      slug: isEdit && row ? row.slug || '' : '',
      description: isEdit && row ? row.description || '' : '',
      status: isEdit && row ? (row.status ?? true) : true
    })
  }

  /**
   * 监听对话框状态变化
   * 当对话框打开时初始化表单数据并清除验证状态
   */
  watch(
    () => [props.visible, props.type, props.categoryData],
    ([visible]) => {
      if (visible) {
        initFormData()
        nextTick(() => {
          formRef.value?.clearValidate()
        })
      }
    },
    { immediate: true }
  )

  /**
   * 提交表单
   * 验证通过后触发提交事件
   */
  const handleSubmit = async () => {
    if (!formRef.value) return

    await formRef.value.validate(async (valid) => {
      if (!valid) return

      try {
        const payload: Api.ContentManage.CategoryCreateParams = {
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          status: formData.status
        }

        if (dialogType.value === 'add') {
          await createCategory(payload)
          ElMessage.success('添加成功')
        } else {
          if (!formData.id) {
            ElMessage.error('缺少分类ID')
            return
          }

          await updateCategory(formData.id, payload)
          ElMessage.success('更新成功')
        }

        dialogVisible.value = false
        emit('submit')
      } catch (error) {
        ElMessage.error(dialogType.value === 'add' ? '添加失败' : '更新失败')
      }
    })
  }
</script>

<template>
  <ElDialog
    v-model="visible"
    :title="dialogType === 'add' ? '新增课程' : '编辑课程'"
    width="50%"
    align-center
    @close="handleClose"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="120px">
      <ElFormItem label="课程标题" prop="title">
        <ElInput v-model="form.title" placeholder="请输入课程标题" />
      </ElFormItem>

      <ElFormItem label="课程标识" prop="slug">
        <ElInput v-model="form.slug" placeholder="请输入课程标识，例如 morning-coffee" />
      </ElFormItem>

      <!--      <ElFormItem label="分类ID" prop="categoryId">-->
      <!--        <ElInputNumber v-model="form.categoryId" :min="1" style="width: 100%" />-->
      <!--      </ElFormItem>-->
      <ElFormItem label="课程分类" prop="categoryId">
        <ElSelect v-model="form.categoryId" placeholder="请选择课程分类" style="width: 100%">
          <ElOption
            v-for="item in categoryOptions"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </ElSelect>
      </ElFormItem>

      <ElFormItem label="课程等级" prop="level">
        <ElSelect v-model="form.level" placeholder="请选择课程等级">
          <ElOption label="A1" value="A1" />
          <ElOption label="A2" value="A2" />
          <ElOption label="B1" value="B1" />
        </ElSelect>
      </ElFormItem>

      <ElFormItem label="课程简介" prop="summary">
        <ElInput v-model="form.summary" type="textarea" :rows="3" placeholder="请输入课程简介" />
      </ElFormItem>

      <ElFormItem label="封面图" prop="coverImage">
        <ElInput v-model="form.coverImage" placeholder="请输入封面图地址" />
      </ElFormItem>

      <ElFormItem label="音频地址" prop="audioUrl">
        <ElInput v-model="form.audioUrl" placeholder="请输入音频地址" />
      </ElFormItem>

      <ElFormItem label="音频时长" prop="durationSeconds">
        <ElInputNumber v-model="form.durationSeconds" :min="0" style="width: 100%" />
      </ElFormItem>

      <ElFormItem label="文章内容" prop="transcript">
        <ElInput
          v-model="form.transcript"
          type="textarea"
          :rows="6"
          placeholder="请输入完整课程文章内容"
        />
      </ElFormItem>

      <ElFormItem label="排序" prop="sortOrder">
        <ElInputNumber v-model="form.sortOrder" :min="0" style="width: 100%" />
      </ElFormItem>

      <ElFormItem label="推荐课程">
        <ElSwitch v-model="form.isFeatured" />
      </ElFormItem>

      <ElFormItem label="启用">
        <ElSwitch v-model="form.status" />
      </ElFormItem>

      <ElFormItem label="每日推荐">
        <ElSwitch v-model="form.isDaily" />
      </ElFormItem>

      <ElFormItem v-if="form.isDaily" label="每日日期">
        <ElDatePicker v-model="form.dailyDate" type="date" placeholder="请选择日期" />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="handleClose">取消</ElButton>
      <ElButton type="primary" @click="handleSubmit">提交</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import { createLesson, updateLesson } from '@/api/content-manage'
  import { fetchGetCategoryList } from '@/api/content-manage'

  type LessonListItem = Api.ContentManage.LessonListItem

  interface Props {
    modelValue: boolean
    dialogType: 'add' | 'edit'
    lessonData?: LessonListItem
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'success'): void
  }

  const categoryOptions = ref<Api.ContentManage.CategoryListItem[]>([])

  const getCategoryOptions = async () => {
    const res = await fetchGetCategoryList({
      current: 1,
      size: 100,
      status: true
    })

    categoryOptions.value = res.records || []
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    dialogType: 'add',
    lessonData: undefined
  })

  const emit = defineEmits<Emits>()

  const formRef = ref<FormInstance>()

  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const form = reactive<Api.ContentManage.LessonForm>({
    id: undefined,
    categoryId: undefined,
    title: '',
    slug: '',
    summary: '',
    coverImage: '',
    audioUrl: '',
    durationSeconds: undefined,
    level: 'A1',
    transcript: '',
    status: true,
    isFeatured: false,
    sortOrder: 0,
    publishedAt: null,
    isDaily: false,
    dailyDate: null
  })

  const rules = reactive<FormRules>({
    title: [{ required: true, message: '请输入课程标题', trigger: 'blur' }],
    slug: [{ required: true, message: '请输入课程标识', trigger: 'blur' }],
    categoryId: [{ required: true, message: '请输入分类ID', trigger: 'change' }],
    level: [{ required: true, message: '请选择课程等级', trigger: 'change' }],
    summary: [{ required: true, message: '请输入课程简介', trigger: 'blur' }],
    audioUrl: [{ required: true, message: '请输入音频地址', trigger: 'blur' }],
    transcript: [{ required: true, message: '请输入文章内容', trigger: 'blur' }]
  })

  const resetForm = () => {
    Object.assign(form, {
      id: undefined,
      categoryId: undefined,
      title: '',
      slug: '',
      summary: '',
      coverImage: '',
      audioUrl: '',
      durationSeconds: undefined,
      level: 'A1',
      transcript: '',
      status: true,
      isFeatured: false,
      sortOrder: 0,
      publishedAt: null
    })
  }

  const initForm = () => {
    if (props.dialogType === 'edit' && props.lessonData) {
      Object.assign(form, props.lessonData)
    } else {
      resetForm()
    }

    nextTick(() => {
      formRef.value?.clearValidate()
    })
  }

  watch(
    () => props.modelValue,
    (val) => {
      if (val) initForm()
    }
  )

  watch(
    () => props.lessonData,
    () => {
      if (props.modelValue) initForm()
    },
    { deep: true }
  )

  watch(
    () => props.modelValue,
    async (val) => {
      if (val) {
        await getCategoryOptions()
        initForm()
      }
    }
  )

  const handleClose = () => {
    visible.value = false
    resetForm()
    formRef.value?.clearValidate()
  }

  const handleSubmit = async () => {
    if (!formRef.value) return

    await formRef.value.validate(async (valid) => {
      if (!valid) return

      const payload: Api.ContentManage.LessonCreateParams = {
        categoryId: form.categoryId!,
        title: form.title,
        slug: form.slug,
        summary: form.summary,
        coverImage: form.coverImage,
        audioUrl: form.audioUrl,
        durationSeconds: form.durationSeconds || 0,
        level: form.level,
        transcript: form.transcript,
        status: form.status,
        isFeatured: form.isFeatured,
        sortOrder: form.sortOrder,
        publishedAt: form.publishedAt,
        isDaily: form.isDaily,
        dailyDate: form.dailyDate
      }

      try {
        if (props.dialogType === 'add') {
          await createLesson(payload)
          ElMessage.success('新增成功')
        } else {
          if (!form.id) {
            ElMessage.error('缺少课程ID')
            return
          }

          await updateLesson(form.id, payload)
          ElMessage.success('修改成功')
        }

        emit('success')
        handleClose()
      } catch (error: any) {
        console.error(error)
        ElMessage.error(error?.response?.data?.msg || '提交失败')
      }
    })
  }
</script>

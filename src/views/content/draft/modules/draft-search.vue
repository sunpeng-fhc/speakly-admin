<template>
  <ArtSearchBar
    ref="searchBarRef"
    v-model="formData"
    :items="formItems"
    :rules="rules"
    @reset="handleReset"
    @search="handleSearch"
  />
</template>

<script setup lang="ts">
  import { fetchGetCategoryList } from '@/api/content-manage'

  const categoryOptions = ref<{ label: string; value: number }[]>([])

  const getCategoryOptions = async () => {
    const res = await fetchGetCategoryList({
      current: 1,
      size: 100,
      status: true
    })

    categoryOptions.value = (res.records || []).map((item) => ({
      label: item.name,
      value: item.id
    }))
  }

  onMounted(() => {
    getCategoryOptions()
  })

  type LessonSearchFormParams = Api.ContentManage.LessonSearchParams & {
    daterange?: string[]
  }

  interface Props {
    modelValue: LessonSearchFormParams
  }

  interface Emits {
    (e: 'update:modelValue', value: LessonSearchFormParams): void
    (e: 'search', params: LessonSearchFormParams): void
    (e: 'reset'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const searchBarRef = ref()

  const formData = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const rules = {}

  const levelOptions = ref([
    { label: 'A1', value: 'A1' },
    { label: 'A2', value: 'A2' }
  ])

  const statusOptions = ref([
    { label: '启用', value: true },
    { label: '禁用', value: false }
  ])

  const formItems = computed(() => [
    {
      label: '课程标题',
      key: 'title',
      type: 'input',
      placeholder: '请输入课程标题',
      clearable: true
    },
    {
      label: '课程标识',
      key: 'slug',
      type: 'input',
      placeholder: '请输入课程标识',
      clearable: true
    },
    {
      label: '课程分类',
      key: 'categoryId',
      type: 'select',
      props: {
        placeholder: '请选择课程分类',
        options: categoryOptions.value,
        clearable: true
      }
    },
    {
      label: '课程等级',
      key: 'level',
      type: 'select',
      props: {
        placeholder: '请选择课程等级',
        options: levelOptions.value,
        clearable: true
      }
    },
    {
      label: '课程状态',
      key: 'status',
      type: 'select',
      props: {
        placeholder: '请选择状态',
        options: statusOptions.value,
        clearable: true
      }
    },
    {
      label: '创建日期',
      key: 'daterange',
      type: 'datetime',
      props: {
        style: { width: '100%' },
        placeholder: '请选择日期范围',
        type: 'daterange',
        rangeSeparator: '至',
        startPlaceholder: '开始日期',
        endPlaceholder: '结束日期',
        valueFormat: 'YYYY-MM-DD',
        shortcuts: [
          { text: '今日', value: [new Date(), new Date()] },
          { text: '最近一周', value: [new Date(Date.now() - 604800000), new Date()] },
          { text: '最近一个月', value: [new Date(Date.now() - 2592000000), new Date()] }
        ]
      }
    }
  ])

  const handleReset = () => {
    emit('reset')
  }

  const handleSearch = async (params: LessonSearchFormParams) => {
    await searchBarRef.value.validate()
    emit('search', params)
  }
</script>

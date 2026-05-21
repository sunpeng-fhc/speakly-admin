<template>
  <ArtSearchBar
    ref="searchBarRef"
    v-model="formData"
    :items="formItems"
    :rules="rules"
    @reset="handleReset"
    @search="handleSearch"
  >
  </ArtSearchBar>
</template>

<script setup lang="ts">
  type CategorySearchParams = Api.ContentManage.CategorySearchParams & {
    daterange?: string[]
  }

  interface Props {
    modelValue: CategorySearchParams
  }

  interface Emits {
    (e: 'update:modelValue', value: CategorySearchParams): void
    (e: 'search', params: CategorySearchParams): void
    (e: 'reset'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const searchBarRef = ref()

  /**
   * 表单数据双向绑定
   */
  const formData = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  /**
   * 表单校验规则
   */
  const rules = {}

  /**
   * 角色状态选项
   */
  const statusOptions = ref([
    { label: '启用', value: true },
    { label: '禁用', value: false }
  ])

  /**
   * 搜索表单配置项
   */
  const formItems = computed(() => [
    {
      label: '分类名称',
      key: 'name',
      type: 'input',
      placeholder: '请输入分类名称',
      clearable: true
    },
    {
      label: '分类编码',
      key: 'slug',
      type: 'input',
      placeholder: '请输入分类编码',
      clearable: true
    },
    {
      label: '分类描述',
      key: 'description',
      type: 'input',
      placeholder: '请输入分类描述',
      clearable: true
    },
    {
      label: '分类状态',
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
      key: 'createdAt',
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

  /**
   * 处理重置事件
   */
  const handleReset = () => {
    emit('reset')
  }

  /**
   * 处理搜索事件
   * 验证表单后触发搜索
   */
  const handleSearch = async (params: CategorySearchParams) => {
    await searchBarRef.value.validate()
    emit('search', params)
  }
</script>

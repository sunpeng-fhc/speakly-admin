<!-- 内容-课程管理页面 -->
<template>
  <div class="art-full-height">
    <LessonSearch
      v-show="showSearchBar"
      v-model="searchForm"
      @search="handleSearch"
      @reset="resetSearchParams"
    ></LessonSearch>

    <ElCard class="art-table-card" :style="{ 'margin-top': showSearchBar ? '12px' : '0' }">
      <ArtTableHeader
        v-model:columns="columnChecks"
        v-model:showSearchBar="showSearchBar"
        :loading="loading"
        @refresh="refreshData"
      >
        <template #left>
          <ElSpace wrap>
            <ElButton @click="showDialog('add')" v-ripple>新增课程</ElButton>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <!-- 表格 -->
      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      >
      </ArtTable>
    </ElCard>

    <!-- 课程编辑弹窗 -->
    <LessonEditDialog
      v-model="dialogVisible"
      :dialog-type="dialogType"
      :lesson-data="currentLessonData"
      @success="refreshData"
    />
  </div>
</template>

<script setup lang="ts">
  import { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import ArtButtonMore from '@/components/core/forms/art-button-more/index.vue'
  import LessonSearch from './modules/lesson-search.vue'
  import LessonEditDialog from './modules/lesson-edit-dialog.vue'

  import { fetchGetLessonList, deleteLesson } from '@/api/content-manage'
  import { ElTag, ElMessageBox, ElMessage, dayjs } from 'element-plus'

  defineOptions({ name: 'Lesson' })

  type LessonListItem = Api.ContentManage.LessonListItem

  type LessonSearchFormParams = Api.ContentManage.LessonSearchParams & {
    daterange?: string[]
  }

  // 搜索表单
  const searchForm = ref<LessonSearchFormParams>({
    title: undefined,
    level: undefined,
    categoryId: undefined,
    isFeatured: undefined,
    status: undefined
  })

  const showSearchBar = ref(false)

  const dialogVisible = ref(false)

  const currentLessonData = ref<LessonListItem | undefined>(undefined)

  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    getData,
    replaceSearchParams,
    resetSearchParams,
    handleSizeChange,
    handleCurrentChange,
    refreshData
  } = useTable({
    // 核心配置
    core: {
      apiFn: fetchGetLessonList,
      apiParams: {
        current: 1,
        size: 20
      },
      // 排除 apiParams 中的属性
      excludeParams: ['daterange'],
      columnsFactory: () => [
        {
          prop: 'id',
          label: '课程ID',
          width: 100
        },
        {
          prop: 'title',
          label: '课程标题',
          minWidth: 150
        },
        {
          prop: 'categoryName',
          label: '课程分类',
          width: 150,
          formatter: (row: LessonListItem) => row.categoryName || '-'
        },
        {
          prop: 'level',
          label: '课程等级',
          minWidth: 50,
          formatter: (row: LessonListItem) => h(ElTag, { type: 'info' }, () => row.level || '-')
        },
        {
          prop: 'durationSeconds',
          label: '课程时长',
          minWidth: 100,
          formatter: (row: LessonListItem) => {
            if (!row.durationSeconds) return '-'
            const minutes = Math.floor(row.durationSeconds / 60)
            const seconds = row.durationSeconds % 60
            return `${minutes}:${String(seconds).padStart(2, '0')}`
          }
        },
        {
          prop: 'status',
          label: '课程状态',
          width: 100,
          formatter: (row) => {
            const statusConfig = row.status
              ? { type: 'success', text: '启用' }
              : { type: 'warning', text: '禁用' }
            return h(
              ElTag,
              { type: statusConfig.type as 'success' | 'warning' },
              () => statusConfig.text
            )
          }
        },
        {
          prop: 'isFeatured',
          label: '是否推荐',
          width: 100,
          formatter: (row) => {
            const statusConfig = row.isFeatured
              ? { type: 'success', text: '推荐' }
              : { type: 'warning', text: '不推荐' }
            return h(
              ElTag,
              { type: statusConfig.type as 'success' | 'warning' },
              () => statusConfig.text
            )
          }
        },
        {
          prop: 'createdAt',
          label: '创建日期',
          width: 180,
          sortable: true,
          formatter: (row: LessonListItem) => {
            if (!row.createdAt) return '-'
            return dayjs(row.createdAt).format('YYYY-MM-DD HH:mm')
          }
        },
        {
          prop: 'operation',
          label: '操作',
          width: 80,
          fixed: 'right',
          formatter: (row) =>
            h('div', [
              h(ArtButtonMore, {
                list: [
                  {
                    key: 'edit',
                    label: '编辑课程',
                    icon: 'ri:edit-2-line'
                  },
                  {
                    key: 'delete',
                    label: '删除课程',
                    icon: 'ri:delete-bin-4-line',
                    color: '#f56c6c'
                  }
                ],
                onClick: (item: ButtonMoreItem) => buttonMoreClick(item, row)
              })
            ])
        }
      ]
    }
  })

  const dialogType = ref<'add' | 'edit'>('add')

  const showDialog = (type: 'add' | 'edit', row?: LessonListItem) => {
    dialogVisible.value = true
    dialogType.value = type
    currentLessonData.value = row
  }

  /**
   * 搜索处理
   * @param params 搜索参数
   */
  const handleSearch = (params: LessonSearchFormParams) => {
    // 处理日期区间参数，把 daterange 转换为 startTime 和 endTime
    const { daterange, ...filtersParams } = params
    const [startTime, endTime] = Array.isArray(daterange) ? daterange : [null, null]

    replaceSearchParams({ ...filtersParams, startTime, endTime })
    getData()
  }

  const buttonMoreClick = (item: ButtonMoreItem, row: LessonListItem) => {
    switch (item.key) {
      case 'edit':
        showDialog('edit', row)
        break
      case 'delete':
        deleteRole(row)
        break
    }
  }

  const deleteRole = (row: LessonListItem) => {
    ElMessageBox.confirm(`确定删除课程"${row.title}"吗？此操作不可恢复！`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        // TODO: 调用删除接口
        try {
          await deleteLesson(row.id)
          ElMessage.success('删除成功')
          await refreshData()
        } catch (error: any) {
          console.error(error)
          ElMessage.error(error?.response?.data?.msg || '删除失败')
        }
        refreshData()
      })
      .catch(() => {
        ElMessage.info('已取消删除')
      })
  }
</script>

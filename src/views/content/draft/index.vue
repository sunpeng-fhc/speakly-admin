<!-- 草稿中心页面 -->
<template>
  <div class="art-full-height">
    <DraftSearch
      v-show="showSearchBar"
      v-model="searchForm"
      @search="handleSearch"
      @reset="resetSearchParams"
    />

    <ElCard class="art-table-card" :style="{ 'margin-top': showSearchBar ? '12px' : '0' }">
      <ArtTableHeader
        v-model:columns="columnChecks"
        v-model:showSearchBar="showSearchBar"
        :loading="loading"
        @refresh="refreshData"
      >
        <template #left>
          <ElSpace wrap>
            <ElButton @click="showDialog('add')" v-ripple>新增草稿</ElButton>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>

    <DraftEditDialog
      v-model="dialogVisible"
      :dialog-type="dialogType"
      :draft-data="currentDraftData"
      @success="refreshData"
    />
  </div>
</template>

<script setup lang="ts">
  import { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import ArtButtonMore from '@/components/core/forms/art-button-more/index.vue'
  import DraftSearch from './modules/draft-search.vue'
  import DraftEditDialog from './modules/draft-edit-dialog.vue'
  import { fetchDraftList, deleteDraft, publishDraft } from '@/api/draft'
  import { ElTag, ElMessageBox, ElMessage, dayjs } from 'element-plus'

  defineOptions({ name: 'DraftCenter' })

  interface DraftListItem {
    id: number
    title: string
    slug: string
    categoryName?: string
    level?: string
    draftStatus?: string
    isFeatured?: boolean
    sortOrder?: number
    createdAt?: string
    updatedAt?: string
  }

  interface DraftSearchParams {
    current?: number
    size?: number
    title?: string
    slug?: string
    keyword?: string
    categoryId?: number
    level?: string
    draftStatus?: string
    isFeatured?: boolean
    isDaily?: boolean
    startTime?: string | null
    endTime?: string | null
    daterange?: string[]
  }

  const searchForm = ref<DraftSearchParams>({
    title: undefined,
    slug: undefined,
    level: undefined,
    categoryId: undefined,
    draftStatus: undefined,
    isFeatured: undefined
  })

  const showSearchBar = ref(false)
  const dialogVisible = ref(false)
  const dialogType = ref<'add' | 'edit'>('add')
  const currentDraftData = ref<DraftListItem | undefined>(undefined)

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
    core: {
      apiFn: fetchDraftList,
      apiParams: {
        current: 1,
        size: 20
      },
      excludeParams: ['daterange'],
      columnsFactory: () => [
        {
          prop: 'id',
          label: '草稿ID',
          width: 100
        },
        {
          prop: 'title',
          label: '草稿标题',
          minWidth: 180
        },
        {
          prop: 'slug',
          label: '草稿标识',
          minWidth: 180,
          formatter: (row: DraftListItem) => row.slug || '-'
        },
        {
          prop: 'categoryName',
          label: '课程分类',
          width: 150,
          formatter: (row: DraftListItem) => row.categoryName || '-'
        },
        {
          prop: 'level',
          label: '课程等级',
          width: 100,
          formatter: (row: DraftListItem) => h(ElTag, { type: 'info' }, () => row.level || '-')
        },
        {
          prop: 'draftStatus',
          label: '草稿状态',
          width: 120,
          formatter: (row: DraftListItem) => {
            const statusMap: Record<string, { type: any; text: string }> = {
              DRAFT: { type: 'info', text: '草稿' },
              AI_GENERATED: { type: 'warning', text: 'AI已生成' },
              REVIEWING: { type: 'warning', text: '审核中' },
              READY_TO_PUBLISH: { type: 'primary', text: '待发布' },
              PUBLISHED: { type: 'success', text: '已发布' },
              REJECTED: { type: 'danger', text: '已拒绝' }
            }

            const config = statusMap[row.draftStatus || 'DRAFT'] || statusMap.DRAFT

            return h(ElTag, { type: config.type }, () => config.text)
          }
        },
        {
          prop: 'isFeatured',
          label: '是否推荐',
          width: 100,
          formatter: (row: DraftListItem) => {
            return h(ElTag, { type: row.isFeatured ? 'success' : 'info' }, () =>
              row.isFeatured ? '推荐' : '不推荐'
            )
          }
        },
        {
          prop: 'updatedAt',
          label: '更新时间',
          width: 180,
          sortable: true,
          formatter: (row: DraftListItem) => {
            if (!row.updatedAt) return '-'
            return dayjs(row.updatedAt).format('YYYY-MM-DD HH:mm')
          }
        },
        {
          prop: 'operation',
          label: '操作',
          width: 100,
          fixed: 'right',
          formatter: (row: DraftListItem) =>
            h('div', [
              h(ArtButtonMore, {
                list: [
                  ...(row.draftStatus === 'PUBLISHED'
                    ? []
                    : [
                        {
                          key: 'publish',
                          label: '发布草稿',
                          icon: 'ri:upload-cloud-2-line',
                          color: '#409eff'
                        }
                      ]),
                  {
                    key: 'edit',
                    label: '编辑草稿',
                    icon: 'ri:edit-2-line'
                  },
                  {
                    key: 'delete',
                    label: '删除草稿',
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

  const showDialog = (type: 'add' | 'edit', row?: DraftListItem) => {
    dialogVisible.value = true
    dialogType.value = type
    currentDraftData.value = row
  }

  const handleSearch = (params: DraftSearchParams) => {
    const { daterange, ...filtersParams } = params
    const [startTime, endTime] = Array.isArray(daterange) ? daterange : [null, null]

    replaceSearchParams({
      ...filtersParams,
      startTime,
      endTime
    })

    getData()
  }

  const buttonMoreClick = (item: ButtonMoreItem, row: DraftListItem) => {
    switch (item.key) {
      case 'edit':
        showDialog('edit', row)
        break
      case 'delete':
        handleDeleteDraft(row)
        break
      case 'publish':
        handlePublishDraft(row)
        break
    }
  }

  const handlePublishDraft = (row: DraftListItem) => {
    ElMessageBox.confirm(
      `确定发布草稿"${row.title}"为正式课程吗？发布后会生成正式课程、字幕分句和重点词汇。`,
      '发布确认',
      {
        confirmButtonText: '确定发布',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
      .then(async () => {
        try {
          await publishDraft(row.id)
          ElMessage.success('发布成功')
          await refreshData()
        } catch (error: any) {
          console.error(error)

          const msg = error?.response?.data?.msg || error?.data?.msg || error?.message || '发布失败'

          ElMessage.error(msg)
        }
      })
      .catch(() => {
        ElMessage.info('已取消发布')
      })
  }

  const handleDeleteDraft = (row: DraftListItem) => {
    ElMessageBox.confirm(`确定删除草稿"${row.title}"吗？此操作不可恢复！`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        try {
          await deleteDraft(row.id)
          ElMessage.success('删除成功')
          await refreshData()
        } catch (error: any) {
          console.error(error)
          ElMessage.error(error?.response?.data?.msg || '删除失败')
        }
      })
      .catch(() => {
        ElMessage.info('已取消删除')
      })
  }
</script>

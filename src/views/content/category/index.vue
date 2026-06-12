<!-- 内容-分类管理页面 -->
<template>
  <div class="art-full-height">
    <CategorySearch
      v-show="showSearchBar"
      v-model="searchForm"
      @search="handleSearch"
      @reset="resetSearchParams"
    ></CategorySearch>

    <ElCard class="art-table-card" :style="{ 'margin-top': showSearchBar ? '12px' : '0' }">
      <ArtTableHeader
        v-model:columns="columnChecks"
        v-model:showSearchBar="showSearchBar"
        :loading="loading"
        @refresh="refreshData"
      >
        <template #left>
          <ElSpace wrap>
            <ElButton @click="showDialog('add')" v-ripple>新增分类</ElButton>
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

    <!-- 内容-分类编辑弹窗 -->
    <CategoryDialog
      v-model:visible="dialogVisible"
      :type="dialogType"
      :category-data="currentCategoryData"
      @submit="handleDialogSubmit"
    />
  </div>
</template>

<script setup lang="ts">
  import { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import ArtButtonMore from '@/components/core/forms/art-button-more/index.vue'
  import CategorySearch from './modules/category-search.vue'
  import CategoryDialog from './modules/category-dialog.vue'

  // 获取分类列表
  import { fetchGetCategoryList, deleteCategory } from '@/api/content-manage'
  import { ElTag, ElMessageBox, dayjs } from 'element-plus'

  type CategoryListItem = Api.ContentManage.CategoryListItem
  type CategorySearchParams = Api.ContentManage.CategorySearchParams & {
    daterange?: string[]
  }

  // 搜索表单
  const searchForm = ref<CategorySearchParams>({
    name: undefined,
    slug: undefined,
    description: undefined,
    status: undefined,
    daterange: undefined
  })

  const showSearchBar = ref(false)

  const dialogVisible = ref(false)
  const permissionDialog = ref(false)
  const currentCategoryData = ref<CategoryListItem | undefined>(undefined)

  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    getData,
    resetSearchParams,
    replaceSearchParams,
    handleSizeChange,
    handleCurrentChange,
    refreshData
  } = useTable({
    // 核心配置
    core: {
      apiFn: fetchGetCategoryList,
      apiParams: {
        current: 1,
        size: 20
      },
      // 排除 apiParams 中的属性
      excludeParams: ['daterange'],
      columnsFactory: () => [
        {
          prop: 'id',
          label: '分类ID',
          width: 100
        },
        {
          prop: 'name',
          label: '分类名称',
          minWidth: 120
        },
        {
          prop: 'shortName',
          label: '分类简称',
          minWidth: 120
        },
        {
          prop: 'slug',
          label: '分类编码',
          minWidth: 100
        },
        {
          prop: 'description',
          label: '分类描述',
          minWidth: 150,
          showOverflowTooltip: true
        },
        {
          prop: 'status',
          label: '分类状态',
          width: 150,
          formatter: (rows) => {
            const statusConfig = rows.status
              ? { type: 'success' as const, text: '启用' }
              : { type: 'warning' as const, text: '禁用' }

            return h(
              ElTag,
              {
                type: statusConfig.type
              },
              () => statusConfig.text
            )
          }
        },
        {
          prop: 'createdAt',
          label: '创建日期',
          width: 180,
          sortable: true,
          formatter: (row) => {
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
                    label: '编辑分类',
                    icon: 'ri:edit-2-line'
                  },
                  {
                    key: 'delete',
                    label: '删除分类',
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

  const showDialog = (type: 'add' | 'edit', row?: CategoryListItem) => {
    dialogVisible.value = true
    dialogType.value = type
    currentCategoryData.value = row
  }

  /**
   * 搜索处理
   * @param params 搜索参数
   */
  const handleSearch = (params: CategorySearchParams) => {
    // 处理日期区间参数，把 daterange 转换为 startTime 和 endTime
    const { daterange, ...filtersParams } = params
    const [startTime, endTime] = Array.isArray(daterange) ? daterange : [null, null]

    replaceSearchParams({ ...filtersParams, startTime, endTime })
    getData()
  }

  const buttonMoreClick = (item: ButtonMoreItem, row: CategoryListItem) => {
    switch (item.key) {
      case 'permission':
        showPermissionDialog(row)
        break
      case 'edit':
        showDialog('edit', row)
        break
      case 'delete':
        deleteRole(row)
        break
    }
  }

  const showPermissionDialog = (row?: CategoryListItem) => {
    permissionDialog.value = true
    currentCategoryData.value = row
  }

  /**
   * 处理弹窗提交事件
   */
  const handleDialogSubmit = async () => {
    try {
      dialogVisible.value = false
      await refreshData()
    } catch (error) {
      console.error('提交失败:', error)
    }
  }

  const deleteRole = (row: CategoryListItem) => {
    ElMessageBox.confirm(`确定删除分类"${row.name}"吗？此操作不可恢复！`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        // TODO: 调用删除接口
        await deleteCategory(row.id)
        ElMessage.success('删除成功')
        refreshData()
      })
      .catch(() => {
        ElMessage.info('已取消删除')
      })
  }
</script>

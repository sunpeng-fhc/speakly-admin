import request from '@/utils/http'

// 获取分类列表
export function fetchGetCategoryList(params: Api.ContentManage.CategorySearchParams) {
  return request.get<Api.ContentManage.CategoryList>({
    url: '/api/category/list',
    params
  })
}

// 添加分类
export function createCategory(data: Api.ContentManage.CategoryCreateParams) {
  return request.post({
    url: '/api/category/create',
    data
  })
}

// 更新分类
export function updateCategory(id: number, data: Api.ContentManage.CategoryUpdateParams) {
  return request.put({
    url: `/api/category/update/${id}`,
    data
  })
}

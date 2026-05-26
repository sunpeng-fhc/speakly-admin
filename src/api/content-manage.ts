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

export function deleteCategory(id: number) {
  return request.del({
    url: `/api/category/delete/${id}`
  })
}

// 获取课程列表
export function fetchGetLessonList(params: Api.ContentManage.LessonSearchParams) {
  return request.get<Api.ContentManage.LessonList>({
    url: '/api/lesson/list',
    params
  })
}

export function deleteLesson(id: number) {
  return request.del({
    url: `/api/category/delete/${id}`
  })
}

// 添加课程
export function createLesson(data: Api.ContentManage.LessonCreateParams) {
  return request.post({
    url: '/api/lesson/create',
    data
  })
}

// 更新课程
export function updateLesson(id: number, data: Api.ContentManage.LessonUpdateParams) {
  return request.put({
    url: `/api/lesson/update/${id}`,
    data
  })
}

// 根据课程查询对应的字幕
export function fetchLessonSegments(lessonId: number) {
  return request.get<Api.ContentManage.LessonSegmentItem[]>({
    url: `/api/lesson-segment/list/${lessonId}`
  })
}
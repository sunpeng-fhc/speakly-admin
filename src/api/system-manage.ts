import request from '@/utils/http'
import { AppRouteRecord } from '@/types/router'

// 获取用户列表
export function fetchGetUserList(params: Api.SystemManage.UserSearchParams) {
  return request.get<Api.SystemManage.UserList>({
    url: '/api/user/list',
    params
  })
}

// 获取角色列表
export function fetchGetRoleList(params: Api.SystemManage.RoleSearchParams) {
  return request.get<Api.SystemManage.RoleList>({
    url: '/api/role/list',
    params
  })
}

// 获取菜单列表
export function fetchGetMenuList() {
  return request.get<AppRouteRecord[]>({
    url: '/api/v3/system/menus/simple'
  })
}

export function createMenu(data: any) {
  return request.post({
    url: '/api/v3/system/menus/create',
    data
  })
}

export function updateMenu(id: number, data: any) {
  return request.put({
    url: `/api/v3/system/menus/update/${id}`,
    data
  })
}

// 获取角色已分配的菜单ID
export function fetchRoleMenuIds(roleId: number) {
  return request.get<number[]>({
    url: `/api/role/${roleId}/menus`
  })
}

// 保存角色菜单权限
export function saveRoleMenus(data: { roleId: number; menuIds: number[] }) {
  return request.post({
    url: '/api/role/menus/save',
    data
  })
}

export function saveRolePermissions(data: {
  roleId: number
  menuIds: number[]
  buttonCodes: string[]
}) {
  return request.post({
    url: '/api/role/permissions/save',
    data
  })
}

// 获取用户已分配的角色ID
export function fetchUserRoleIds(userId: number) {
  return request.get<number[]>({
    url: `/api/user/${userId}/roles`
  })
}

// 保存用户角色
export function saveUserRoles(data: { userId: number; roleIds: number[] }) {
  return request.post({
    url: '/api/user/roles/save',
    data
  })
}

export function createUser(data: {
  username: string
  mobile?: string
  gender: number
  email?: string
  department?: string
  status?: string
  roleIds: number[]
}) {
  return request.post({
    url: '/api/user/create',
    data
  })
}

export function updateUser(
  id: number,
  data: {
    username: string
    mobile?: string
    gender: number
    email?: string
    department?: string
    status?: string
    roleIds: number[]
  }
) {
  return request.put({
    url: `/api/user/update/${id}`,
    data
  })
}


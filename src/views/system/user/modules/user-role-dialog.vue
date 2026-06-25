<template>
  <ElDialog v-model="visible" title="分配角色" width="420px" align-center @close="handleClose">
    <ElCheckboxGroup v-model="checkedRoleIds">
      <div v-for="role in roleList" :key="role.roleId" style="margin-bottom: 12px">
        <ElCheckbox :label="role.roleId"> {{ role.roleName }}（{{ role.roleCode }}） </ElCheckbox>
      </div>
    </ElCheckboxGroup>

    <template #footer>
      <ElButton @click="handleClose">取消</ElButton>
      <ElButton type="primary" @click="handleSave">保存</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { fetchGetRoleList, fetchUserRoleIds, saveUserRoles } from '@/api/system-manage'

  type UserListItem = Api.SystemManage.UserListItem
  type RoleListItem = Api.SystemManage.RoleListItem

  interface Props {
    modelValue: boolean
    userData?: UserListItem
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'success'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    userData: undefined
  })

  const emit = defineEmits<Emits>()

  const roleList = ref<RoleListItem[]>([])
  const checkedRoleIds = ref<number[]>([])

  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  watch(
    () => props.modelValue,
    async (newVal) => {
      if (newVal && props.userData?.id) {
        const roleRes = await fetchGetRoleList({
          current: 1,
          size: 100
        })

        roleList.value = roleRes.records || []

        const ids = await fetchUserRoleIds(props.userData.id)
        checkedRoleIds.value = ids
      }
    }
  )

  const handleSave = async () => {
    if (!props.userData?.id) {
      ElMessage.error('用户ID不存在')
      return
    }

    await saveUserRoles({
      userId: props.userData.id,
      roleIds: checkedRoleIds.value
    })

    ElMessage.success('用户角色保存成功')
    emit('success')
    handleClose()
  }

  const handleClose = () => {
    visible.value = false
    checkedRoleIds.value = []
  }
</script>

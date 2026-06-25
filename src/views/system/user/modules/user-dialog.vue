<template>
  <ElDialog
    v-model="dialogVisible"
    :title="dialogType === 'add' ? '添加用户' : '编辑用户'"
    width="30%"
    align-center
  >
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="80px">
      <ElFormItem label="用户名" prop="username">
        <ElInput v-model="formData.username" placeholder="请输入用户名" />
      </ElFormItem>
      <ElFormItem label="手机号" prop="phone">
        <ElInput v-model="formData.phone" placeholder="请输入手机号" />
      </ElFormItem>
      <ElFormItem label="性别" prop="gender">
        <ElSelect v-model="formData.gender">
          <ElOption label="男" value="男" />
          <ElOption label="女" value="女" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="角色" prop="roleIds">
        <ElSelect v-model="formData.roleIds" multiple placeholder="请选择角色">
          <ElOption
            v-for="role in roleList"
            :key="role.roleId"
            :value="role.roleId"
            :label="role.roleName"
          />
        </ElSelect>
      </ElFormItem>
    </ElForm>
    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit">提交</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import { fetchGetRoleList, fetchUserRoleIds, createUser, updateUser } from '@/api/system-manage'

  interface Props {
    visible: boolean
    type: string
    userData?: Partial<Api.SystemManage.UserListItem>
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'submit'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const roleList = ref<Api.SystemManage.RoleListItem[]>([])

  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const dialogType = computed(() => props.type)
  const formRef = ref<FormInstance>()

  const formData = reactive({
    username: '',
    phone: '',
    email: '',
    gender: '男',
    status: '1',
    roleIds: [] as number[]
  })

  const rules: FormRules = {
    username: [
      { required: true, message: '请输入用户名', trigger: 'blur' },
      { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    phone: [{ required: false }],
    gender: [{ required: true, message: '请选择性别', trigger: 'blur' }],
    roleIds: [{ required: true, message: '请选择角色', trigger: 'change' }]
  }

  const loadRoles = async () => {
    const res = await fetchGetRoleList({
      current: 1,
      size: 100
    })

    roleList.value = res.records || []
  }

  const initFormData = async () => {
    await loadRoles()

    const isEdit = props.type === 'edit' && props.userData
    const row = props.userData

    if (isEdit && row?.id) {
      const roleIds = await fetchUserRoleIds(row.id)

      Object.assign(formData, {
        username: row.userName || '',
        phone: row.userPhone || '',
        email: row.userEmail || '',
        gender: row.userGender || '男',
        status: row.status || '1',
        roleIds
      })
    } else {
      Object.assign(formData, {
        username: '',
        phone: '',
        email: '',
        gender: '男',
        status: '1',
        roleIds: []
      })
    }
  }

  watch(
    () => [props.visible, props.type, props.userData],
    async ([visible]) => {
      if (visible) {
        await initFormData()
        nextTick(() => {
          formRef.value?.clearValidate()
        })
      }
    },
    { immediate: true }
  )

  const handleSubmit = async () => {
    if (!formRef.value) return

    await formRef.value.validate()

    const payload = {
      username: formData.username,
      mobile: formData.phone,
      email: formData.email,
      gender: formData.gender === '女' ? 0 : 1,
      status: formData.status,
      roleIds: formData.roleIds
    }

    if (dialogType.value === 'add') {
      await createUser(payload)
      ElMessage.success('添加成功')
    } else {
      if (!props.userData?.id) {
        ElMessage.error('用户ID不存在')
        return
      }

      await updateUser(props.userData.id, payload)
      ElMessage.success('更新成功')
    }

    dialogVisible.value = false
    emit('submit')
  }
</script>

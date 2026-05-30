<template>
  <ElDialog
    v-model="visible"
    :title="dialogType === 'add' ? '新增课程' : '编辑课程'"
    width="78%"
    align-center
  >
    <ElTabs type="border-card" class="lesson-tabs">
      <ElTabPane label="基础信息">
        <div class="lesson-basic-panel">
          <section class="form-section">
            <h3>课程基础信息</h3>

            <ArtForm
              ref="formRef"
              v-model="form"
              :items="basicFormItems"
              :rules="rules"
              :span="width > 640 ? 12 : 24"
              :gutter="20"
              label-width="100px"
              :show-reset="false"
              :show-submit="false"
            />
          </section>

          <section class="form-section">
            <h3>媒体资源</h3>

            <div class="media-grid">
              <div class="media-block">
                <div class="media-title">课程封面</div>

                <ElUpload
                  accept=".jpg,.jpeg,.png,.webp"
                  :show-file-list="false"
                  :before-upload="handleCoverUpload"
                >
                  <ElButton type="primary">上传封面图</ElButton>
                </ElUpload>

                <div v-if="form.coverImage" class="cover-preview">
                  <img :src="form.coverImage" alt="cover" />
                  <div class="media-url">{{ form.coverImage }}</div>
                </div>
              </div>

              <div class="media-block">
                <div class="media-title">课程音频</div>

                <ElUpload
                  accept=".mp3,.wav,.m4a"
                  :show-file-list="false"
                  :before-upload="handleAudioUpload"
                >
                  <ElButton type="primary">上传音频</ElButton>
                </ElUpload>

                <div v-if="form.audioUrl" class="audio-card">
                  <audio controls :src="form.audioUrl"></audio>

                  <div class="audio-meta">
                    <div><strong>音频地址：</strong>{{ form.audioUrl }}</div>
                    <div><strong>音频时长：</strong>{{ formatDuration(form.durationSeconds) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section class="form-section">
            <h3>发布设置</h3>

            <ArtForm
              v-model="form"
              :items="publishFormItems"
              :span="width > 640 ? 8 : 24"
              :gutter="20"
              label-width="100px"
              :show-reset="false"
              :show-submit="false"
            />
          </section>

          <div class="dialog-footer">
            <ElButton @click="handleClose">取消</ElButton>
            <ElButton type="primary" @click="handleSubmit">确定</ElButton>
          </div>
        </div>
      </ElTabPane>

      <ElTabPane label="文章内容">
        <div class="readonly-panel">
          <ElAlert
            title="课程内容由字幕分句自动生成，如需修改请前往【字幕分句】模块。"
            type="info"
            :closable="false"
            show-icon
          />

          <ElInput
            :model-value="form.transcript"
            type="textarea"
            :rows="18"
            readonly
            placeholder="暂无文章内容，请先上传并解析 SRT 字幕。"
          />
        </div>
      </ElTabPane>

      <ElTabPane label="字幕分句">
        <div class="segment-panel">
          <template v-if="segments.length">
            <div class="panel-toolbar">
              <div>
                <strong>字幕分句</strong>
                <span class="count-text">共 {{ segments.length }} 条</span>
              </div>

              <ElSpace>
                <ElButton @click="showUploadPanel = true">重新上传 SRT</ElButton>
                <ElButton @click="addSegment">新增句子</ElButton>
                <ElButton type="primary" @click="handleSaveSegments">保存修改</ElButton>
              </ElSpace>
            </div>

            <ElTable :data="segments" border height="430">
              <ElTableColumn prop="sortOrder" label="#" width="70" />

              <ElTableColumn label="开始时间" width="130">
                <template #default="{ row }">
                  <ElInputNumber v-model="row.startTime" :precision="3" :step="0.1" />
                </template>
              </ElTableColumn>

              <ElTableColumn label="结束时间" width="130">
                <template #default="{ row }">
                  <ElInputNumber v-model="row.endTime" :precision="3" :step="0.1" />
                </template>
              </ElTableColumn>

              <ElTableColumn label="英文句子" min-width="320">
                <template #default="{ row }">
                  <ElInput v-model="row.sentence" type="textarea" :rows="2" />
                </template>
              </ElTableColumn>

              <ElTableColumn label="中文翻译" min-width="280">
                <template #default="{ row }">
                  <ElInput v-model="row.translation" type="textarea" :rows="2" />
                </template>
              </ElTableColumn>

              <ElTableColumn label="操作" width="90" fixed="right">
                <template #default="{ $index }">
                  <ElButton type="danger" link @click="removeSegment($index)">删除</ElButton>
                </template>
              </ElTableColumn>
            </ElTable>
          </template>

          <template v-else>
            <div class="segment-import">
              <ElAlert
                title="暂无字幕数据，请上传 .srt 字幕文件。系统会解析为课程分句，并自动生成文章内容。"
                type="info"
                show-icon
                :closable="false"
              />

              <ElUpload
                v-model:file-list="fileList"
                class="srt-upload"
                drag
                accept=".srt"
                :limit="1"
                :auto-upload="false"
                :on-change="handleSrtChange"
                :on-remove="handleSrtRemove"
                :on-exceed="handleSrtExceed"
              >
                <ElIcon class="el-icon--upload">
                  <UploadFilled />
                </ElIcon>
                <div class="el-upload__text">将 SRT 文件拖到这里，或 <em>点击上传</em></div>
              </ElUpload>

              <ElButton type="primary" @click="handleParseSrt">解析字幕</ElButton>
            </div>
          </template>

          <ElDialog v-model="showUploadPanel" title="重新上传 SRT" width="40%">
            <ElUpload
              v-model:file-list="fileList"
              drag
              accept=".srt"
              :limit="1"
              :auto-upload="false"
              :on-change="handleSrtChange"
              :on-remove="handleSrtRemove"
              :on-exceed="handleSrtExceed"
            >
              <ElIcon class="el-icon--upload">
                <UploadFilled />
              </ElIcon>
              <div class="el-upload__text">将 SRT 文件拖到这里，或 <em>点击上传</em></div>
            </ElUpload>

            <template #footer>
              <ElButton @click="showUploadPanel = false">取消</ElButton>
              <ElButton type="primary" @click="handleParseSrt">解析并覆盖</ElButton>
            </template>
          </ElDialog>
        </div>
      </ElTabPane>

      <ElTabPane label="重点单词">
        <div class="vocabulary-panel">
          <div class="panel-toolbar">
            <div>
              <strong>课程重点词汇</strong>
              <span class="count-text">共 {{ vocabularies.length }} 个</span>
            </div>

            <ElSpace>
              <ElButton @click="addVocabulary">新增单词</ElButton>
              <ElButton type="primary" @click="handleSaveVocabularies">保存词汇</ElButton>
            </ElSpace>
          </div>

          <ElEmpty v-if="!vocabularies.length" description="暂无重点词汇">
            <ElButton type="primary" @click="addVocabulary">新增单词</ElButton>
          </ElEmpty>

          <ElTable v-else :data="vocabularies" border height="430">
            <ElTableColumn label="#" width="60">
              <template #default="{ $index }">{{ $index + 1 }}</template>
            </ElTableColumn>

            <ElTableColumn label="单词" min-width="140">
              <template #default="{ row }">
                <ElInput v-model="row.word" />
              </template>
            </ElTableColumn>

            <ElTableColumn label="音标" min-width="140">
              <template #default="{ row }">
                <ElInput v-model="row.phonetic" placeholder="/.../" />
              </template>
            </ElTableColumn>

            <ElTableColumn label="词性" width="140">
              <template #default="{ row }">
                <ElSelect v-model="row.partOfSpeech">
                  <ElOption label="noun" value="noun" />
                  <ElOption label="verb" value="verb" />
                  <ElOption label="adjective" value="adjective" />
                  <ElOption label="adverb" value="adverb" />
                  <ElOption label="phrase" value="phrase" />
                </ElSelect>
              </template>
            </ElTableColumn>

            <ElTableColumn label="中文意思" min-width="160">
              <template #default="{ row }">
                <ElInput v-model="row.meaning" />
              </template>
            </ElTableColumn>

            <ElTableColumn label="英文解释" min-width="240">
              <template #default="{ row }">
                <ElInput v-model="row.simpleDefinition" type="textarea" :rows="2" />
              </template>
            </ElTableColumn>

            <ElTableColumn label="例句" min-width="260">
              <template #default="{ row }">
                <ElInput v-model="row.exampleSentence" type="textarea" :rows="2" />
              </template>
            </ElTableColumn>

            <ElTableColumn label="操作" width="90" fixed="right">
              <template #default="{ $index }">
                <ElButton type="danger" link @click="removeVocabulary($index)">删除</ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
        </div>
      </ElTabPane>

      <ElTabPane label="课程预览">
        <div class="preview-panel">
          <audio v-if="form.audioUrl" controls :src="form.audioUrl" />

          <ElEmpty v-else description="暂无音频，请先上传音频" />

          <div v-if="form.transcript" class="preview-transcript">
            {{ form.transcript }}
          </div>
        </div>
      </ElTabPane>
    </ElTabs>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormItem } from '@/components/core/forms/art-form/index.vue'
  import type { FormRules } from 'element-plus'
  import {
    fetchGetCategoryList,
    createLesson,
    updateLesson,
    fetchLessonSegments,
    fetchLessonVocabularies,
    importSrt,
    saveLessonSegments,
    saveLessonVocabularies
  } from '@/api/content-manage'
  import { uploadAudio, uploadImage } from '@/api/content-manage'
  import { UploadFilled } from '@element-plus/icons-vue'
  import type { UploadFile } from 'element-plus'

  const fileList = ref<UploadFile[]>([])

  const showUploadPanel = ref(false)

  const segments = ref<Api.ContentManage.LessonSegmentItem[]>([])

  const handleCoverUpload = async (file: File) => {
    try {
      const res = await uploadImage(file)

      form.coverImage = res.url

      ElMessage.success('封面图上传成功')
    } catch (error) {
      console.error(error)
      ElMessage.error('封面图上传失败')
    }

    return false
  }

  const handleSrtChange = (file: UploadFile) => {
    const fileName = file.name.toLowerCase()

    if (!fileName.endsWith('.srt')) {
      ElMessage.error('只支持上传 .srt 文件')
      fileList.value = []
      return
    }

    fileList.value = [file]
  }

  const handleSrtRemove = () => {
    fileList.value = []
  }

  const handleSrtExceed = () => {
    ElMessage.warning('一次只能上传一个 SRT 文件')
  }

  const removeSegment = (index: number) => {
    segments.value.splice(index, 1)

    segments.value.forEach((item, i) => {
      item.sortOrder = i + 1
    })
  }

  // 解析srt并覆盖srt
  const handleParseSrt = async () => {
    if (!form.id) {
      ElMessage.warning('请先保存课程基础信息')
      return
    }

    if (!fileList.value.length) {
      ElMessage.warning('请先上传 SRT 文件')
      return
    }

    const file = fileList.value[0]?.raw

    if (!file) {
      ElMessage.warning('文件读取失败')
      return
    }

    try {
      const res = await importSrt(form.id, file)

      segments.value = res || []

      form.transcript = buildTranscriptFromSegments(segments.value)

      showUploadPanel.value = false
      fileList.value = []

      ElMessage.success('字幕解析成功，文章内容已自动生成')
    } catch (error: any) {
      console.error(error)
      ElMessage.error(error?.response?.data?.msg || '字幕解析失败')
    }
  }

  //保存字幕
  const handleSaveSegments = async () => {
    if (!form.id) {
      ElMessage.warning('请先保存课程基础信息')
      return
    }

    if (!segments.value.length) {
      ElMessage.warning('暂无字幕数据可保存')
      return
    }

    const invalidSegment = segments.value.find(
      (item) => !item.sentence || item.startTime == null || item.endTime == null
    )

    if (invalidSegment) {
      ElMessage.warning('请检查字幕内容、开始时间和结束时间')
      return
    }

    try {
      const res = await saveLessonSegments(form.id, segments.value)

      segments.value = res || []
      form.transcript = buildTranscriptFromSegments(segments.value)

      ElMessage.success('字幕保存成功，文章内容已同步更新')
    } catch (error: any) {
      console.error(error)
      ElMessage.error(error?.response?.data?.msg || '字幕保存失败')
    }
  }

  type LessonListItem = Api.ContentManage.LessonListItem

  interface Props {
    modelValue: boolean
    dialogType: 'add' | 'edit'
    lessonData?: LessonListItem
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'success'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    dialogType: 'add',
    lessonData: undefined
  })

  const emit = defineEmits<Emits>()

  const { width } = useWindowSize()

  const formRef = ref()

  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const form = reactive<Api.ContentManage.LessonForm>({
    id: undefined,
    categoryId: undefined,
    title: '',
    slug: '',
    summary: '',
    coverImage: '',
    audioUrl: '',
    durationSeconds: undefined,
    level: 'A1',
    transcript: '',
    status: true,
    isFeatured: false,
    isDaily: false,
    dailyDate: null,
    sortOrder: 0,
    publishedAt: null
  })

  const levelOptions = ref([
    { label: 'A1', value: 'A1' },
    { label: 'A2', value: 'A2' }
  ])

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

  const rules = reactive<FormRules>({
    title: [{ required: true, message: '请输入课程标题', trigger: 'blur' }],
    slug: [{ required: true, message: '请输入课程标识', trigger: 'blur' }],
    categoryId: [{ required: true, message: '请选择课程分类', trigger: 'change' }],
    level: [{ required: true, message: '请选择课程等级', trigger: 'change' }],
    summary: [{ required: true, message: '请输入课程简介', trigger: 'blur' }],
    audioUrl: [{ required: true, message: '请上传课程音频', trigger: 'change' }]
  })

  const basicFormItems = computed<FormItem[]>(() => [
    {
      label: '课程标题',
      key: 'title',
      type: 'input',
      props: { placeholder: '请输入课程标题' }
    },
    {
      label: '课程标识',
      key: 'slug',
      type: 'input',
      props: { placeholder: '例如 how-to-introduce-yourself' }
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
        options: levelOptions.value
      }
    },
    {
      label: '课程简介',
      key: 'summary',
      type: 'input',
      props: {
        type: 'textarea',
        rows: 3,
        placeholder: '请输入课程简介'
      },
      span: 24
    },
    {
      label: '排序',
      key: 'sortOrder',
      type: 'number',
      props: {
        min: 0,
        controlsPosition: 'right',
        style: { width: '100%' }
      }
    }
  ])

  const publishFormItems = computed<FormItem[]>(() => {
    const switchSpan = width.value < 640 ? 12 : 6

    return [
      {
        label: '推荐课程',
        key: 'isFeatured',
        type: 'switch',
        span: switchSpan
      },
      {
        label: '每日推荐',
        key: 'isDaily',
        type: 'switch',
        span: switchSpan
      },
      {
        label: '每日日期',
        key: 'dailyDate',
        type: 'date',
        props: {
          placeholder: '请选择每日推荐日期',
          valueFormat: 'YYYY-MM-DD',
          disabled: !form.isDaily
        }
      },
      {
        label: '启用',
        key: 'status',
        type: 'switch',
        span: switchSpan
      }
    ]
  })

  const addSegment = () => {
    segments.value.push({
      lessonId: form.id,
      startTime: 0,
      endTime: 0,
      sentence: '',
      translation: '',
      sortOrder: segments.value.length + 1
    })
  }

  const resetForm = () => {
    Object.assign(form, {
      id: undefined,
      categoryId: undefined,
      title: '',
      slug: '',
      summary: '',
      coverImage: '',
      audioUrl: '',
      durationSeconds: undefined,
      level: 'A1',
      transcript: '',
      status: true,
      isFeatured: false,
      isDaily: false,
      dailyDate: null,
      sortOrder: 0,
      publishedAt: null
    })
  }

  const initForm = () => {
    if (props.dialogType === 'edit' && props.lessonData) {
      Object.assign(form, {
        ...props.lessonData,
        dailyDate: props.lessonData.dailyDate || null
      })
    } else {
      resetForm()
    }

    nextTick(() => {
      formRef.value?.clearValidate?.()
    })
  }

  watch(
    () => props.modelValue,
    async (val) => {
      if (val) {
        await getCategoryOptions()
        initForm()

        if (form.id) {
          await loadSegments(form.id)
          await loadVocabularies(form.id)
        }
      }
    }
  )

  watch(
    () => form.isDaily,
    (val) => {
      if (!val) {
        form.dailyDate = null
      }
    }
  )

  const loadSegments = async (lessonId: number) => {
    try {
      const res = await fetchLessonSegments(lessonId)

      segments.value = res || []
    } catch (error) {
      console.error(error)
      ElMessage.error('加载字幕失败')
    }
  }

  const buildTranscriptFromSegments = (segments: Api.ContentManage.LessonSegmentItem[]) => {
    return segments
      .map((item) => item.sentence)
      .filter(Boolean)
      .join('\n')
  }

  const handleClose = () => {
    visible.value = false

    resetForm()

    segments.value = []
    vocabularies.value = []
    fileList.value = []
    showUploadPanel.value = false

    formRef.value?.clearValidate?.()
  }

  const handleSubmit = async () => {
    if (!formRef.value) return

    try {
      await formRef.value.validate()

      const payload: Api.ContentManage.LessonCreateParams = {
        categoryId: form.categoryId!,
        title: form.title,
        slug: form.slug,
        summary: form.summary,
        coverImage: form.coverImage,
        audioUrl: form.audioUrl,
        durationSeconds: form.durationSeconds || 0,
        level: form.level,
        transcript: form.transcript,
        status: form.status,
        isFeatured: form.isFeatured,
        isDaily: form.isDaily,
        dailyDate: form.dailyDate,
        sortOrder: form.sortOrder,
        publishedAt: form.publishedAt
      }

      if (props.dialogType === 'add') {
        await createLesson(payload)
        ElMessage.success('新增成功')
      } else {
        if (!form.id) {
          ElMessage.error('缺少课程ID')
          return
        }

        await updateLesson(form.id, payload)
        ElMessage.success('修改成功')
      }

      emit('success')
      handleClose()
    } catch (error: any) {
      console.error(error)
      ElMessage.error(error?.response?.data?.msg || '提交失败')
    }
  }

  const loadVocabularies = async (lessonId: number) => {
    const res = await fetchLessonVocabularies(lessonId)

    vocabularies.value = res || []
  }

  interface LessonVocabularyItem {
    id?: number
    lessonId?: number
    word: string
    phonetic: string
    partOfSpeech: string
    meaning: string
    simpleDefinition: string
    exampleSentence: string
    sortOrder: number
  }

  const vocabularies = ref<LessonVocabularyItem[]>([])

  const addVocabulary = () => {
    vocabularies.value.push({
      lessonId: form.id,
      word: '',
      phonetic: '',
      partOfSpeech: '',
      meaning: '',
      simpleDefinition: '',
      exampleSentence: '',
      sortOrder: vocabularies.value.length + 1
    })
  }

  const removeVocabulary = (index: number) => {
    vocabularies.value.splice(index, 1)

    vocabularies.value.forEach((item, i) => {
      item.sortOrder = i + 1
    })
  }

  const handleSaveVocabularies = async () => {
    if (!form.id) {
      ElMessage.warning('请先保存课程基础信息')
      return
    }

    const invalidItem = vocabularies.value.find((item) => !item.word || !item.meaning)

    if (invalidItem) {
      ElMessage.warning('请填写单词和中文意思')
      return
    }

    try {
      const res = await saveLessonVocabularies(form.id, vocabularies.value)
      vocabularies.value = res || []
      ElMessage.success('重点词汇保存成功')
    } catch (error: any) {
      console.error(error)
      ElMessage.error(error?.response?.data?.msg || '重点词汇保存失败')
    }
  }

  const handleAudioUpload = async (file: File) => {
    try {
      const res = await uploadAudio(file)

      form.audioUrl = res.url

      const duration = await getAudioDuration(res.url)
      form.durationSeconds = duration

      ElMessage.success('音频上传成功')
    } catch (error) {
      console.error(error)
      ElMessage.error('音频上传失败')
    }

    return false
  }
  const getAudioDuration = (url: string): Promise<number> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio(url)

      audio.addEventListener('loadedmetadata', () => {
        resolve(Math.round(audio.duration))
      })

      audio.addEventListener('error', () => {
        reject(new Error('音频时长读取失败'))
      })
    })
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-'

    const min = Math.floor(seconds / 60)
    const sec = seconds % 60

    return `${min}:${String(sec).padStart(2, '0')}`
  }
</script>

<style scoped>
  .lesson-tabs {
    min-height: 620px;
  }

  .lesson-basic-panel,
  .segment-panel,
  .vocabulary-panel,
  .preview-panel,
  .readonly-panel {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .form-section {
    padding: 20px;
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    background: var(--el-bg-color);
  }

  .form-section h3 {
    margin: 0 0 18px;
    font-size: 16px;
    font-weight: 600;
  }

  .audio-card {
    margin-top: 16px;
    padding: 16px;
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    background: var(--el-fill-color-lighter);
  }

  .audio-card audio,
  .preview-panel audio {
    width: 420px;
    max-width: 100%;
  }

  .audio-meta {
    margin-top: 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    color: #909399;
    font-size: 13px;
    word-break: break-all;
  }

  .panel-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .count-text {
    margin-left: 12px;
    color: #909399;
    font-size: 13px;
  }

  .segment-import {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .srt-upload {
    width: 100%;
  }

  .preview-transcript {
    padding: 16px;
    white-space: pre-line;
    line-height: 1.8;
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    background: var(--el-fill-color-lighter);
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    margin-top: 8px;
    gap: 12px;
  }

  .media-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }

  .media-block {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .media-title {
    font-weight: 600;
    font-size: 14px;
  }

  .cover-preview {
    padding: 12px;
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    background: var(--el-fill-color-lighter);
  }

  .cover-preview img {
    width: 220px;
    max-width: 100%;
    border-radius: 6px;
    display: block;
  }

  .media-url {
    margin-top: 8px;
    color: #909399;
    font-size: 13px;
    word-break: break-all;
  }

  @media (max-width: 768px) {
    .media-grid {
      grid-template-columns: 1fr;
    }
  }
</style>

<template>
  <ElDialog
    v-model="visible"
    :title="dialogType === 'add' ? '新增草稿' : '编辑草稿'"
    width="78%"
    align-center
  >
    <ElTabs v-model="activeTab" type="border-card" class="lesson-tabs">
      <ElTabPane label="基础信息" name="basic">
        <div class="lesson-basic-panel">
          <section class="form-section">
            <h3>草稿基础信息</h3>

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
            <h3>草稿设置</h3>

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

      <ElTabPane label="内容生成" name="content">
        <div class="readonly-panel">
          <ElAlert
            title="内容生成流程：填写文章来源 → 粘贴或抓取原文 → AI生成课程 → 检查基础信息后保存草稿。"
            type="info"
            :closable="false"
            show-icon
          />

          <section class="form-section">
            <div class="section-header">
              <h3>文章来源</h3>

              <ElSpace>
                <ElButton v-if="form.sourceType === 'URL'" @click="handleFetchArticle">
                  抓取文章
                </ElButton>

                <ElButton type="primary" @click="handleGenerateDraftContent"> AI生成课程 </ElButton>
              </ElSpace>
            </div>

            <ElForm label-width="110px">
              <ElFormItem label="来源类型">
                <ElRadioGroup v-model="form.sourceType">
                  <ElRadioButton label="MANUAL">手动输入</ElRadioButton>
                  <ElRadioButton label="URL">文章链接</ElRadioButton>
                </ElRadioGroup>
              </ElFormItem>

              <ElFormItem v-if="form.sourceType === 'URL'" label="来源URL">
                <ElInput
                  v-model="form.sourceUrl"
                  placeholder="请输入文章来源 URL，例如 https://..."
                />
              </ElFormItem>

              <ElFormItem label="原文标题">
                <ElInput
                  v-model="form.originalTitle"
                  :disabled="form.sourceType === 'URL'"
                  placeholder="请输入或自动获取原文章标题"
                />
              </ElFormItem>

              <ElFormItem label="原文内容">
                <ElInput
                  v-model="form.originalContent"
                  type="textarea"
                  :rows="8"
                  :disabled="form.sourceType === 'URL'"
                  placeholder="可以粘贴原始文章内容。后续 AI 会基于这里进行改写。"
                />
              </ElFormItem>
            </ElForm>
          </section>

          <section class="form-section">
            <div class="section-header">
              <h3>课程正文</h3>

              <ElButton
                type="primary"
                plain
                :disabled="!form.rewrittenContent"
                @click="applyRewrittenContent"
              >
                应用为最终正文
              </ElButton>
            </div>

            <ElInput
              v-model="form.rewrittenContent"
              type="textarea"
              :rows="10"
              placeholder="AI 生成后的课程正文会显示在这里。当前阶段可以手动填写。"
            />
          </section>

          <section class="form-section">
            <h3>最终课程正文</h3>

            <ElInput
              v-model="form.transcript"
              type="textarea"
              :rows="8"
              placeholder="这里是最终用于发布课程的正文内容。"
            />
          </section>
        </div>
      </ElTabPane>

      <ElTabPane label="字幕分句" name="segment">
        <div class="segment-panel">
          <ElAlert
            title="Draft Segment API 尚未接入。当前阶段请先完成草稿基础信息保存。"
            type="warning"
            :closable="false"
            show-icon
          />

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

      <ElTabPane label="重点单词" name="vocabulary">
        <div class="vocabulary-panel">
          <ElAlert
            title="AI 可生成重点词汇，生成后请检查并点击“保存词汇”。"
            type="warning"
            :closable="false"
            show-icon
          />

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

      <ElTabPane label="课程预览" name="preview">
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
  import type { FormRules, UploadFile } from 'element-plus'
  import { ElMessage } from 'element-plus'
  import { UploadFilled } from '@element-plus/icons-vue'
  import { useWindowSize } from '@vueuse/core'
  import { fetchGetCategoryList, uploadAudio, uploadImage } from '@/api/content-manage'
  import {
    createDraft,
    updateDraft,
    fetchDraftDetail,
    fetchDraftSegments,
    saveDraftSegments,
    fetchDraftVocabularies,
    saveDraftVocabularies,
    importDraftSrt,
    generateDraftContent,
    fetchArticleByUrl
  } from '@/api/draft'

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

  interface DraftForm {
    id?: number
    categoryId?: number
    title: string
    slug: string
    summary: string
    coverImage: string
    audioUrl: string
    durationSeconds?: number
    level: string
    transcript: string
    draftStatus: string
    isFeatured: boolean
    isDaily: boolean
    dailyDate: string | null
    sortOrder: number
    sourceType: string
    sourceUrl: string
    originalTitle: string
    originalContent: string
    rewrittenContent: string
  }

  interface DraftDetail extends DraftForm {
    categoryName?: string
    publishedLessonId?: number
    createdAt?: string
    updatedAt?: string
  }

  interface DraftSegmentItem {
    id?: number
    draftId?: number
    startTime: number
    endTime: number
    sentence: string
    translation: string
    sortOrder: number
  }

  interface DraftVocabularyItem {
    id?: number
    draftId?: number
    word: string
    phonetic: string
    partOfSpeech: string
    meaning: string
    simpleDefinition: string
    exampleSentence: string
    sortOrder: number
  }

  interface DraftAiGenerateResult extends Partial<DraftForm> {
    vocabularies?: DraftVocabularyItem[]
  }

  interface Props {
    modelValue: boolean
    dialogType: 'add' | 'edit'
    draftData?: DraftListItem
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'success'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    dialogType: 'add',
    draftData: undefined
  })

  const emit = defineEmits<Emits>()

  const { width } = useWindowSize()

  const formRef = ref()

  const fileList = ref<UploadFile[]>([])
  const showUploadPanel = ref(false)
  const segments = ref<DraftSegmentItem[]>([])
  const vocabularies = ref<DraftVocabularyItem[]>([])

  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const activeTab = ref('basic')

  const form = reactive<DraftForm>({
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
    draftStatus: 'DRAFT',
    isFeatured: false,
    isDaily: false,
    dailyDate: null,
    sortOrder: 0,
    sourceType: 'MANUAL',
    sourceUrl: '',
    originalTitle: '',
    originalContent: '',
    rewrittenContent: ''
  })

  const levelOptions = ref([
    { label: 'A1', value: 'A1' },
    { label: 'A2', value: 'A2' },
    { label: 'B1', value: 'B1' }
  ])

  const draftStatusOptions = ref([
    { label: '草稿', value: 'DRAFT' },
    { label: 'AI已生成', value: 'AI_GENERATED' },
    { label: '正文已审核', value: 'CONTENT_REVIEWED' },
    { label: '音频已完成', value: 'AUDIO_READY' },
    { label: '字幕已完成', value: 'SRT_READY' },
    { label: '待发布', value: 'READY_TO_PUBLISH' },
    { label: '已发布', value: 'PUBLISHED' }
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
    title: [{ required: true, message: '请输入草稿标题', trigger: 'blur' }],
    slug: [{ required: true, message: '请输入草稿标识', trigger: 'blur' }],
    categoryId: [{ required: true, message: '请选择课程分类', trigger: 'change' }],
    level: [{ required: true, message: '请选择课程等级', trigger: 'change' }],
    summary: [{ required: true, message: '请输入草稿简介', trigger: 'blur' }]
  })

  const basicFormItems = computed<FormItem[]>(() => [
    {
      label: '草稿标题',
      key: 'title',
      type: 'input',
      props: { placeholder: '请输入草稿标题' }
    },
    {
      label: '草稿标识',
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
      label: '草稿简介',
      key: 'summary',
      type: 'input',
      props: {
        type: 'textarea',
        rows: 3,
        placeholder: '请输入草稿简介'
      },
      span: 24
    }
  ])

  const publishFormItems = computed<FormItem[]>(() => {
    const switchSpan = width.value < 640 ? 12 : 6

    return [
      {
        label: '草稿状态',
        key: 'draftStatus',
        type: 'select',
        props: {
          placeholder: '请选择草稿状态',
          options: draftStatusOptions.value
        }
      },
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
      }
    ]
  })

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
      draftStatus: 'DRAFT',
      isFeatured: false,
      isDaily: false,
      dailyDate: null,
      sortOrder: 0,
      sourceType: 'MANUAL',
      sourceUrl: '',
      originalTitle: '',
      originalContent: '',
      rewrittenContent: ''
    })
  }

  const initForm = async () => {
    if (props.dialogType === 'edit' && props.draftData?.id) {
      const detail = (await fetchDraftDetail(props.draftData.id)) as DraftDetail

      Object.assign(form, {
        ...detail,
        dailyDate: detail.dailyDate || null,
        draftStatus: detail.draftStatus || 'DRAFT',
        sourceType: detail.sourceType || 'MANUAL',
        sourceUrl: detail.sourceUrl || '',
        originalTitle: detail.originalTitle || '',
        originalContent: detail.originalContent || '',
        rewrittenContent: detail.rewrittenContent || ''
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
        await initForm()

        if (form.id) {
          await loadSegments(form.id)
          await loadVocabularies(form.id)
        }
      }
    }
  )

  const loadSegments = async (draftId: number) => {
    try {
      const res = (await fetchDraftSegments(draftId)) as DraftSegmentItem[]
      segments.value = res || []
    } catch (error) {
      console.error(error)
      ElMessage.error('加载字幕分句失败')
    }
  }

  const loadVocabularies = async (draftId: number) => {
    try {
      const res = (await fetchDraftVocabularies(draftId)) as DraftVocabularyItem[]

      vocabularies.value = res || []
    } catch (error) {
      console.error(error)

      ElMessage.error('加载重点词汇失败')
    }
  }

  watch(
    () => form.isDaily,
    (val) => {
      if (!val) {
        form.dailyDate = null
      }
    }
  )

  const handleSubmit = async () => {
    if (!formRef.value) return

    try {
      await formRef.value.validate()

      const payload = {
        categoryId: form.categoryId!,
        title: form.title,
        slug: form.slug,
        summary: form.summary,
        coverImage: form.coverImage,
        audioUrl: form.audioUrl,
        durationSeconds: form.durationSeconds || 0,
        level: form.level,
        transcript: form.transcript,
        draftStatus: form.draftStatus || 'DRAFT',
        isFeatured: form.isFeatured,
        isDaily: form.isDaily,
        dailyDate: form.dailyDate,
        sortOrder: form.sortOrder,
        sourceType: form.sourceType,
        sourceUrl: form.sourceUrl,
        originalTitle: form.originalTitle,
        originalContent: form.originalContent,
        rewrittenContent: form.rewrittenContent
      }

      if (props.dialogType === 'add') {
        // await createDraft(payload)
        // ElMessage.success('新增草稿成功')
        const res = (await createDraft(payload)) as DraftDetail

        form.id = res.id

        ElMessage.success('草稿基础信息已保存，请继续保存重点词汇')

        activeTab.value = 'vocabulary'

        emit('success')

        return
      } else {
        if (!form.id) {
          ElMessage.error('缺少草稿ID')
          return
        }

        await updateDraft(form.id, payload)
        ElMessage.success('修改草稿成功')
      }

      emit('success')
      handleClose()
    } catch (error: any) {
      console.error(error)
      ElMessage.error(error?.response?.data?.msg || '提交失败')
    }
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

  const addSegment = () => {
    segments.value.push({
      draftId: form.id,
      startTime: 0,
      endTime: 0,
      sentence: '',
      translation: '',
      sortOrder: segments.value.length + 1
    })
  }

  const removeSegment = (index: number) => {
    segments.value.splice(index, 1)

    segments.value.forEach((item, i) => {
      item.sortOrder = i + 1
    })
  }

  const handleParseSrt = async () => {
    if (!form.id) {
      ElMessage.warning('请先保存草稿基础信息')
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
      const res = (await importDraftSrt(form.id, file)) as DraftSegmentItem[]

      segments.value = res || []
      form.transcript = buildTranscriptFromSegments(segments.value)

      showUploadPanel.value = false
      fileList.value = []

      ElMessage.success('字幕解析成功，课程正文已自动生成')
    } catch (error: any) {
      console.error(error)
      ElMessage.error(error?.response?.data?.msg || '字幕解析失败')
    }
  }

  const handleSaveSegments = async () => {
    if (!form.id) {
      ElMessage.warning('请先保存草稿基础信息')
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
      const payload = segments.value.map((item, index) => ({
        id: item.id,
        draftId: form.id,
        startTime: item.startTime,
        endTime: item.endTime,
        sentence: item.sentence,
        translation: item.translation,
        sortOrder: index + 1
      }))

      const res = (await saveDraftSegments(form.id, payload)) as DraftSegmentItem[]

      segments.value = res || []

      form.transcript = buildTranscriptFromSegments(segments.value)

      ElMessage.success('字幕分句保存成功，课程正文已同步更新')
    } catch (error: any) {
      console.error(error)
      ElMessage.error(error?.response?.data?.msg || '字幕分句保存失败')
    }
  }

  const handleFetchArticle = async () => {
    if (form.sourceType !== 'URL') {
      ElMessage.warning('请先选择文章链接模式')
      return
    }

    if (!form.sourceUrl) {
      ElMessage.warning('请输入文章来源 URL')
      return
    }

    try {
      const res = (await fetchArticleByUrl({
        url: form.sourceUrl
      })) as {
        title?: string
        content?: string
      }

      form.originalTitle = res.title || form.originalTitle
      form.originalContent = res.content || form.originalContent

      ElMessage.success('文章抓取成功')
    } catch (error: any) {
      console.error(error)
      ElMessage.error(error?.response?.data?.msg || '文章抓取失败，请手动粘贴内容')
    }
  }

  const handleGenerateDraftContent = async () => {
    try {
      const payload = {
        sourceType: form.sourceType,
        sourceUrl: form.sourceUrl,
        originalTitle: form.originalTitle,
        originalContent: form.originalContent,
        targetLevel: form.level,
        categoryId: form.categoryId
      }

      const res = (await generateDraftContent(payload)) as DraftAiGenerateResult

      form.title = res.title || form.title
      form.slug = res.slug || form.slug
      form.summary = res.summary || form.summary
      form.level = res.level || form.level
      form.categoryId = res.categoryId || form.categoryId
      form.rewrittenContent = res.rewrittenContent || form.rewrittenContent
      form.transcript = res.transcript || form.transcript
      form.draftStatus = 'AI_GENERATED'

      if (res.vocabularies?.length) {
        vocabularies.value = res.vocabularies.map((item, index) => ({
          id: undefined,
          draftId: form.id,
          word: item.word || '',
          phonetic: item.phonetic || '',
          partOfSpeech: item.partOfSpeech || '',
          meaning: item.meaning || '',
          simpleDefinition: item.simpleDefinition || '',
          exampleSentence: item.exampleSentence || '',
          sortOrder: item.sortOrder || index + 1
        }))
      }

      if (!form.id) {
        activeTab.value = 'basic'
        ElMessage.warning('AI内容已生成，请先点击“确定”保存草稿，再保存重点词汇')
        return
      }

      // activeTab.value = 'basic'
      activeTab.value = 'vocabulary'
      ElMessage.success('AI内容和重点词汇已生成，请检查后保存')
    } catch (error: any) {
      console.error(error)
      ElMessage.error(error?.response?.data?.msg || 'AI内容生成失败')
    }
  }

  const buildTranscriptFromSegments = (segments: DraftSegmentItem[]) => {
    return segments
      .map((item) => item.sentence)
      .filter(Boolean)
      .join('\n')
  }

  const addVocabulary = () => {
    vocabularies.value.push({
      draftId: form.id,
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
      ElMessage.warning('请先保存草稿')
      return
    }

    if (!vocabularies.value.length) {
      ElMessage.warning('暂无重点词汇')
      return
    }

    const invalidVocabulary = vocabularies.value.find((item) => !item.word)

    if (invalidVocabulary) {
      ElMessage.warning('单词不能为空')
      return
    }

    try {
      const payload = vocabularies.value.map((item, index) => ({
        id: item.id,
        draftId: form.id,
        word: item.word,
        phonetic: item.phonetic,
        partOfSpeech: item.partOfSpeech,
        meaning: item.meaning,
        simpleDefinition: item.simpleDefinition,
        exampleSentence: item.exampleSentence,
        sortOrder: index + 1
      }))

      const res = (await saveDraftVocabularies(form.id, payload)) as DraftVocabularyItem[]

      vocabularies.value = res || []

      ElMessage.success('重点词汇保存成功')
    } catch (error: any) {
      console.error(error)

      ElMessage.error(error?.response?.data?.msg || '重点词汇保存失败')
    }
  }

  const applyRewrittenContent = () => {
    form.transcript = form.rewrittenContent
    ElMessage.success('已应用为课程正文')
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

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;
  }

  .section-header h3 {
    margin: 0;
  }

  .content-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;
  }

  @media (max-width: 768px) {
    .media-grid {
      grid-template-columns: 1fr;
    }
  }
</style>

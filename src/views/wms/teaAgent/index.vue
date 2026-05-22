<template>
  <div class="app-container tea-agent-page">
    <el-card class="agent-card">
      <template #header>
        <div class="card-header">
          <div>
            <h2 class="title">茶仓智能查询助手</h2>
            <p class="subtitle">仅支持查询：采购入仓、销售出仓、加工调拨（DeepSeek 流式解读）</p>
          </div>
          <el-button link type="primary" @click="clearChat">清空对话</el-button>
        </div>
      </template>

      <div class="chat-body" ref="chatBodyRef">
        <div v-if="messages.length === 0" class="empty-tip">
          <p>示例问题：</p>
          <el-tag class="sample-tag" @click="ask('三个模块各有多少待处理单据？')">三个模块各有多少待处理单据？</el-tag>
          <el-tag class="sample-tag" @click="ask('列出待入仓的采购入仓单')">列出待入仓的采购入仓单</el-tag>
          <el-tag class="sample-tag" @click="ask('单号CR05213751的明细')">单号 CR05213751 的明细</el-tag>
        </div>
        <div v-for="(msg, index) in messages" :key="index" :class="['msg-row', msg.role]">
          <div class="msg-bubble">
            <div class="msg-role">{{ msg.role === 'user' ? '我' : '助手' }}</div>
            <div class="msg-text" v-html="formatText(msg.content)"></div>
            <div v-if="msg.queryMeta" class="query-meta">
              <el-tag size="small" type="info">{{ msg.queryMeta.moduleLabel }}</el-tag>
              <span>{{ msg.queryMeta.briefSummary }}</span>
            </div>
            <div v-if="msg.links?.length" class="msg-links">
              <el-link v-for="(link, i) in msg.links" :key="i" type="primary" @click="goPage(link)">{{ link }}</el-link>
            </div>
          </div>
        </div>
        <div v-if="loading" class="msg-row assistant">
          <div class="msg-bubble typing">正在查询并生成回答…</div>
        </div>
      </div>

      <div class="input-area">
        <el-input
          v-model="inputText"
          type="textarea"
          :rows="3"
          placeholder="请输入查询问题，例如：待出仓的销售出仓单有哪些？"
          @keydown.enter.exact.prevent="send"
        />
        <el-button type="primary" class="send-btn" :loading="loading" @click="send">发送</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup name="TeaAgent">
import { nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import { streamTeaAgentChat } from '@/api/wms/teaAgent'

const router = useRouter()
const inputText = ref('')
const loading = ref(false)
const messages = ref([])
const chatBodyRef = ref(null)

function formatText(text) {
  if (!text) return ''
  return text.replace(/\n/g, '<br/>')
}

function scrollBottom() {
  nextTick(() => {
    if (chatBodyRef.value) {
      chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight
    }
  })
}

function clearChat() {
  messages.value = []
}

function ask(text) {
  inputText.value = text
  send()
}

function goPage(hint) {
  const path = hint.split('→').pop().trim()
  if (path.startsWith('/')) {
    router.push(path)
  }
}

function buildHistory() {
  return messages.value
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({
      role: m.role,
      content: (m.content || m.queryMeta?.briefSummary || '').replace(/<br\s*\/?>/gi, '\n'),
      lastOrderNo: m.lastOrderNo,
      moduleLabel: m.queryMeta?.moduleLabel
    }))
}

async function send() {
  const text = inputText.value?.trim()
  if (!text || loading.value) return
  messages.value.push({ role: 'user', content: text })
  inputText.value = ''
  loading.value = true
  scrollBottom()

  const history = buildHistory().slice(0, -1)

  const assistantMsg = { role: 'assistant', content: '', queryMeta: null, links: [], lastOrderNo: null }
  messages.value.push(assistantMsg)

  try {
    await streamTeaAgentChat(text, history, ({ event, data }) => {
      if (event === 'data') {
        try {
          const parsed = JSON.parse(data)
          assistantMsg.queryMeta = {
            moduleLabel: parsed.moduleLabel,
            briefSummary: parsed.briefSummary
          }
          assistantMsg.lastOrderNo = parsed.lastOrderNo || null
          assistantMsg.links = parsed.navigateHints || []
          if (!assistantMsg.content && parsed.prefillBriefSummary !== false) {
            assistantMsg.content = parsed.briefSummary || ''
          }
        } catch (e) {
          /* ignore */
        }
      } else if (event === 'token') {
        if (data === '[DONE]') return
        assistantMsg.content += data
        scrollBottom()
      } else if (event === 'error') {
        assistantMsg.content = data
      }
    })
  } catch (e) {
    assistantMsg.content = e.message || '查询失败'
  } finally {
    loading.value = false
    scrollBottom()
  }
}
</script>

<style scoped lang="scss">
.tea-agent-page {
  height: calc(100vh - 84px);
}

.agent-card {
  height: 100%;
  display: flex;
  flex-direction: column;

  :deep(.el-card__body) {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.title {
  margin: 0;
  font-size: 18px;
  color: #1a4d2e;
}

.subtitle {
  margin: 4px 0 0;
  font-size: 12px;
  color: #909399;
}

.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  background: #f8faf8;
  border-radius: 8px;
  margin-bottom: 12px;
}

.empty-tip {
  color: #606266;
  font-size: 13px;
}

.sample-tag {
  margin: 6px 8px 0 0;
  cursor: pointer;
}

.msg-row {
  display: flex;
  margin-bottom: 12px;

  &.user {
    justify-content: flex-end;
  }

  &.assistant {
    justify-content: flex-start;
  }
}

.msg-bubble {
  max-width: 85%;
  padding: 10px 14px;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);

  .user & {
    background: #e8f5e9;
  }
}

.msg-role {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.msg-text {
  font-size: 14px;
  line-height: 1.6;
  color: #303133;
  word-break: break-word;
}

.query-meta {
  margin-top: 8px;
  font-size: 12px;
  color: #606266;
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.msg-links {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.input-area {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.send-btn {
  flex-shrink: 0;
}
</style>

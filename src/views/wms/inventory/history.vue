<template>
  <div class="app-container inventory-history-page">
    <el-card class="search-card">
      <el-form :model="queryParams" ref="queryRef" label-width="72px" @submit.prevent>
        <el-row :gutter="16" class="search-row">
          <el-col :span="24">
            <el-form-item label="操作类型" prop="orderType" class="type-filter-item">
              <el-radio-group v-model="queryParams.orderType" @change="handleQuery" size="small">
                <el-radio-button :label="-1">全部</el-radio-button>
                <el-radio-button
                  v-for="item in inventoryHistoryTypeOptions"
                  :key="item.value"
                  :label="item.value"
                >{{ item.label }}</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16" class="search-row">
          <el-col :xs="24" :sm="12" :md="6" :lg="5">
            <el-form-item label="茶仓" prop="warehouseId">
              <el-select v-model="queryParams.warehouseId" placeholder="全部茶仓" filterable clearable style="width: 100%">
                <el-option v-for="item in useWmsStore().warehouseList" :key="item.id" :label="item.warehouseName" :value="item.id"/>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6" :lg="5">
            <el-form-item label="操作单号" prop="orderNo">
              <el-input v-model="queryParams.orderNo" clearable placeholder="操作单号" @keyup.enter="handleQuery"/>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6" :lg="4">
            <el-form-item label="茶品名称" prop="itemName">
              <el-input v-model="queryParams.itemName" clearable placeholder="茶品名称" @keyup.enter="handleQuery"/>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6" :lg="4">
            <el-form-item label="茶品编号" prop="itemCode">
              <el-input v-model="queryParams.itemCode" clearable placeholder="茶品编号" @keyup.enter="handleQuery"/>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6" :lg="6">
            <el-form-item label="操作时间" prop="createTimeRange">
              <el-date-picker
                v-model="queryParams.createTimeRange"
                type="datetimerange"
                range-separator="至"
                value-format="YYYY-MM-DD HH:mm:ss"
                format="YYYY-MM-DD HH:mm:ss"
                :default-time="defaultTime"
                start-placeholder="开始"
                end-placeholder="结束"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16" class="search-row">
          <el-col :xs="24" :sm="12" :md="6" :lg="5">
            <el-form-item label="规格名称" prop="skuName">
              <el-input v-model="queryParams.skuName" clearable placeholder="规格名称" @keyup.enter="handleQuery"/>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6" :lg="5">
            <el-form-item label="规格编号" prop="skuCode">
              <el-input v-model="queryParams.skuCode" clearable placeholder="规格编号" @keyup.enter="handleQuery"/>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6" :lg="4" class="search-actions">
            <el-form-item label-width="0">
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <el-card class="mt20">
      <div class="list-title">茶仓流水记录</div>
      <el-table
        v-loading="loading"
        :data="inventoryHistoryList"
        border
        size="small"
        class="mt12"
        empty-text="暂无流水记录"
      >
        <el-table-column label="操作单号" prop="orderNo" min-width="120" show-overflow-tooltip/>
        <el-table-column label="茶品" min-width="130" show-overflow-tooltip>
          <template #default="{ row }">
            <div>{{ row.item.itemName }}</div>
            <div class="cell-sub" v-if="row.item.itemCode">{{ row.item.itemCode }}</div>
          </template>
        </el-table-column>
        <el-table-column label="规格" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">
            <div>{{ row.itemSku.skuName }}</div>
            <div class="cell-sub" v-if="row.itemSku.skuCode">{{ row.itemSku.skuCode }}</div>
          </template>
        </el-table-column>
        <el-table-column label="操作类型" align="center" width="88">
          <template #default="{ row }">
            <dict-tag :options="inventoryHistoryTypeOptions" :value="row.orderType"/>
          </template>
        </el-table-column>
        <el-table-column label="茶仓" min-width="110" show-overflow-tooltip>
          <template #default="{ row }">
            {{ useWmsStore().warehouseMap.get(row.warehouseId)?.warehouseName || '—' }}
          </template>
        </el-table-column>
        <el-table-column label="操作前" align="right" width="80">
          <template #default="{ row }">
            <span v-if="row.beforeQuantity !== null && row.beforeQuantity !== undefined">{{ row.beforeQuantity }}</span>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column label="操作后" align="right" width="80">
          <template #default="{ row }">
            <span v-if="row.afterQuantity !== null && row.afterQuantity !== undefined">{{ row.afterQuantity }}</span>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column label="变动数量" align="right" width="88">
          <template #default="{ row }">
            <span :class="quantityClass(row)">{{ formatQuantity(row.quantity) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="金额(元)" align="right" width="96">
          <template #default="{ row }">
            {{ (row.amount || row.amount === 0) ? Number(row.amount).toFixed(2) : '—' }}
          </template>
        </el-table-column>
        <el-table-column label="操作时间" prop="createTime" width="168" show-overflow-tooltip/>
      </el-table>

      <pagination
        v-show="total > 0"
        :total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />
    </el-card>
  </div>
</template>

<script setup name="InventoryHistory">
import { listInventoryHistory } from "@/api/wms/inventoryHistory";
import { computed, getCurrentInstance, reactive, ref } from "vue";
import { useWmsStore } from '@/store/modules/wms'

const CHECK_ORDER_TYPE = '4'
const defaultTime = reactive([new Date(0, 0, 0, 0, 0, 0), new Date(0, 0, 0, 23, 59, 59)])
const { proxy } = getCurrentInstance();
const { wms_inventory_history_type } = proxy.useDict('wms_inventory_history_type');

/** 盘点模块已下线，筛选项与标签均不展示「盘点」 */
const inventoryHistoryTypeOptions = computed(() =>
  (wms_inventory_history_type.value || []).filter(item => String(item.value) !== CHECK_ORDER_TYPE)
)

const inventoryHistoryList = ref([]);
const loading = ref(true);
const total = ref(0);
const queryRef = ref(null)
const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  orderType: -1,
  orderNo: undefined,
  itemName: undefined,
  itemCode: undefined,
  skuName: undefined,
  skuCode: undefined,
  warehouseId: undefined,
  createTimeRange: undefined,
})

const formatQuantity = (qty) => {
  if (qty === null || qty === undefined) return '—'
  const n = Number(qty)
  return n > 0 ? `+${n}` : String(n)
}

const quantityClass = (row) => {
  const n = Number(row.quantity)
  if (n > 0) return 'qty-in'
  if (n < 0) return 'qty-out'
  return ''
}

function getList() {
  const query = { ...queryParams.value }
  if (query.orderType === -1) {
    query.orderType = null
  }
  if (query.createTimeRange) {
    query.startTime = query.createTimeRange[0]
    query.endTime = query.createTimeRange[1]
  }
  loading.value = true;
  listInventoryHistory(query).then(response => {
    inventoryHistoryList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

function resetQuery() {
  proxy.resetForm("queryRef");
  queryParams.value.orderType = -1
  handleQuery();
}

getList();
</script>

<style scoped lang="scss">
.search-card {
  :deep(.el-card__body) {
    padding-bottom: 4px;
  }
}

.search-row {
  margin-bottom: 0;
}

.type-filter-item {
  margin-bottom: 12px;

  :deep(.el-form-item__content) {
    line-height: 32px;
  }
}

.search-actions {
  display: flex;
  align-items: flex-end;
}

.list-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a4d2e;
}

.cell-sub {
  font-size: 12px;
  color: #909399;
}

.qty-in {
  color: #1a4d2e;
  font-weight: 500;
}

.qty-out {
  color: #c45656;
  font-weight: 500;
}

:deep(.el-statistic__content) {
  font-size: 14px;
}
</style>

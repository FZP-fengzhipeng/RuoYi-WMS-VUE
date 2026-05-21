<template>
  <div>
    <div class="receipt-order-edit-wrapper app-container" style="margin-bottom: 60px" v-loading="loading">
      <el-card class="order-edit-card">
        <el-row :gutter="16" class="order-edit-layout">
          <!-- 左侧：入仓单信息 -->
          <el-col :xs="24" :sm="24" :md="8" :lg="7" class="order-edit-left">
            <div class="panel-title">采购入仓信息</div>
            <el-form label-width="96px" :model="form" ref="receiptForm" :rules="rules" class="order-form">
              <el-form-item label="入仓单号" prop="orderNo">
                <el-input v-model="form.orderNo" placeholder="入仓单号" :disabled="!!form.id" />
              </el-form-item>
              <el-form-item label="入仓类型" prop="optType">
                <el-radio-group v-model="form.optType" class="opt-type-group">
                  <el-radio-button
                    v-for="item in wms_receipt_type"
                    :key="item.value"
                    :label="item.value"
                  >{{ item.label }}</el-radio-button>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="茶仓" prop="warehouseId">
                <el-select v-model="form.warehouseId" placeholder="请选择茶仓" filterable style="width: 100%">
                  <el-option v-for="item in useWmsStore().warehouseList" :key="item.id" :label="item.warehouseName" :value="item.id"/>
                </el-select>
              </el-form-item>
              <el-form-item label="供应商" prop="merchantId">
                <el-select v-model="form.merchantId" placeholder="请选择供应商" clearable filterable style="width: 100%">
                  <el-option v-for="item in useWmsStore().merchantList" :key="item.id" :label="item.merchantName" :value="item.id"/>
                </el-select>
              </el-form-item>
              <el-form-item label="业务单号" prop="bizOrderNo">
                <el-input v-model="form.bizOrderNo" placeholder="请输入业务单号" />
              </el-form-item>
              <el-form-item label="总数量" prop="totalQuantity">
                <el-input-number v-model="form.totalQuantity" :controls="false" :precision="0" :disabled="true" style="width: 100%" />
              </el-form-item>
              <el-form-item label="总金额" prop="totalAmount">
                <div class="amount-row">
                  <el-input-number v-model="form.totalAmount" :precision="2" :min="0" :disabled="true" style="flex: 1" />
                  <el-tooltip content="按明细重新汇总" placement="top">
                    <el-button circle icon="Refresh" @click="calcTotals" />
                  </el-tooltip>
                </div>
              </el-form-item>
              <el-form-item label="备注" prop="remark">
                <el-input
                  v-model="form.remark"
                  placeholder="备注，100字以内"
                  :rows="3"
                  maxlength="100"
                  type="textarea"
                  show-word-limit
                />
              </el-form-item>
            </el-form>
          </el-col>

          <!-- 右侧：茶品明细 -->
          <el-col :xs="24" :sm="24" :md="16" :lg="17" class="order-edit-right">
            <div class="detail-toolbar">
              <div class="detail-toolbar-left">
                <span class="panel-title">茶品明细</span>
                <span class="detail-summary" v-if="form.details?.length">
                  合计 <b>{{ form.totalQuantity || 0 }}</b> 件 · <b>¥{{ formatAmount(form.totalAmount) }}</b>
                </span>
              </div>
              <el-popover
                placement="left"
                title="提示"
                :width="200"
                trigger="hover"
                :disabled="!!form.warehouseId"
                content="请先选择茶仓！"
              >
                <template #reference>
                  <el-button type="primary" plain icon="Plus" @click="showAddItem" :disabled="!form.warehouseId">添加茶品</el-button>
                </template>
              </el-popover>
            </div>
            <el-table :data="form.details" border empty-text="暂无茶品明细" size="small" class="detail-table">
              <el-table-column label="茶品" min-width="140" show-overflow-tooltip>
                <template #default="{ row }">
                  <div class="cell-main">{{ row.item.itemName }}</div>
                  <div class="cell-sub" v-if="row.item.itemCode">{{ row.item.itemCode }}</div>
                  <div class="cell-sub" v-if="row.item.itemBrand">品牌：{{ useWmsStore().itemBrandMap.get(row.item.itemBrand)?.brandName }}</div>
                </template>
              </el-table-column>
              <el-table-column label="规格" min-width="120" show-overflow-tooltip>
                <template #default="{ row }">
                  <div class="cell-main">{{ row.itemSku.skuName }}</div>
                  <div class="cell-sub" v-if="row.itemSku.barcode">条码：{{ row.itemSku.barcode }}</div>
                </template>
              </el-table-column>
              <el-table-column label="数量" prop="quantity" width="130" align="center">
                <template #default="scope">
                  <el-input-number
                    v-model="scope.row.quantity"
                    :min="1"
                    :precision="0"
                    controls-position="right"
                    style="width: 110px"
                    @change="calcTotals"
                  />
                </template>
              </el-table-column>
              <el-table-column label="金额(元)" prop="amount" width="130" align="center">
                <template #default="scope">
                  <el-input-number
                    v-model="scope.row.amount"
                    :precision="2"
                    :min="0"
                    :max="2147483647"
                    controls-position="right"
                    style="width: 110px"
                    @change="calcTotals"
                  />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="72" align="center" fixed="right">
                <template #default="scope">
                  <el-button icon="Delete" type="danger" link @click="handleDeleteDetail(scope.row, scope.$index)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-col>
        </el-row>
      </el-card>
      <SkuSelect
        ref="skuSelectRef"
        :model-value="skuSelectShow"
        :selected-sku="selectedSku"
        @handleOkClick="handleOkClick"
        @handleCancelClick="skuSelectShow = false"
        :size="'80%'"
      />
    </div>
    <div class="footer-global">
      <div class="btn-box">
        <div>
          <el-button @click="doWarehousing" type="primary" class="ml10">确认入仓</el-button>
          <el-button @click="updateToInvalid" type="danger" v-if="form.id">作废</el-button>
        </div>
        <div>
          <el-button @click="save" type="primary">暂存</el-button>
          <el-button @click="cancel" class="mr10">取消</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup name="ReceiptOrderEdit">
import {getCurrentInstance, onMounted, reactive, ref, toRefs} from "vue";
import {addReceiptOrder, getReceiptOrder, updateReceiptOrder, warehousing} from "@/api/wms/receiptOrder";
import {ElMessage} from "element-plus";
import SkuSelect from "../../../components/SkuSelect.vue";
import {useRoute} from "vue-router";
import {useWmsStore} from '@/store/modules/wms'
import { numSub, generateNo } from '@/utils/ruoyi'
import { delReceiptOrderDetail } from '@/api/wms/receiptOrderDetail'

const {proxy} = getCurrentInstance();
const { wms_receipt_type } = proxy.useDict("wms_receipt_type");
const selectedSku = ref([])
const loading = ref(false)
const skuSelectRef = ref(null)
const initFormData = {
  id: undefined,
  orderNo: undefined,
  optType: "2",
  merchantId: undefined,
  bizOrderNo: undefined,
  totalAmount: undefined,
  orderStatus: 0,
  remark: undefined,
  warehouseId: undefined,
  totalQuantity: 0,
  details: [],
}
const data = reactive({
  form: {...initFormData},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    orderNo: undefined,
    optType: undefined,
    bizOrderNo: undefined,
    totalAmount: undefined,
    orderStatus: undefined,
  },
  rules: {
    orderNo: [
      {required: true, message: "入仓单号不能为空", trigger: "blur"}
    ],
    warehouseId: [
      {required: true, message: "请选择茶仓", trigger: ['blur', 'change']}
    ]
  }
});
const { form, rules} = toRefs(data);

const formatAmount = (val) => {
  if (val === 0 || val) return Number(val).toFixed(2)
  return '0.00'
}

/** 汇总总数量、总金额（明细变化时自动触发，刷新按钮也可手动触发） */
const calcTotals = () => {
  let qtySum = 0
  let amountSum = 0
  let hasAmount = false
  form.value.details?.forEach(it => {
    if (it.quantity) {
      qtySum += Number(it.quantity)
    }
    if (it.amount !== undefined && it.amount !== null && it.amount >= 0) {
      hasAmount = true
      amountSum = numSub(amountSum, -Number(it.amount))
    }
  })
  form.value.totalQuantity = qtySum
  form.value.totalAmount = hasAmount ? amountSum : undefined
}

const cancel = async () => {
  await proxy?.$modal.confirm('确认取消编辑入仓单吗？');
  close()
}
const close = () => {
  const obj = {path: "/teaReceipt/receiptOrder"};
  proxy?.$tab.closeOpenPage(obj);
}
const skuSelectShow = ref(false)

const showAddItem = () => {
  skuSelectRef.value.getList()
  skuSelectShow.value = true
}

const handleOkClick = (item) => {
  skuSelectShow.value = false
  selectedSku.value = [...item]
  item.forEach((it) => {
    if (!form.value.details.find(detail => detail.itemSku.id === it.id)) {
      form.value.details.push({
        itemSku: it.itemSku,
        item: it.item,
        amount: undefined,
        quantity: it.quantity,
        warehouseId: form.value.warehouseId
      })
    }
  })
  calcTotals()
}

const receiptForm = ref()

const save = async () => {
  await proxy?.$modal.confirm('确认暂存入仓单吗？');
  doSave()
}

const getParamsBeforeSave = (orderStatus) => {
  let details = []
  if (form.value.details?.length) {
    details = form.value.details.map(it => {
      return {
        id: it.id,
        skuId: it.itemSku.id,
        amount: it.amount,
        quantity: it.quantity,
        warehouseId: form.value.warehouseId,
      }
    })
  }

  return {
    id: form.value.id,
    orderNo: form.value.orderNo,
    orderStatus,
    optType: form.value.optType,
    merchantId: form.value.merchantId,
    bizOrderNo: form.value.bizOrderNo,
    remark: form.value.remark,
    totalAmount: form.value.totalAmount,
    totalQuantity: form.value.totalQuantity,
    warehouseId: form.value.warehouseId,
    details: details
  }
}

const doSave = async (orderStatus = 0) => {
  receiptForm.value?.validate((valid) => {
    if (!valid) {
      return ElMessage.error('请填写必填项')
    }
    calcTotals()
    const params = getParamsBeforeSave(orderStatus)
    loading.value = true
    if (params.id) {
      updateReceiptOrder(params).then((res) => {
        if (res.code === 200) {
          ElMessage.success(res.msg)
          close()
        } else {
          ElMessage.error(res.msg)
        }
      }).finally(() => {
        loading.value = false
      })
    } else {
      addReceiptOrder(params).then((res) => {
        if (res.code === 200) {
          ElMessage.success(res.msg)
          close()
        } else {
          ElMessage.error(res.msg)
        }
      }).finally(() => {
        loading.value = false
      })
    }
  })
}

const doWarehousing = async () => {
  await proxy?.$modal.confirm('确认入仓吗？');
  receiptForm.value?.validate((valid) => {
    if (!valid) {
      return ElMessage.error('请填写必填项')
    }

    if (!form.value.details?.length) {
      return ElMessage.error('请添加茶品明细')
    }
    if (form.value.details?.length) {
      const invalidQuantityList = form.value.details.filter(it => !it.quantity)
      if (invalidQuantityList?.length) {
        return ElMessage.error('请填写数量')
      }
    }
    calcTotals()
    const params = getParamsBeforeSave(1);
    loading.value = true
    warehousing(params).then((res) => {
      if (res.code === 200) {
        ElMessage.success('入仓成功')
        close()
      } else {
        ElMessage.error(res.msg)
      }
    }).finally(() => {
      loading.value = false
    })
  })
}

const updateToInvalid = async () => {
  await proxy?.$modal.confirm('确认作废入仓单吗？');
  doSave(-1)
}

const route = useRoute();
onMounted(() => {
  const id = route.query && route.query.id;
  if (id) {
    loadDetail(id)
  } else {
    form.value.orderNo = 'CR' + generateNo()
  }
})

const loadDetail = (id) => {
  loading.value = true
  getReceiptOrder(id).then((response) => {
    form.value = {...response.data}
    if (response.data.details?.length) {
      selectedSku.value = response.data.details.map(it => ({
        id: it.skuId
      }))
    }
    calcTotals()
  }).finally(() => {
    loading.value = false
  })
}

const handleDeleteDetail = (row, index) => {
  const afterDelete = () => {
    form.value.details.splice(index, 1)
    const indexOfSelected = selectedSku.value.findIndex(it => row.itemSku.id === it.id)
    if (indexOfSelected >= 0) {
      selectedSku.value.splice(indexOfSelected, 1)
    }
    calcTotals()
  }
  if (row.id) {
    proxy.$modal.confirm('确认删除本条茶品明细吗？').then(function () {
      loading.value = true
      return delReceiptOrderDetail(row.id);
    }).then(() => {
      afterDelete()
      proxy.$modal.msgSuccess("删除成功");
    }).finally(() => {
      loading.value = false
    });
  } else {
    afterDelete()
  }
}
</script>

<style lang="scss" scoped>
@import "../../../../assets/styles/variables.module.scss";

.order-edit-card {
  :deep(.el-card__body) {
    padding: 16px;
  }
}

.order-edit-layout {
  align-items: stretch;
}

.order-edit-left {
  border-right: 1px solid #ebeef5;
  padding-right: 8px;

  @media (max-width: 992px) {
    border-right: none;
    border-bottom: 1px solid #ebeef5;
    padding-right: 0;
    padding-bottom: 16px;
    margin-bottom: 8px;
  }
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a4d2e;
  margin-bottom: 12px;
}

.order-form {
  .opt-type-group {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
}

.amount-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.order-edit-right {
  display: flex;
  flex-direction: column;
  min-height: 360px;
}

.detail-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-toolbar-left {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
}

.detail-summary {
  font-size: 13px;
  color: #606266;

  b {
    color: #1a4d2e;
  }
}

.detail-table {
  flex: 1;
}

.cell-main {
  line-height: 1.4;
}

.cell-sub {
  font-size: 12px;
  color: #909399;
  line-height: 1.3;
}

.btn-box {
  width: calc(100% - #{$base-sidebar-width});
  display: flex;
  align-items: center;
  justify-content: space-between;
  float: right;
}
</style>

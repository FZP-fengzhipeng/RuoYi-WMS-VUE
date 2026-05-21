<template>
  <div class="app-container item-page">
    <el-card>
      <el-form :model="queryParams" ref="queryFormRef" :inline="true" label-width="72px">
        <el-form-item label="茶品编码" prop="itemCode">
          <el-input v-model="queryParams.itemCode" placeholder="请输入茶品编码" clearable @keyup.enter="handleQuery"/>
        </el-form-item>
        <el-form-item label="茶品名称" prop="itemName">
          <el-input v-model="queryParams.itemName" placeholder="请输入茶品名称" clearable @keyup.enter="handleQuery"/>
        </el-form-item>
        <el-form-item label="茶类" prop="itemCategory">
          <el-tree-select
            v-model="queryParams.itemCategory"
            :data="itemCategoryTreeSelectList"
            :props="{ value: 'id', label: 'label', children: 'children' }"
            value-key="id"
            placeholder="全部茶类"
            check-strictly
            clearable
            filterable
            style="width: 200px"
            @change="handleQuery"
          />
        </el-form-item>
        <el-form-item label="品牌产地" prop="itemBrand">
          <el-select v-model="queryParams.itemBrand" clearable filterable placeholder="全部品牌" style="width: 160px">
            <el-option
              v-for="item in useWmsStore().itemBrandList"
              :key="item.id"
              :label="item.brandName"
              :value="item.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card class="mt20">
      <div class="list-toolbar">
        <span class="list-title">茶品列表</span>
        <div class="list-actions">
          <el-button icon="Menu" @click="categoryDrawerVisible = true">分类管理</el-button>
          <el-button type="primary" plain icon="Plus" @click="handleAdd">新增茶品</el-button>
        </div>
      </div>
      <el-table
        :data="itemList"
        @selection-change="handleSelectionChange"
        border
        empty-text="暂无茶品"
        v-loading="loading"
        size="small"
        class="item-flat-table"
      >
        <el-table-column label="茶品名称" prop="itemName" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">{{ row.item.itemName }}</template>
        </el-table-column>
        <el-table-column label="编码" prop="itemCode" width="110" show-overflow-tooltip>
          <template #default="{ row }">{{ row.item.itemCode || '—' }}</template>
        </el-table-column>
        <el-table-column label="茶类" width="100" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.item.itemCategory ? useWmsStore().itemCategoryMap.get(row.item.itemCategory)?.categoryName : '—' }}
          </template>
        </el-table-column>
        <el-table-column label="品牌产地" width="110" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.item.itemBrand ? useWmsStore().itemBrandMap.get(row.item.itemBrand)?.brandName : '—' }}
          </template>
        </el-table-column>
        <el-table-column label="产区" prop="teaOrigin" width="100" show-overflow-tooltip>
          <template #default="{ row }">{{ row.item.teaOrigin || '—' }}</template>
        </el-table-column>
        <el-table-column label="等级" prop="teaLevel" width="72" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.item.teaLevel" size="small" type="success">{{ row.item.teaLevel }}</el-tag>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column label="规格" prop="skuName" min-width="100" show-overflow-tooltip>
          <template #default="{ row }">{{ row.itemSku.skuName }}</template>
        </el-table-column>
        <el-table-column label="规格编号" width="110" show-overflow-tooltip>
          <template #default="{ row }">{{ row.itemSku.skuCode || '—' }}</template>
        </el-table-column>
        <el-table-column label="条码" width="120" show-overflow-tooltip>
          <template #default="{ row }">{{ row.itemSku.barcode || '—' }}</template>
        </el-table-column>
        <el-table-column label="成本价" width="88" align="right">
          <template #default="{ row }">
            {{ formatPrice(row.itemSku.costPrice) }}
          </template>
        </el-table-column>
        <el-table-column label="销售价" width="88" align="right">
          <template #default="{ row }">
            {{ formatPrice(row.itemSku.sellingPrice) }}
          </template>
        </el-table-column>
        <el-table-column label="净重(kg)" width="88" align="right">
          <template #default="{ row }">
            {{ formatWeight(row.itemSku.netWeight) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="140" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="handleUpdate(scope.row)" icon="Edit">修改</el-button>
            <el-button link type="danger" @click="handleDelete(scope.row)" icon="Delete">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total>0" :total="total" v-model:page="queryParams.pageNum"
                  v-model:limit="queryParams.pageSize" @pagination="getList"/>
    </el-card>

    <!-- 茶类分类管理抽屉 -->
    <el-drawer v-model="categoryDrawerVisible" title="茶类分类管理" size="400px" append-to-body>
      <div class="category-drawer-toolbar">
        <el-button type="primary" plain icon="Plus" @click="handleAddType(false)">新增分类</el-button>
        <span class="category-drawer-tip">点击分类名称可筛选茶品；拖拽可排序</span>
      </div>
      <el-tree
        :data="itemCategoryTreeOptionsList"
        :props="{ value: 'id', label: 'label', children: 'children' }"
        value-key="id"
        class="category-drawer-tree"
        @node-click="handleCategoryNodeClick"
        :default-expand-all="true"
        :highlight-current="true"
        node-key="label"
        draggable
        :allow-drop="collapse"
        @node-drop="handleNodeDrop"
        :expand-on-click-node="false"
      >
        <template #default="{ node, data }">
          <span class="category-tree-node">
            <span class="category-tree-label">{{ node.label }}</span>
            <el-dropdown
              v-if="data.label !== '全部'"
              trigger="click"
              @command="(cmd) => handleCategoryCommand(cmd, node, data)"
            >
              <el-button link type="primary" icon="MoreFilled" class="category-tree-more" @click.stop />
              <template #dropdown>
                <el-dropdown-item v-if="node.level < 2" command="append">新增子分类</el-dropdown-item>
                <el-dropdown-item command="edit">修改</el-dropdown-item>
                <el-dropdown-item command="remove" divided>删除</el-dropdown-item>
              </template>
            </el-dropdown>
          </span>
        </template>
      </el-tree>
    </el-drawer>
    <!-- 添加或修改茶品对话框 -->
    <el-drawer :title="dialog.title" v-model="dialog.visible" size="80%" append-to-body :close-on-click-modal="false">
      <div v-loading="skuLoading">
        <el-card>
          <el-form ref="itemFormRef" :model="form" :rules="rules" label-width="108px">
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="茶品名称" prop="itemName">
                  <el-input v-model="form.itemName" placeholder="请输入名称"/>
                </el-form-item>
              </el-col>
              <el-col :span="10">
                <el-form-item label="茶类分类" prop="itemCategory">
                  <el-tree-select
                    ref="treeRef"
                    v-model="form.itemCategory"
                    :data="itemCategoryTreeSelectList"
                    :props="{ value: 'id', label: 'label', children: 'children' }"
                    value-key="id"
                    placeholder="请选择分类"
                    check-strictly
                    style="width: 100%!important;"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="1">
                <el-button link icon="Plus" type="primary" style="height: 32px!important;line-height: 32px!important;"
                           @click="handleAddType(true)">新增茶类
                </el-button>
              </el-col>
            </el-row>
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="茶品编码" prop="itemCode">
                  <el-input v-model="form.itemCode" placeholder="请输入编号"/>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="计量单位" prop="unit">
                  <el-input v-model="form.unit" placeholder="请输入计量单位"/>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="品牌产地" prop="itemBrand">
                  <el-select v-model="form.itemBrand" clearable filterable style="width: 100%!important;">
                    <el-option
                      v-for="item in useWmsStore().itemBrandList"
                      :key="item.id"
                      :label="item.brandName"
                      :value="item.id"
                    ></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="茶类代码" prop="teaType">
                  <el-input v-model="form.teaType" placeholder="例如 green / black / oolong"/>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="茶叶产区" prop="teaOrigin">
                  <el-input v-model="form.teaOrigin" placeholder="请输入中国茶产区"/>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="茶叶等级" prop="teaLevel">
                  <el-input v-model="form.teaLevel" placeholder="例如 S/A/B"/>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="采摘季" prop="harvestSeason">
                  <el-input v-model="form.harvestSeason" placeholder="例如 mingqian"/>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-card>
        <el-card class="mt20">
          <template #header>
            <div class="card-header">
              <span>规格</span>
            </div>
          </template>
          <el-form :model="skuForm" :rules="skuRules" ref="skuFormRef" :show-message="false">
            <el-table :data="skuForm.itemSkuList" border cell-class-name="my-cell">
              <el-table-column label="规格名称" prop="skuName">
                <template #default="scope">
                  <el-form-item :prop="'itemSkuList.' + scope.$index + '.skuName'" :rules="skuRules.skuName"
                                style="margin-bottom: 0!important;">
                    <el-input v-model="scope.row.skuName" placeholder="请输入规格名称"/>
                  </el-form-item>
                </template>
              </el-table-column>
              <el-table-column label="编号/条码" width="250">
                <template #default="scope">
                  <div class="flex-center">
                    <span class="mr5" style="width: 50px">编号</span>
                    <el-input v-model="scope.row.skuCode" />
                  </div>
                  <div class="flex-center mt5">
                    <span class="mr5" style="width: 50px">条码</span>
                    <el-input v-model="scope.row.barcode" />
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="长/宽/高(cm)" width="200">
                <template #default="scope">
                  <div class="flex-center">
                    <span class="mr5">长</span>
                    <el-input-number :controls="false" :min="0" :precision="1" class="mr5" v-model="scope.row.length" />
                  </div>
                  <div class="flex-center mt5">
                    <span class="mr5">宽</span>
                    <el-input-number :controls="false" :min="0" :precision="1" class="mr5" v-model="scope.row.width" />
                  </div>
                  <div class="flex-center mt5">
                    <span class="mr5">高</span>
                    <el-input-number :controls="false" :min="0" :precision="1" v-model="scope.row.height" />
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="净重/毛重(kg)" width="240">
                <template #default="scope">
                  <div class="flex-center">
                    <span class="mr5">净重</span>
                    <el-input-number :controls="false" :min="0" :precision="3" v-model="scope.row.netWeight"/>
                  </div>
                  <div class="flex-center mt5">
                    <span class="mr5">毛重</span>
                    <el-input-number :controls="false" :min="0" :precision="3" v-model="scope.row.grossWeight"/>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="成本价/销售价(元)" width="240">
                <template #default="scope">
                  <div class="flex-center">
                    <span class="mr5">成本价</span>
                    <el-input-number :controls="false" :min="0" :precision="2" v-model="scope.row.costPrice"/>
                  </div>
                  <div class="flex-center mt5">
                    <span class="mr5">销售价</span>
                    <el-input-number :controls="false" :min="0" :precision="2" v-model="scope.row.sellingPrice"/>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="操作" class-name="small-padding fixed-width" width="80" align="right">
                <template #default="scope">
                  <el-button link icon="Delete" type="primary" @click="handleDeleteItemSku(scope.row, scope.$index)">删除</el-button>
                </template>
              </el-table-column>
              <template #append v-if="skuForm.itemSkuList.length">
                <div style="padding: 6px 2px 6px 2px;text-align: center;">
                  <el-button text class="add-btn" icon="Plus" type="primary" @click="onAppendBtnClick">添加茶品规格
                  </el-button>
                </div>
              </template>
              <template #empty>
                <div style="padding: 2px 2px 6px 2px;text-align: center;width: 100%!important;">
                  <el-button text class="add-btn" icon="Plus" type="primary" @click="onAppendBtnClick">添加茶品规格
                  </el-button>
                </div>
              </template>
            </el-table>
          </el-form>
        </el-card>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button :loading="buttonLoading" type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-drawer>
    <!-- 添加或修改茶类对话框 -->
    <el-dialog :title="categoryDialog.title" v-model="categoryDialog.visible" width="500px" append-to-body
               :close-on-click-modal="false">
      <el-form ref="itemCategoryFormRef" :model="categoryForm" :rules="typeRules" label-width="128px" @submit.native.prevent>
        <el-form-item label="上级分类" prop="parentId">
          <el-tree-select
            v-model="categoryForm.parentId"
            :data="itemCategoryTreeSelectList"
            :props="{ value: 'id', label: 'label', children: 'children' }"
            value-key="id"
            placeholder="上级分类"
            check-strictly
            style="width: 100%!important;"
            clearable
          />
        </el-form-item>
        <el-form-item label="茶类分类名称" prop="categoryName">
          <el-input v-model="categoryForm.categoryName" placeholder="请输入茶类分类名称" @keyup.enter="submitCategoryForm"/>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button :loading="buttonLoading" type="primary" @click="submitCategoryForm">确 定</el-button>
          <el-button @click="cancelType">取 消</el-button>
        </div>
      </template>
      <div id="qrcode"></div>
    </el-dialog>
    <div id="outSkuIdBox" style="display: none">
      <img :src="qrcode"/>
      <canvas ref="barcode"></canvas>
    </div>
  </div>
</template>

<script setup name="Item">
import {getItem, delItem, addItem, updateItem} from '@/api/wms/item';
import {computed, getCurrentInstance, nextTick, onMounted, reactive, ref, toRefs} from 'vue';
import {ElForm, ElTree, ElTreeSelect} from 'element-plus';
import {
  updateItemCategory,
  addItemCategory,
  delItemCategory,
  updateOrderNum
} from "@/api/wms/itemCategory";
import {listItemSkuPage, delItemSku, listItemSku} from "@/api/wms/itemSku";
import {useRoute} from "vue-router";
import Qrcode from 'qrcode'
import JSBarcode from 'jsbarcode'
import {useWmsStore} from '@/store/modules/wms'

const barcode = ref(null)
const route = useRoute()
const {proxy} = getCurrentInstance();
const itemList = ref([]);
const itemCategoryTreeSelectList = computed(() => useWmsStore().itemCategoryTreeList);
const itemCategoryTreeOptionsList = computed(() => {
  let data = [...itemCategoryTreeSelectList.value];
  data.unshift({
    id: -1,
    label: '全部',
    children: []
  });
  return data;
});
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const skuLoading = ref(false)
const queryFormRef = ref(ElForm);
const itemFormRef = ref(ElForm);
const itemCategoryFormRef = ref(ElForm);
const categoryDrawerVisible = ref(false)
const qrcode = ref(null)

const formatPrice = (val) => {
  if (val === 0 || val) return Number(val).toFixed(2)
  return '—'
}
const formatWeight = (val) => {
  if (val === 0 || val) return val
  return '—'
}
const append = (data) => {
  // resetType();
  categoryForm.value.categoryName = undefined;
  categoryForm.value.parentId = data.id;
  categoryDialog.visible = true;
}

const remove = async (node, data) => {
  const ids = data.id
  await proxy?.$modal.confirm('确认删除分类【' + data.label + '】吗？');
  await delItemCategory(ids);
  proxy?.$modal.msgSuccess("删除成功");
  useWmsStore().getItemCategoryList();
  useWmsStore().getItemCategoryTreeList();
}
const edit = (node, data) => {
  if (node.level > 1) {
    categoryForm.value.parentId = node.parent.data.id
  }
  categoryForm.value.id = data.id;
  // resetType();
  categoryForm.value.categoryName = data.label;
  categoryDialog.title = "修改茶类分类";
  categoryDialog.visible = true;
}
const dialog = reactive({
  visible: false,
  title: ''
});
const categoryDialog = reactive({
  visible: false,
  title: ''
});
const showParent = ref(false)
const initFormData = {
  id: undefined,
  itemCode: undefined,
  itemName: undefined,
  itemCategory: undefined,
  unit: undefined,
  itemBrand: undefined,
  teaType: undefined,
  teaOrigin: undefined,
  teaLevel: undefined,
  harvestSeason: undefined,
  remark: undefined,
}
const initCategoryFormData = {
  id: undefined,
  parentId: undefined,
  ancestors: undefined,
  categoryName: undefined,
  orderNum: 0,
  status: undefined,
}
const data = reactive({
  form: {...initFormData},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    itemCode: undefined,
    itemName: undefined,
    itemCategory: undefined,
    itemBrand: undefined
  },
  rules: {
    id: [
      {required: true, message: "不能为空", trigger: "blur"}
    ],
    itemName: [
      {required: true, message: "名称不能为空", trigger: "blur"}
    ],
    itemCategory: [
      {required: true, message: "分类不能为空", trigger: "blur"}
    ],
    warehouseId: [
      {required: true, message: "所属仓库不能为空", trigger: "blur"}
    ],
    quantity: [
      {required: true, message: "安全库存不能为空", trigger: "blur"}
    ],
    remark: [
      {required: true, message: "备注不能为空", trigger: "blur"}
    ],
  }
});
const categoryData = reactive({
  form: {...initCategoryFormData},
  queryParams: {
    pageNum: 1,
    pageSize: 1000,
    parentId: undefined,
    categoryName: undefined,
    orderNum: undefined,
    status: undefined,
  },
  rules: {
    id: [
      {required: true, message: "茶类分类id不能为空", trigger: "blur"}
    ],
    // parentId: [
    //   {required: true, message: "父物料类型id不能为空", trigger: "blur"}
    // ],
    categoryName: [
      {required: true, message: "茶类分类名称不能为空", trigger: "blur"}
    ],
    status: [
      {required: true, message: "茶类分类状态不能为空", trigger: "change"}
    ],
  }
});
const {queryParams, form, rules} = toRefs(data);

const {queryParams: typeQueryParams, form: categoryForm, rules: typeRules} = toRefs(categoryData);
const currentType = ref()
/** 查询茶品列表 */
const getList = async () => {
  loading.value = true;
  const res = await listItemSkuPage(queryParams.value);
  const content = [...res.rows];
  itemList.value = content.map((it) => ({...it, id: it.skuId,itemId: it?.item?.id}));
  total.value = res.total;
  loading.value = false;
}
const handleAddType = (show) => {
  categoryDialog.title = "新增茶类分类";
  showParent.value = show
  categoryDialog.visible = true;
  if (show) {
    categoryForm.value.parentId = undefined
  }
  nextTick(() => {
    categoryForm.value.categoryName = undefined;
  });
}
const skuForm = reactive({
  itemSkuList: []
})
const skuFormRef = ref(ElForm)
const skuRules = {
  skuName: [{required: true, message: '规格名称不能为空', trigger: 'blur'}]
}
// sku 管理
const resetItemSkuList = () => {
  skuForm.itemSkuList = []
  skuForm.itemSkuList.push({
    id: '',
    itemId: '',
    barcode: '',
    inPrice: null,
    outPrice: null,
    skuName: '',
    quantity: null,
  })
}

const onAppendBtnClick = () => {
  skuForm.itemSkuList.push({
    id: '',
    itemId: '',
    barcode: '',
    inPrice: null,
    outPrice: null,
    skuName: '',
    quantity: null,
  })
}
const handleDeleteItemSku = async (row, index) => {
  if (!row.id) {
    skuForm.itemSkuList.splice(index, 1);
    return
  }
  if (skuForm.itemSkuList.length === 1) {
    return proxy?.$modal.msgError("至少包含一个茶品规格");
  }
  await proxy?.$modal.confirm('确认删除规格【' + row.skuName + '】吗？');
  loading.value = true;
  await delItemSku(row.id).finally(()=> loading.value = false);
  proxy?.$modal.msgSuccess("删除成功");
  const res = await getItem(row.itemId);
  skuForm.itemSkuList = res.data.sku
  form.value = res.data
}
const collapse = (draggingNode, dropNode, type) => {
  //注掉的是同级拖拽
  if (draggingNode.data.label !== '全部' && draggingNode.level === dropNode.level && draggingNode.parent.id == dropNode.parent.id) {
    if (dropNode.data.label === '全部') {
      return type === 'next';
    } else {
      return type === 'prev' || type === 'next'
    }
  } else {
    // 不同级进行处理
    return false
  }
}
const handleNodeDrop = async (draggingNode, dropNode, dropType, ev) => {
  if (dropNode.level === 1) {
    await updateOrderNum(dropNode.parent.data.filter(it => it.id !== -1));
  } else {
    await updateOrderNum(dropNode.parent.data.children);
  }
}
/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
}
const cancelType = () => {
  resetType();
  categoryDialog.visible = false;
}
/** 表单重置 */
const reset = () => {
  form.value = {...initFormData};
  itemFormRef.value.resetFields();
}

/** 表单重置 */
const resetType = () => {
  categoryForm.value = {...initCategoryFormData};
  itemCategoryFormRef.value.resetFields();
}
/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields();
  handleQuery();
}

/** 多选框选中数据 */
const handleSelectionChange = (selection) => {
  ids.value = selection.map(item => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
const handleAdd = () => {
  resetItemSkuList()
  dialog.visible = true;
  dialog.title = "新增茶品";
  nextTick(async () => {
    reset();
  });
}
/** 修改按钮操作 */
const handleUpdate = (row) => {
  resetItemSkuList()
  skuLoading.value = true
  dialog.visible = true;
  dialog.title = "修改茶品";
  nextTick(async () => {
    reset();
    const _id = row?.itemId || ids.value[0]
    const res = await listItemSku({'itemId':_id});
    Object.assign(skuForm.itemSkuList, res.data)
    skuLoading.value = false
    Object.assign(form.value, row.item);
  });
}
const handleCategoryNodeClick = (data) => {
  queryParams.value.pageNum = 1
  if (data.label === '全部' || data.id === -1) {
    queryParams.value.itemCategory = undefined
    currentType.value = ''
  } else {
    queryParams.value.itemCategory = data.id
    currentType.value = data.id
  }
  getList()
  categoryDrawerVisible.value = false
}

const handleCategoryCommand = (cmd, node, data) => {
  if (cmd === 'append') append(data)
  else if (cmd === 'edit') edit(node, data)
  else if (cmd === 'remove') remove(node, data)
}
/** 提交按钮 */
const submitForm = () => {
  form.value.sku = skuForm.itemSkuList
  itemFormRef.value.validate(async (valid) => {
    if (valid) {
      let flag = true
      if (!skuForm.itemSkuList || skuForm.itemSkuList.length === 0) {
        proxy?.$modal.msgError("至少包含一个茶品规格");
        flag = false
      }
      await skuFormRef.value.validate((valid2) => {
        if (!valid2) {
          flag = false;
        }
      })
      if (flag) {
        buttonLoading.value = true;
        if (form.value.id) {
          await updateItem(form.value).finally(() => buttonLoading.value = false);
        } else {
          await addItem(form.value).finally(() => buttonLoading.value = false);
        }
        proxy?.$modal.msgSuccess("修改成功");
        dialog.visible = false;
        await getList();
      }
    }
  });
}
const submitCategoryForm = () => {
  itemCategoryFormRef.value.validate(async (valid) => {
    if (valid) {
      buttonLoading.value = true;
      if (categoryForm.value.id) {
        await updateItemCategory(categoryForm.value).finally(() => buttonLoading.value = false);
      } else {
        await addItemCategory(categoryForm.value).finally(() => buttonLoading.value = false);
      }
      proxy?.$modal.msgSuccess(categoryForm.value.id ? '修改成功' : '新增成功');
      categoryDialog.visible = false;
      useWmsStore().getItemCategoryList();
      useWmsStore().getItemCategoryTreeList();
    }
  });
}
/** 删除按钮操作 */
const handleDelete = async (row) => {
  const _ids = row?.itemId || ids.value;
  await proxy?.$modal.confirm('确认删除茶品【' + row?.item.itemName + '】吗？');
  loading.value = true;
  await delItem(_ids).finally(()=> loading.value = false);
  proxy?.$modal.msgSuccess("删除成功");
  await getList();
}
const treeRef = ref(null)
/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download('wms/item/export', {
    ...queryParams.value
  }, `item_${new Date().getTime()}.xlsx`)
}
/** 下载条形码 */
const downloadBarcode = (row) => {
  JSBarcode(barcode.value, row.barcode, {
    format: "CODE128",
    displayValue: true
  })
  const canvas = barcode.value
  //创建a标签
  let a = document.createElement('a')
  //设置下载文件的名字
  a.download = row.barcode
  a.href = canvas.toDataURL("image/png")
  a.click()
}
/** 下载二维码 */
const downloadQrcode = async (row) => {
  qrcode.value = await Qrcode.toDataURL(row.barcode)
  //创建a标签
  let a = document.createElement('a')
  //获取二维码的url并赋值为a.href
  a.href = qrcode.value
  //设置下载文件的名字
  a.download = row.barcode
  //点击事件，相当于下载
  a.click()
  //提示信息
  // this.$message.warn('下载中，请稍后...')
}
onMounted(() => {
  nextTick(()=>{
    getList();
    if (route.query.openDrawer) {
      handleAdd()
    }
  })
});
</script>
<style scoped lang="scss">
.list-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.list-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a4d2e;
}

.list-actions {
  display: flex;
  gap: 8px;
}

.category-drawer-toolbar {
  margin-bottom: 12px;
}

.category-drawer-tip {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}

.category-drawer-tree {
  margin-top: 4px;
}

.category-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 4px;
  min-width: 0;
}

.category-tree-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.category-tree-more {
  flex-shrink: 0;
  padding: 0 4px;
}

:deep(.category-drawer-tree .el-tree-node__content) {
  height: 36px;
}

:deep(.item-flat-table .el-table__cell) {
  padding: 8px 0;
}
</style>

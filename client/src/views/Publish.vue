<template>
  <!-- ============================================
       发布/编辑商品页面
       包含：表单填写、图片上传、分类选择、地图选点
       支持编辑模式：读取原有数据回填表单
  ============================================ -->
  <div class="publish-page">
    <h2 class="page-title">{{ isEdit ? '✏️ 编辑宝贝' : '📦 发布闲置宝贝' }}</h2>

    <el-card class="publish-card">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-row :gutter="20">
          <el-col :span="16" :xs="24">
            <el-form-item label="商品标题" prop="title">
              <el-input v-model="form.title" placeholder="给宝贝起个吸引人的标题~" size="large" maxlength="100" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="8" :xs="24">
            <el-form-item label="分类" prop="category_id">
              <el-select v-model="form.category_id" placeholder="选择分类" size="large" style="width:100%">
                <el-option v-for="cat in categories" :key="cat.id" :label="`${cat.icon} ${cat.name}`" :value="cat.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8" :xs="24">
            <el-form-item label="售价 (元)" prop="price">
              <el-input-number v-model="form.price" :min="0.01" :precision="2" size="large" style="width:100%" placeholder="0.00" />
            </el-form-item>
          </el-col>
          <el-col :span="8" :xs="24">
            <el-form-item label="原价 (选填)">
              <el-input-number v-model="form.original_price" :min="0" :precision="2" size="large" style="width:100%" placeholder="原价对比" />
            </el-form-item>
          </el-col>
          <el-col :span="8" :xs="24">
            <el-form-item label="商品成色">
              <el-select v-model="form.condition" size="large" style="width:100%">
                <el-option label="全新" value="全新" />
                <el-option label="几乎全新" value="几乎全新" />
                <el-option label="轻微使用" value="轻微使用" />
                <el-option label="正常使用" value="正常使用" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="校区">
          <el-input v-model="form.campus_area" placeholder="如：东校区" size="large" />
        </el-form-item>

        <el-form-item label="商品描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="5" placeholder="详细描述商品的使用情况、购买时间等信息..." />
        </el-form-item>

        <el-form-item label="商品图片">
          <el-upload
            v-model:file-list="fileList"
            :http-request="handleUpload"
            list-type="picture-card"
            :limit="6"
            :on-exceed="() => { ElMessage.warning('最多上传6张图片') }"
            :on-remove="handleRemove"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
          <p class="upload-tip">支持 jpg/png/gif/webp，每张不超过5MB</p>

          <!-- 手动输入图片URL（本地图片放 server/uploads/ 文件夹） -->
          <div style="margin-top:12px;display:flex;gap:8px">
            <el-input v-model="manualImageUrl" placeholder="或粘贴图片URL：http://localhost:3001/uploads/xxx.jpg" size="default" />
            <el-button @click="addManualImage">添加</el-button>
          </div>
          <p style="font-size:11px;color:#aaa;margin-top:4px">💡 图片放 server/uploads/ 文件夹后，URL 就是 http://localhost:3001/uploads/文件名.jpg</p>
        </el-form-item>

        <!-- 交易地点指定方式 -->
        <el-form-item label="交易地点由谁指定">
          <el-radio-group v-model="form.location_type">
            <el-radio value="seller">🙋 我来指定交易地点</el-radio>
            <el-radio value="buyer">🤝 让买家来选择</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 高德地图选点（仅卖家指定时显示） -->
        <el-form-item v-if="form.location_type === 'seller'" label="交易地点（点击地图选择）">
          <MapPicker v-model="tradeLocation" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" size="large" :loading="submitting" @click="handleSubmit" class="publish-btn">
            {{ submitting ? (isEdit ? '更新中...' : '发布中...') : (isEdit ? '💾 更新宝贝' : '🚀 发布宝贝') }}
          </el-button>
          <el-button v-if="isEdit" size="large" @click="$router.push('/user/products')" style="margin-left:12px">
            取消
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
// ============================================
// 发布/编辑商品逻辑
// 支持新建和编辑两种模式
// ============================================
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import MapPicker from '../components/MapPicker.vue'
import { getCategories, createProduct, updateProduct, getProductDetail, uploadFile } from '../api'

const router = useRouter()
const route = useRoute()
const formRef = ref(null)
const categories = ref([])
const submitting = ref(false)
const fileList = ref([])
const uploadedImages = ref([])
const tradeLocation = ref({ lng: null, lat: null, address: '' })
const manualImageUrl = ref('')

// 手动添加图片URL
function addManualImage() {
  const url = manualImageUrl.value.trim()
  if (!url) return
  if (uploadedImages.value.includes(url)) {
    ElMessage.warning('这张图已经添加过了')
    return
  }
  uploadedImages.value.push(url)
  fileList.value.push({ name: url.split('/').pop(), url })
  manualImageUrl.value = ''
  ElMessage.success('图片已添加~')
}

// 编辑模式：从 URL query 获取商品 ID
const editId = route.query.edit ? parseInt(route.query.edit) : null
const isEdit = ref(!!editId)

const form = reactive({
  title: '',
  category_id: null,
  price: null,
  original_price: null,
  condition: '正常使用',
  campus_area: '',
  description: '',
  location_type: 'buyer'
})

const rules = {
  title: [{ required: true, message: '请输入商品标题', trigger: 'blur' }],
  category_id: [{ required: true, message: '请选择分类', trigger: 'change' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }]
}

onMounted(async () => {
  try {
    const res = await getCategories()
    if (res.data.code === 200) categories.value = res.data.data
  } catch (e) { console.error(e) }

  // 编辑模式：加载原有商品数据
  if (editId) {
    try {
      const res = await getProductDetail(editId)
      if (res.data.code === 200) {
        const p = res.data.data
        form.title = p.title
        form.category_id = p.category_id
        form.price = p.price
        form.original_price = p.original_price
        form.condition = p.condition
        form.campus_area = p.campus_area || ''
        form.description = p.description || ''
        form.location_type = p.location_type || 'buyer'
        if (p.trade_location) {
          tradeLocation.value = { lng: null, lat: null, address: p.trade_location }
        }

        // 回填图片
        if (p.images && p.images.length) {
          uploadedImages.value = p.images
          fileList.value = p.images.map((url, i) => ({
            name: 'image-' + i,
            url: url
          }))
        }
      }
    } catch (e) { console.error('加载商品信息失败', e) }
  }
})

// 自定义上传
async function handleUpload({ file }) {
  try {
    const res = await uploadFile(file)
    if (res.data.code === 200) {
      uploadedImages.value.push(res.data.data.url)
    } else {
      ElMessage.error(res.data.message)
    }
  } catch (e) {
    ElMessage.error('图片上传失败')
  }
}

function handleRemove(file) {
  const url = file.response?.data?.url || file.url
  uploadedImages.value = uploadedImages.value.filter(u => u !== url)
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    let res
    if (isEdit.value) {
      // 编辑模式：更新商品
      res = await updateProduct(editId, {
        ...form,
        images: uploadedImages.value,
        trade_location: tradeLocation.value.address || form.campus_area
      })
    } else {
      // 新建模式：创建商品
      res = await createProduct({
        ...form,
        images: uploadedImages.value,
        trade_location: tradeLocation.value.address || form.campus_area
      })
    }

    if (res.data.code === 200) {
      ElMessage.success(isEdit.value ? '商品已更新~ ✨' : res.data.message)
      router.push(isEdit.value ? '/user/products' : '/')
    } else {
      ElMessage.error(res.data.message)
    }
  } catch (e) {
    ElMessage.error(isEdit.value ? '更新失败，请重试' : '发布失败，请重试')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.publish-page { max-width: 800px; margin: 0 auto; padding: 10px 0; }
.publish-card { padding: 10px; }
.publish-btn { width: 200px; height: 44px; font-size: 16px; font-weight: 600; }
.upload-tip { font-size: 12px; color: var(--text-light); margin-top: 6px; }
</style>

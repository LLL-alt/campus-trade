<template>
  <div class="map-picker">
    <div v-if="!loaded" class="map-placeholder">
      <el-icon class="is-loading" :size="32"><Loading /></el-icon>
      <p>地图加载中...</p>
    </div>
    <div :id="mapId" class="map-container" :style="{ height: loaded ? '300px' : '0' }"></div>

    <div class="map-info" v-if="loaded && selectedLocation">
      <el-tag type="success" size="large">📍 {{ selectedLocation.address || `${selectedLocation.lng}, ${selectedLocation.lat}` }}</el-tag>
      <el-button size="small" type="danger" @click="clearLocation" v-if="!readonly">清除位置</el-button>
    </div>

    <div class="map-hint" v-if="!readonly">💡 点击地图选择交易地点，方便买卖双方见面交易~</div>

    <div class="map-search" v-if="loaded && !readonly">
      <el-input v-model="searchKeyword" placeholder="搜索地点（如：东校区图书馆）" size="default" @keyup.enter="searchPlace" clearable>
        <template #append><el-button @click="searchPlace">🔍 搜索</el-button></template>
      </el-input>
      <div class="search-results" v-if="searchResults.length">
        <div v-for="(item, i) in searchResults" :key="i" class="search-item" @click="selectSearchResult(item)">
          <span>📍</span>
          <div><p class="place-name">{{ item.name }}</p><p class="place-addr">{{ item.address }}</p></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { Loading } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: { type: Object, default: () => ({ lng: null, lat: null, address: '' }) },
  readonly: { type: Boolean, default: false },
  center: { type: Array, default: () => [113.280637, 23.125178] }  // 默认广州
})

const emit = defineEmits(['update:modelValue'])

const mapId = 'amap-' + Math.random().toString(36).slice(2, 8)
const loaded = ref(false)
const selectedLocation = ref(null)
const searchKeyword = ref('')
const searchResults = ref([])

let map = null, marker = null, geocoder = null

// ── 加载高德地图脚本 ──
function loadAMapScript() {
  return new Promise((resolve, reject) => {
    if (window.AMap) { resolve(); return }

    window._AMapSecurityConfig = {
      securityJsCode: import.meta.env.VITE_AMAP_SECURITY_CODE
    }

    const amapKey = import.meta.env.VITE_AMAP_KEY
    const script = document.createElement('script')
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${amapKey}&plugin=AMap.Geocoder,AMap.Scale,AMap.ToolBar,AMap.PlaceSearch`
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('地图脚本加载失败'))
    document.head.appendChild(script)
  })
}

// ── 初始化地图 ──
function initMap() {
  if (!window.AMap || !document.getElementById(mapId)) return

  const [lng, lat] = props.center

  map = new window.AMap.Map(mapId, {
    zoom: 15,
    center: [lng, lat],
    resizeEnable: true
  })
  map.addControl(new window.AMap.Scale())
  map.addControl(new window.AMap.ToolBar({ position: 'RT' }))

  geocoder = new window.AMap.Geocoder({})

  if (!props.readonly) {
    map.on('click', (e) => {
      setMarker(e.lnglat.getLng(), e.lnglat.getLat())
      reverseGeocode(e.lnglat.getLng(), e.lnglat.getLat())
    })
  }

  if (props.modelValue?.lng && props.modelValue?.lat) {
    setMarker(props.modelValue.lng, props.modelValue.lat)
    selectedLocation.value = { ...props.modelValue }
  }

  loaded.value = true
}

onMounted(async () => {
  try {
    await loadAMapScript()
    await nextTick()
    // 延迟确保父容器（如弹窗）渲染完成
    setTimeout(() => initMap(), 200)
  } catch (e) {
    console.warn('地图加载失败:', e.message)
    loaded.value = true
  }
})

onUnmounted(() => { if (map) map.destroy() })

// ── 标记 ──
function setMarker(lng, lat) {
  if (marker) map.remove(marker)
  marker = new window.AMap.Marker({
    position: [lng, lat],
    animation: 'AMAP_ANIMATION_DROP'
  })
  map.add(marker)
  map.setCenter([lng, lat])
}

// ── 逆地理编码 ──
function reverseGeocode(lng, lat) {
  if (!geocoder) return
  geocoder.getAddress([lng, lat], (status, result) => {
    if (status === 'complete' && result.regeocode) {
      const loc = { lng, lat, address: result.regeocode.formattedAddress }
      selectedLocation.value = loc
      emit('update:modelValue', loc)
    }
  })
}

// ── 搜索地点 ──
function searchPlace() {
  if (!searchKeyword.value.trim() || !window.AMap) return
  window.AMap.plugin('AMap.PlaceSearch', () => {
    const ps = new window.AMap.PlaceSearch({ pageSize: 5 })
    ps.search(searchKeyword.value, (status, result) => {
      if (status === 'complete' && result.poiList) {
        searchResults.value = result.poiList.pois.map(p => ({
          name: p.name,
          address: p.address || p.pname + p.cityname + p.adname,
          lng: p.location.lng,
          lat: p.location.lat
        }))
      }
    })
  })
}

function selectSearchResult(item) {
  setMarker(item.lng, item.lat)
  const loc = { lng: item.lng, lat: item.lat, address: item.name + ' ' + item.address }
  selectedLocation.value = loc
  emit('update:modelValue', loc)
  searchResults.value = []
  searchKeyword.value = item.name
}

function clearLocation() {
  if (marker) { map.remove(marker); marker = null }
  selectedLocation.value = null
  emit('update:modelValue', { lng: null, lat: null, address: '' })
}
</script>

<style scoped>
.map-picker { border-radius: 14px; overflow: hidden; border: 2px solid #E8EDF3; }
.map-placeholder { height: 300px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #EBF1FB; color: #999; gap: 10px; }
.map-container { width: 100%; }
.map-info { padding: 10px 14px; display: flex; align-items: center; gap: 10px; }
.map-hint { padding: 8px 14px; font-size: 12px; color: #999; background: #FFF8E1; }
.map-search { padding: 12px; background: #fff; border-top: 1px solid #E8EDF3; }
.search-results { margin-top: 8px; max-height: 180px; overflow-y: auto; }
.search-item { display: flex; gap: 8px; padding: 10px; cursor: pointer; border-radius: 6px; transition: all 0.2s; align-items: flex-start; }
.search-item:hover { background: #EBF1FB; }
.place-name { font-size: 14px; font-weight: 500; }
.place-addr { font-size: 12px; color: #999; }
</style>

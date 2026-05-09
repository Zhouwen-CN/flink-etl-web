import type { RouteRecordRaw } from "vue-router"
import { useTagsViewStore } from "@/pinia/stores/tags-view"

export function useIframe() {
  const route = useRoute()
  const router = useRouter()
  const tagsViewStore = useTagsViewStore()

  // 当前路由是否为 iframe 页面
  const isIframePage = computed(() => !!route.meta.iframeUrl)

  // 当前路由是否为不缓存的 iframe 页面
  const iframeNotKeepAlive = computed(() => !!route.meta.iframeUrl && !route.meta.keepAlive)

  // 已打开且需要缓存的 iframe 页面列表
  const keepAliveIframePages = computed(() => {
    const routes = router.getRoutes()
    return routes.filter((r: RouteRecordRaw) =>
      r.meta?.iframeUrl
      && r.meta?.keepAlive
      && tagsViewStore.visitedViews.some(v => v.path === r.path)
    )
  })

  return {
    isIframePage,
    iframeNotKeepAlive,
    keepAliveIframePages
  }
}

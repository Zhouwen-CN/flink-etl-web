import type { RouteRecordRaw } from "vue-router"
import { createRouter } from "vue-router"
import { routerConfig } from "@/router/config"
import { registerNavigationGuard } from "@/router/guard"
import { flatMultiLevelRoutes } from "./helper"

const Layouts = () => import("@/layouts/index.vue")

/**
 * @name 常驻路由
 * @description 除了 redirect/403/404/login 等隐藏页面，其他页面建议设置唯一的 Name 属性
 */
export const constantRoutes: RouteRecordRaw[] = [
  {
    path: "/redirect",
    component: Layouts,
    meta: {
      hidden: true
    },
    children: [
      {
        path: ":path(.*)",
        component: () => import("@/pages/redirect/index.vue")
      }
    ]
  },
  {
    path: "/403",
    component: () => import("@/pages/error/403.vue"),
    meta: {
      hidden: true
    }
  },
  {
    path: "/404",
    component: () => import("@/pages/error/404.vue"),
    meta: {
      hidden: true
    },
    alias: "/:pathMatch(.*)*"
  },
  {
    path: "/login",
    component: () => import("@/pages/login/index.vue"),
    meta: {
      hidden: true
    }
  },
  {
    path: "/",
    component: Layouts,
    redirect: "/dashboard",
    children: [
      {
        path: "dashboard",
        component: () => import("@/pages/dashboard/index.vue"),
        name: "Dashboard",
        meta: {
          title: "首页",
          svgIcon: "dashboard",
          affix: true
        }
      }
    ]
  },
  {
    path: "/demo",
    component: Layouts,
    redirect: "/demo/element-plus",
    name: "Demo",
    meta: {
      title: "示例集合",
      elIcon: "DataBoard"
    },
    children: [
      {
        path: "element-plus",
        component: () => import("@/pages/demo/element-plus/index.vue"),
        name: "ElementPlus",
        meta: {
          title: "Element Plus",
          keepAlive: true
        }
      },
      {
        path: "level2",
        component: () => import("@/pages/demo/level2/index.vue"),
        redirect: "/demo/level2/level3",
        name: "Level2",
        meta: {
          title: "二级路由",
          alwaysShow: true
        },
        children: [
          {
            path: "level3",
            component: () => import("@/pages/demo/level2/level3/index.vue"),
            name: "Level3",
            meta: {
              title: "三级路由",
              keepAlive: true
            }
          }
        ]
      },
      {
        path: "composable-demo",
        redirect: "/demo/composable-demo/use-fetch-select",
        name: "ComposableDemo",
        meta: {
          title: "组合式函数"
        },
        children: [
          {
            path: "use-fetch-select",
            component: () => import("@/pages/demo/composable-demo/use-fetch-select.vue"),
            name: "UseFetchSelect",
            meta: {
              title: "useFetchSelect"
            }
          },
          {
            path: "use-fullscreen-loading",
            component: () => import("@/pages/demo/composable-demo/use-fullscreen-loading.vue"),
            name: "UseFullscreenLoading",
            meta: {
              title: "useFullscreenLoading"
            }
          },
          {
            path: "use-watermark",
            component: () => import("@/pages/demo/composable-demo/use-watermark.vue"),
            name: "UseWatermark",
            meta: {
              title: "useWatermark"
            }
          }
        ]
      }
    ]
  },
  {
    path: "/link",
    meta: {
      title: "文档链接",
      elIcon: "Link"
    },
    children: [
      {
        path: "https://juejin.cn/post/7445151895121543209",
        component: () => {},
        name: "Link1",
        meta: {
          title: "中文文档"
        }
      },
      {
        path: "https://juejin.cn/column/7207659644487139387",
        component: () => {},
        name: "Link2",
        meta: {
          title: "新手教程"
        }
      }
    ]
  }
]

/**
 * @name 动态路由，权限代码约定 routeName.operationType，由前端控制写入，routeName最好小写
 * @description 用来放置有权限 (Roles 属性) 的路由
 * @description 必须带有唯一的 Name 属性
 */
export const dynamicRoutes: RouteRecordRaw[] = [
  {
    path: "/system",
    component: Layouts,
    redirect: "/system/user",
    name: "system",
    meta: {
      title: "系统管理",
      elIcon: "Lock",
      // 可以在根路由中设置角色
      roles: ["admin"],
      alwaysShow: true
    },
    children: [
      {
        path: "user",
        component: () => import("@/pages/auth/user/index.vue"),
        name: "user",
        meta: {
          title: "用户管理"
        }
      },
      {
        path: "role",
        component: () => import("@/pages/auth/role/index.vue"),
        name: "role",
        meta: {
          title: "角色管理"
        }
      },
      {
        path: "permission",
        component: () => import("@/pages/auth/permission/index.vue"),
        name: "permission",
        meta: {
          title: "权限管理"
        }
      }
    ]
  },
  {
    path: "/tool",
    redirect: "/tool/admin",
    component: Layouts,
    meta: {
      title: "系统工具",
      elIcon: "Setting",
      roles: ["admin"]
    },
    children: [
      {
        path: "admin",
        name: "admin",
        meta: {
          title: "SpringBoot Admin",
          iframeUrl: import.meta.env.VITE_SPRINGBOOT_ADMIN_URL,
          keepAlive: true
        }
      } as RouteRecordRaw,
      {
        path: "swagger",
        name: "swagger-ui",
        meta: {
          title: "Swagger UI",
          iframeUrl: import.meta.env.VITE_SWAGGER_URL,
          keepAlive: true
        }
      } as RouteRecordRaw,
      {
        path: "dict",
        component: () => import("@/pages/tool/dict/index.vue"),
        name: "dict",
        meta: {
          title: "字典管理"
        }
      }
    ]
  },
  {
    path: "/etl",
    component: Layouts,
    redirect: "/etl/cluster",
    meta: {
      title: "ETL 管理",
      elIcon: "Document",
      roles: ["admin"]
    },
    children: [
      {
        path: "cluster",
        component: () => import("@/pages/etl/cluster/index.vue"),
        name: "cluster",
        meta: {
          title: "Flink 集群"
        }
      },
      {
        path: "jar",
        component: () => import("@/pages/etl/jar/index.vue"),
        name: "jar",
        meta: {
          title: "Jar 包管理"
        }
      },
      {
        path: "job",
        component: () => import("@/pages/etl/job/index.vue"),
        name: "job",
        meta: {
          title: "ETL 任务"
        }
      }
    ]
  },
  {
    path: "/log",
    component: Layouts,
    redirect: "/log/login",
    meta: {
      title: "日志管理",
      elIcon: "Document",
      alwaysShow: true
    },
    children: [
      {
        path: "login",
        component: () => import("@/pages/log/login/index.vue"),
        name: "login",
        meta: {
          title: "登录日志"
        }
      },
      {
        path: "error",
        component: () => import("@/pages/log/error/index.vue"),
        name: "error",
        meta: {
          title: "异常日志"
        }
      }
    ]
  }
]

/** 路由实例 */
export const router = createRouter({
  history: routerConfig.history,
  routes: routerConfig.thirdLevelRouteCache ? flatMultiLevelRoutes(constantRoutes) : constantRoutes
})

/** 重置路由 */
export function resetRouter() {
  try {
    // 注意：所有动态路由路由必须带有 Name 属性，否则可能会不能完全重置干净
    router.getRoutes().forEach((route) => {
      const { name, meta } = route
      if (name && meta.roles?.length) {
        router.hasRoute(name) && router.removeRoute(name)
      }
    })
  } catch {
    // 强制刷新浏览器也行，只是交互体验不是很好
    location.reload()
  }
}

// 注册路由导航守卫
registerNavigationGuard(router)

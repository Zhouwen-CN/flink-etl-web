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
      elIcon: "Setting",
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
      svgIcon: "system-tools",
      roles: ["admin", "dev"],
      alwaysShow: true
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
      },
      {
        path: "variable",
        component: () => import("@/pages/tool/variable/index.vue"),
        name: "variable",
        meta: {
          title: "变量管理"
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
      svgIcon: "job-manager",
      alwaysShow: true
    },
    children: [
      {
        path: "schedule",
        component: () => import("@/pages/etl/schedule/index.vue"),
        name: "schedule",
        meta: {
          title: "定时任务"
        }
      },
      {
        path: "job",
        component: () => import("@/pages/etl/job/index.vue"),
        name: "job",
        meta: {
          title: "ETL 任务",
          roles: ["admin", "dev"]
        }
      },
      {
        path: "instance",
        component: () => import("@/pages/etl/instance/index.vue"),
        name: "instance",
        meta: {
          title: "任务实例",
          roles: ["admin", "dev"]
        }
      },
      {
        path: "cluster",
        component: () => import("@/pages/etl/cluster/index.vue"),
        name: "cluster",
        meta: {
          title: "Flink 集群",
          roles: ["admin"]
        }
      },
      {
        path: "jar",
        component: () => import("@/pages/etl/jar/index.vue"),
        name: "jar",
        meta: {
          title: "Jar 包管理",
          roles: ["admin"]
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
      svgIcon: "log-manager",
      alwaysShow: true
    },
    children: [
      {
        path: "login",
        component: () => import("@/pages/log/login/index.vue"),
        name: "login-log",
        meta: {
          title: "登录日志"
        }
      },
      {
        path: "request",
        component: () => import("@/pages/log/request/index.vue"),
        name: "request-log",
        meta: {
          title: "请求日志"
        }
      },
      {
        path: "error",
        component: () => import("@/pages/log/error/index.vue"),
        name: "error-log",
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

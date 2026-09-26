import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('../views/Home.vue')
    },
  ]
})

// 全局前置守卫：访问根路径时若 query 缺少 userId，自动补为 123
// 满足"默认路由跳转都默认带上 userId 为 123"的需求
router.beforeEach((to, from, next) => {
  if (to.path === '/' && !to.query.userId) {
    next({ path: '/', query: { ...to.query, userId: '123' } })
  } else {
    next()
  }
})

export default router

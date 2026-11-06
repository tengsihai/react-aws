import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ToastProvider } from './components/ToastProvider'
import { ItemCreatePage } from './pages/ItemCreatePage'
import { ItemDetailPage } from './pages/ItemDetailPage'
import { ItemEditPage } from './pages/ItemEditPage'
import { ItemListPage } from './pages/ItemListPage'
import { NotFoundPage } from './pages/NotFoundPage'

/**
 * 路由表：
 *   /items            列表（查）
 *   /items/new        新建（增）
 *   /items/:id        详情（查单条）
 *   /items/:id/edit   编辑（改）
 *   删除操作在列表页与详情页中触发
 */
export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/items" replace />} />
            <Route path="items" element={<ItemListPage />} />
            <Route path="items/new" element={<ItemCreatePage />} />
            <Route path="items/:id" element={<ItemDetailPage />} />
            <Route path="items/:id/edit" element={<ItemEditPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  )
}

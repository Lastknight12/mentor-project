import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth.jsx'
import { Layout } from './components/Layout.jsx'
import { AuthPage } from './pages/AuthPage.jsx'
import { FavoritesPage } from './pages/FavoritesPage.jsx'
import { HomePage } from './pages/HomePage.jsx'
import { MoviePage } from './pages/MoviePage.jsx'
import { WatchPage } from './pages/WatchPage.jsx'
import { QuizPage } from './pages/QuizPage.jsx'
import { OnlinePage } from './pages/OnlinePage.jsx'
import { NotFoundPage } from './pages/NotFoundPage.jsx'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="movie/:id" element={<MoviePage />} />
            <Route path="movie/:id/watch" element={<WatchPage />} />
            <Route path="quiz" element={<QuizPage />} />
            <Route path="online" element={<OnlinePage />} />
            <Route path="favorites" element={<FavoritesPage />} />
            <Route path="login" element={<AuthPage mode="login" />} />
            <Route path="register" element={<AuthPage mode="register" />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

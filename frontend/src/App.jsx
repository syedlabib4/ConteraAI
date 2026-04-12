import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import TrendResearch from './pages/TrendResearch';
import SeoOptimizer from './pages/SeoOptimizer';
import ContentGenerator from './pages/ContentGenerator';
import ContentHistory from './pages/ContentHistory';
import ImageGenerator from './pages/ImageGenerator';
import SocialMediaManager from './pages/SocialMediaManager';
import AgentDashboard from './pages/AgentDashboard';
import { useState } from 'react';
import RefrshHandler from './RefrshHandler';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const PrivateRoute = ({ element }) => {
    return isAuthenticated ? element : <Navigate to="/login" />
  }

  return (
    <div className="App">
      <RefrshHandler setIsAuthenticated={setIsAuthenticated} />
      <Routes>
        <Route path='/' element={<Navigate to="/login" />} />
        <Route path='/login' element={<Login />} />
        <Route path='/signup' element={<Signup />} />
        <Route path='/home' element={<PrivateRoute element={<Home />} />} />
        <Route path='/dashboard' element={<PrivateRoute element={<Home />} />} />
        <Route path='/agent' element={<PrivateRoute element={<AgentDashboard />} />} />
        <Route path='/trends' element={<PrivateRoute element={<TrendResearch />} />} />
        <Route path='/seo' element={<PrivateRoute element={<SeoOptimizer />} />} />
        <Route path='/generate' element={<PrivateRoute element={<ContentGenerator />} />} />
        <Route path='/images' element={<PrivateRoute element={<ImageGenerator />} />} />
        <Route path='/social' element={<PrivateRoute element={<SocialMediaManager />} />} />
        <Route path='/history' element={<PrivateRoute element={<ContentHistory />} />} />
      </Routes>
    </div>
  );
}

export default App;

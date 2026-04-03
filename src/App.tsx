import { Navigate, Route, Routes } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage"; 

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
}

export default App;

import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import QuoteListPage from "./components/QuoteListPage";

function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={<LoginPage />}
      />
      <Route
        path="/"
        element={<QuoteListPage />}
      />
    </Routes>
  );
}

export default App;

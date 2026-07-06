import { BrowserRouter, Routes, Route } from "react-router-dom";

import Homepage from "./pages/Homepage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import Dashboard from "./pages/Dashboard";

import Equipment from "./pages/Equipment";
import AddEquipment from "./pages/AddEquipment";
import EditEquipment from "./pages/EditEquipment";

import Inventory from "./pages/Inventory";
import AddInventory from "./pages/AddInventory";
function App() {

    return (

        <BrowserRouter>

            <Routes>

                <Route path="/" element={<Homepage />} />

                <Route path="/login" element={<LoginPage />} />

                <Route path="/signup" element={<SignupPage />} />

                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/equipment" element={<Equipment />} />
                <Route path="/equipment/add" element={<AddEquipment />} />
                <Route path="/equipment/edit/:id" element={<EditEquipment />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route
                    path="/inventory/add"
                    element={<AddInventory />}
                />
                <Route path="/equipment" element={<Equipment />} />

                <Route path="/equipment/add" element={<AddEquipment />} />

                <Route path="/equipment/edit/:id" element={<EditEquipment />} />

            </Routes>

        </BrowserRouter>

    );

}

export default App;
import { useState } from "react";
import AuthContext from "./authcontext";

export default function AuthProvider({ children }) {

    const [user, setUser] = useState(null);

    const login = (userData) => {

        setUser(userData);

        if (userData.accessToken) {

            localStorage.setItem("token", userData.accessToken);

            // Decode JWT and store role
            const payload = JSON.parse(
                atob(userData.accessToken.split(".")[1])
            );

            localStorage.setItem("role", payload.role);

        }

    };

    const logout = () => {

        setUser(null);

        localStorage.removeItem("token");
        localStorage.removeItem("role");

    };

    return (

        <AuthContext.Provider
            value={{
                user,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>

    );

}
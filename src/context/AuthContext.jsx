import React, { createContext, useState } from "react";

// crear el contexto donde guardamos la información
export const AuthContext = createContext();

// dejamos 'children' porque representa a todas las páginas de la app
const AuthProvider = ({ children }) => {
    
    // El estado del usuario se queda aquí abajo, perfecto como lo tenías
    const [ user, setUser ] = useState(() => {
         const savedUser = localStorage.getItem("user")
         return savedUser ? JSON.parse(savedUser) : null;
    })
    
    // mirar si tiene permiso para entrar
    const [ token, setToken ] = useState(() => {
        return localStorage.getItem("token") || null;
    })

    // función que se llamará en el login.jsx cuando el servidor nos dé el ok
    const loginAuth = ( userData, userToken ) => {
        setUser(userData);
        setToken(userToken);
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("token", userToken);
    };

    //función para cerrar sesión
    const logoutAuth = () => {
        setUser(null)
        setToken(null)
        localStorage.removeItem("user")
        localStorage.removeItem("token")
    };

    return (
        // Pasamos en el "value" todo lo que las páginas necesitan usar
        <AuthContext.Provider value={{ user, setUser, token, loginAuth, logoutAuth}}>
            {children} {/* Aquí es donde React renderiza tus páginas */}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
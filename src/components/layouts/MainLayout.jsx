import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./navbar/Navbar";
// import Footer from "./footer/Footer";

const MainLayout = () => {
    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            minHeight: '100vh',
            overflow: 'auto'
        }}>
            <Navbar />
            <main style={{ 
                flex: 1,
                overflow: 'auto',
                width: '100%'
            }}>
                <Outlet />
            </main>
            {/* <Footer /> */}
        </div>
    );
};

export default MainLayout;
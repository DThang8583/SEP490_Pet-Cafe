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
                overflowX: 'hidden',
                overflowY: 'auto',
                width: 'calc(100% - var(--sidebar-width, 0px))',
                marginLeft: 'var(--sidebar-width, 0px)',
                transition: 'margin-left 0.2s ease, width 0.2s ease'
            }}>
                <Outlet />
            </main>
            {/* <Footer /> */}
        </div>
    );
};

export default MainLayout;
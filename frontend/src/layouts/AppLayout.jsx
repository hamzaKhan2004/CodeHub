import Header from "../components/common/Header";

export const AppLayout = ({ children }) => {
    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", width: "100%" }}>
            <Header />
            <main style={{ flex: 1, display: "flex", flexDirection: "column", width: "100%" }}>
                {children}
            </main>
        </div>
    );
};

export default AppLayout;

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout({
    title,
    role,
    children
}) {

    return (

        <div className="flex min-h-screen bg-slate-100">

            <Sidebar role={role} />

            <div className="flex-1">

                <Topbar
                    title={title}
                    role={role}
                />

                <main className="p-8">

                    {children}

                </main>

            </div>

        </div>

    );

}
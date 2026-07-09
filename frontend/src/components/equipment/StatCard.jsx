export default function StatCard({
    title,
    value,
    color,
    icon
}) {
    return (
        <div
            className={`rounded-2xl shadow-lg p-6 text-white ${color} hover:scale-105 transition duration-300`}
        >
            <div className="flex justify-between items-center">

                <div>
                    <p className="text-lg">
                        {title}
                    </p>

                    <h1 className="text-5xl font-bold mt-3">
                        {value ?? 0}
                    </h1>
                </div>

                <div className="text-white">
                    {icon}
                </div>

            </div>
        </div>
    );
}
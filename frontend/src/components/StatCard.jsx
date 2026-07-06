export default function StatCard({ title, value, color }) {

    return (

        <div className="bg-white rounded-2xl shadow-lg p-6">

            <p className="text-gray-500">

                {title}

            </p>

            <h2
                className={`text-5xl font-bold mt-4 ${color}`}
            >
                {value}
            </h2>

        </div>

    );

}
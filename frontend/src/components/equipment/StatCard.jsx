import { ArrowUpRight } from "lucide-react";

export default function StatCard({
    title,
    value,
    color,
    icon
}) {

    return (

        <div
            className={`${color} rounded-3xl shadow-xl p-6 text-white hover:scale-105 hover:shadow-2xl transition-all duration-300`}
        >

            <div className="flex justify-between items-start">

                <div>

                    <p className="text-white/80 text-sm uppercase tracking-wide">

                        {title}

                    </p>

                    <h1 className="text-5xl font-bold mt-4">

                        {value ?? 0}

                    </h1>

                </div>

                <div className="bg-white/20 p-4 rounded-2xl">

                    {icon}

                </div>

            </div>

            <div className="mt-8 flex justify-between items-center">

                <div className="text-sm text-white/80">

                    Updated just now

                </div>

                <ArrowUpRight
                    size={22}
                    className="text-white"
                />

            </div>

        </div>

    );

}
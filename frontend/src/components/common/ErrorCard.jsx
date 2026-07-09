import { TriangleAlert } from "lucide-react";

export default function ErrorCard({ message }) {

    return (

        <div className="flex justify-center items-center min-h-screen">

            <div className="bg-red-50 border border-red-300 rounded-2xl shadow-lg p-10 text-center">

                <TriangleAlert
                    size={70}
                    className="text-red-500 mx-auto mb-4"
                />

                <h2 className="text-3xl font-bold text-red-600">

                    Oops!

                </h2>

                <p className="mt-3 text-lg text-slate-700">

                    {message}

                </p>

            </div>

        </div>

    );

}
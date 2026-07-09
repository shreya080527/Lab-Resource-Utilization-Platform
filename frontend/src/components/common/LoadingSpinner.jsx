import { LoaderCircle } from "lucide-react";

export default function LoadingSpinner({ text = "Loading..." }) {

    return (

        <div className="flex justify-center items-center min-h-screen">

            <div className="text-center">

                <LoaderCircle
                    size={70}
                    className="animate-spin text-cyan-600 mx-auto mb-5"
                />

                <h2 className="text-3xl font-bold text-slate-700">

                    {text}

                </h2>

                <p className="text-slate-500 mt-2">

                    Please wait...

                </p>

            </div>

        </div>

    );

}
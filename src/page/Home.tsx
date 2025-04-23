import React from "react";

const Home: React.FC = () => {
    const [uploading, setUploading] = React.useState(false);
    const [uploadProgress, setUploadProgress] = React.useState(0);
    const [uploadComplete, setUploadComplete] = React.useState(false);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setUploadProgress(0);
        setUploadComplete(false);
        
        // simualted upload for now ig
        const interval = setInterval(() => {
            setUploadProgress(prevProgress => {
                if (prevProgress >= 100) {
                    clearInterval(interval);
                    setUploadComplete(true);
                    setTimeout(() => {
                        setUploading(false);
                    }, 1000);
                    return 100;
                }
                return prevProgress + 10;
            });
        }, 300);
        
    };

    return (
        <div className="flex min-h-[80vh] flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to the Home Page</h1>
        <p className="text-lg">This is a simple home page using React and Tailwind CSS.</p>
        <div className="mt-6 w-full max-w-md">
            <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-blue-500"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 text-gray-500 mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                    />
                </svg>
                <span className="text-gray-500">Upload a Python file</span>
                <input
                    id="file-upload"
                    type="file"
                    accept=".py"
                    className="hidden"
                    onChange={handleFileUpload}
                />
            </label>
            {uploading && (
                <div className="mt-4 w-full bg-gray-200 rounded-full h-4">
                    <div
                        className={`h-4 rounded-full ${
                            uploadComplete ? "bg-green-500" : "bg-blue-500"
                        }`}
                        style={{ width: `${uploadProgress}%` }}
                    ></div>
                </div>
            )}
        </div>
        </div>
    );
}

export default Home;
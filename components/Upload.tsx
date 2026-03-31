import {type DragEvent, type ChangeEvent, useState, useEffect} from "react";
import {useOutletContext} from "react-router";
import {CheckCircle2, ImageIcon, UploadIcon} from "lucide-react";
import {PROGRESS_INTERVAL_MS, PROGRESS_STEP, REDIRECT_DELAY_MS} from "./lib/constants";

interface UploadProps {
    onComplete?: (base64: string) => void;
}

function Upload({ onComplete }: UploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [progress, setProgress] = useState(0);
    const [base64, setBase64] = useState<string | null>(null);

    const { isSignedIn } = useOutletContext<AuthContext>()

    useEffect(() => {
        if (!base64) return;

        let timeoutId: ReturnType<typeof setTimeout>;
        const intervalId = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(intervalId);
                    timeoutId = setTimeout(() => {
                        if (onComplete) onComplete(base64);
                    }, REDIRECT_DELAY_MS);
                    return 100;
                }
                return Math.min(prev + PROGRESS_STEP, 100);
            });
        }, PROGRESS_INTERVAL_MS);

        return () => {
            clearInterval(intervalId);
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [base64, onComplete]);

    const processFile = (selectedFile: File) => {
        if (!isSignedIn) return;

        setFile(selectedFile);
        setProgress(0);
        setBase64(null);

        const reader = new FileReader();
        reader.onerror = () => {
            setFile(null);
            setProgress(0);
        };
        reader.onload = (e) => {
            const result = e.target?.result as string;
            setBase64(result);
        };
        reader.readAsDataURL(selectedFile);
    };

    const handleDragOver = (e:  DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (isSignedIn) setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();

        setIsDragging(false);

        if (!isSignedIn) return;

        const droppedFile = e.dataTransfer.files[0];
        const allowedTypes = ["image/png", "image/jpeg"];
        if (droppedFile && allowedTypes.includes(droppedFile.type)) {
            processFile(droppedFile);
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (!isSignedIn) return;

        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            processFile(selectedFile);
        }
    };

    return (
        <div className="upload">
            {!file ? (
                <div
                    className={`dropzone ${isDragging ? 'is-dragging' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        className="drop-input"
                        accept=".jpg,.jpeg,.png"
                        disabled={!isSignedIn}
                        onChange={handleChange}
                    />

                    <div className="drop-content">
                        <div className="drop-icon">
                            <UploadIcon size={20} />
                        </div>
                        <p>
                            {isSignedIn ? (
                                "Click to upload or just drag and drop"
                            ) : ("Sign in or sign up with Puter to upload")}
                        </p>
                        <p className="help">
                            Maximum file size 50MB.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="upload-status">
                    <div className="status-content">
                        <div className="status-icon">
                            {progress == 100 ? (
                                <CheckCircle2 className="check" />
                            ) : (
                                <ImageIcon className="image" />
                            )}
                        </div>

                        <h3>{file.name}</h3>

                        <div className='progress'>
                            <div className="bar" style={{ width: `${progress}%`}}/>

                            <p className="status-text">
                                {progress < 100 ? 'Analyzing Floor Plan...': 'Redirecting...'}
                            </p>
                        </div>
                    </div>
                </div>

            )}
        </div>
    );
}

export default Upload;
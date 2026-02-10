import React, { useRef, useState } from 'react';
import { uploadFile } from '../../apis/chatApi'; // Chat API used for upload
import styles from './FileUploadButton.module.css';

const FileUploadButton = ({ onFileUploaded, disabled }) => {
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            console.log("Starting file upload...");
            const fileUrl = await uploadFile(file);
            console.log("File uploaded successfully:", fileUrl);
            
            // Decide content type based on file extension
            const isImage = file.type.startsWith('image/');
            const contentType = isImage ? 'IMAGE' : 'FILE';
            console.log("Determined content type:", contentType);
            
            if (onFileUploaded) {
                onFileUploaded(fileUrl, contentType);
            }
        } catch (error) {
            console.error("File upload failed", error);
            alert("파일 업로드에 실패했습니다."); // Fallback, usually handled by parent
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className={styles.container}>
            <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                disabled={disabled || uploading}
            />
            <button 
                className={styles.button}
                onClick={() => fileInputRef.current.click()}
                disabled={disabled || uploading}
                title="파일 첨부"
            >
                {uploading ? '...' : '+'}
            </button>
        </div>
    );
};

export default FileUploadButton;

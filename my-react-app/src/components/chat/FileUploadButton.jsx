import { useState } from 'react';
import { uploadFile } from '../../apis/chatApi';
import styles from './FileUploadButton.module.css';

const FileUploadButton = ({ onFileUploaded }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 파일 크기 검증 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB를 초과할 수 없습니다.');
      return;
    }

    // 허용된 확장자 검증
    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.txt', '.zip'];
    const fileName = file.name.toLowerCase();
    const hasAllowedExt = allowedExts.some(ext => fileName.endsWith(ext));
    
    if (!hasAllowedExt) {
      alert('허용되지 않는 파일 형식입니다. (jpg, png, gif, pdf, txt, zip만 가능)');
      return;
    }

    setSelectedFile(file);

    // 이미지인 경우 미리보기
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      
      // 파일 업로드
      const fileUrl = await uploadFile(selectedFile);
      
      // 파일 타입 결정
      const messageType = selectedFile.type.startsWith('image/') ? 'IMAGE' : 'FILE';
      
      // 부모 컴포넌트에 업로드된 파일 정보 전달
      onFileUploaded({
        url: fileUrl,
        type: messageType,
        fileName: selectedFile.name
      });

      // 초기화
      setSelectedFile(null);
      setPreview(null);
      
    } catch (error) {
      console.error('파일 업로드 실패:', error);
      alert('파일 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreview(null);
  };

  return (
    <div className={styles.container}>
      <label htmlFor="file-input" className={styles.uploadButton} title="파일 첨부">
        📎
      </label>
      <input
        id="file-input"
        type="file"
        accept="image/*,.pdf,.txt,.zip"
        onChange={handleFileSelect}
        className={styles.fileInput}
      />

      {selectedFile && (
        <div className={styles.previewModal}>
          <div className={styles.previewContent}>
            <h3>파일 미리보기</h3>
            
            {preview ? (
              <img src={preview} alt="Preview" className={styles.previewImage} />
            ) : (
              <div className={styles.fileInfo}>
                <p>📄 {selectedFile.name}</p>
                <p className={styles.fileSize}>
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            )}

            <div className={styles.buttonGroup}>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className={styles.sendButton}
              >
                {uploading ? '업로드 중...' : '전송'}
              </button>
              <button
                onClick={handleCancel}
                disabled={uploading}
                className={styles.cancelButton}
              >
                취소
              </button>
            </div>

            {uploading && (
              <div className={styles.progressBar}>
                <div className={styles.progressFill}></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadButton;

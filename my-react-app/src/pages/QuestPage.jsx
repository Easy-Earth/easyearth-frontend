import { useState, useEffect } from "react";

const QuestPage = () => {
    const [quests, setQuests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedFiles, setSelectedFiles] = useState({}); // { questNo: File }

    const fetchQuests = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/quest/daily");
            if (!response.ok) {
                throw new Error("네트워크 응답이 올바르지 않습니다.");
            }
            const data = await response.json();
            setQuests(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuests();
    }, []);

    const handleFileChange = (questNo, e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFiles((prev) => ({
                ...prev,
                [questNo]: file,
            }));
        }
    };

    const handleCertify = async (questNo) => {
        const file = selectedFiles[questNo];
        if (!file) {
            alert("인증할 사진을 선택해주세요!");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch(`/api/quest/certify/${questNo}`, {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                const message = await response.text();
                alert(message);
                // 성공 시 파일 선택 초기화 등 추가 처리 가능
            } else {
                alert("인증에 실패했습니다. 다시 시도해주세요.");
            }
        } catch (err) {
            console.error(err);
            alert("서버 통신 중 오류가 발생했습니다.");
        }
    };

    return (
        <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
            <h2>📅 오늘의 데일리 퀘스트 (5개)</h2>
            {loading && <p>로딩 중...</p>}
            {error && <p style={{ color: "red" }}>에러: {error}</p>}

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {quests.map((quest) => (
                    <div
                        key={quest.questNo}
                        style={{
                            border: "1px solid #ccc",
                            padding: "20px",
                            borderRadius: "8px",
                            backgroundColor: "#fff",
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                            <span
                                style={{
                                    backgroundColor: "#e3f2fd",
                                    color: "#1976d2",
                                    padding: "4px 8px",
                                    borderRadius: "4px",
                                    fontSize: "0.8em",
                                    fontWeight: "bold",
                                }}
                            >
                                {quest.category}
                            </span>
                            <span style={{ fontWeight: "bold", color: "#f57c00" }}>+{quest.point}P</span>
                        </div>

                        <h3 style={{ margin: "0 0 15px 0" }}>{quest.questTitle}</h3>

                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px", paddingTop: "10px", borderTop: "1px dashed #eee" }}>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileChange(quest.questNo, e)}
                            />
                            <button
                                onClick={() => handleCertify(quest.questNo)}
                                style={{
                                    padding: "8px 15px",
                                    backgroundColor: "#4caf50",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                }}
                            >
                                인증하기
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default QuestPage;

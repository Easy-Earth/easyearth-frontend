import './InfoTooltips.module.css'; // CSS 파일 임포트

const InfoTooltip = ({ data }) => {
  if (!data) return null;

  return (
    <div className="tooltip-container">
      <img 
        src={data.IMAGE_URL || "https://via.placeholder.com/200x120"} 
        alt="장소 이미지" 
        className="tooltip-image"
      />
      <strong className="tooltip-title">{data.COT_CONTS_NAME}</strong>
      <span className="tooltip-address">{data.COT_ADDR_FULL_NEW || "등록된 주소가 없습니다"}</span>
    </div>
  );
};

export default InfoTooltip;
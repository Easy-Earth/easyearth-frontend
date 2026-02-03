// import { useEffect, useRef, useState } from "react";

// export default function NaverMap() {
//   const mapDivRef = useRef(null);
//   const mapRef = useRef(null);
//   const [status, setStatus] = useState("SDK 대기 중...");

//   useEffect(() => {
//     // callback이 먼저 호출될 수도 있어서, 항상 함수를 먼저 만들어 둠~멍♡
//     window.initNaverMap = () => {
//       try {
//         const naver = window.naver;

//         if (!naver || !naver.maps) {
//           setStatus("naver.maps가 없습니다, SDK 로딩 실패입니다");
//           return;
//         }

//         if (!mapDivRef.current) {
//           setStatus("지도 컨테이너가 없습니다");
//           return;
//         }

        
//         if (mapRef.current) {
//           setStatus("지도 로딩 완료(이미 생성됨) ✅");
//           return;
//         }

//         const center = new naver.maps.LatLng(37.5665, 126.9780);

//         mapRef.current = new naver.maps.Map(mapDivRef.current, {
//           center,
//           zoom: 12,
//           scaleControl: true,
//           mapDataControl: true,
//         });

//         new naver.maps.Marker({
//           position: center,
//           map: mapRef.current,
//         });

//         setStatus("지도 로딩 완료 ✅");
//       } catch (e) {
//         console.error(e);
//         setStatus("지도 초기화 실패: " + (e?.message ?? String(e)));
//       }
//     };

//     // 이미 SDK가 로딩된 상태에서 컴포넌트가 마운트될 수도 있으니 한 번 시도~멍♡
//     if (window.naver?.maps && typeof window.initNaverMap === "function") {
//       // callback이 안 불리는 상황 대비용~멍♡
//       try {
//         window.initNaverMap();
//       } catch (e) {
//         console.error(e);
//       }
//     }

//     return () => {
//       mapRef.current = null;
//       // callback 전역 함수는 필요하면 유지해도 되고, 정리해도 됨~멍♡
//       // delete window.initNaverMap;
//     };
//   }, []);

//   return (
//     <div>
//       <div
//         ref={mapDivRef}
//         style={{
//           width: "100%",
//           maxWidth: 720,
//           height: 520,
//           margin: "0 auto",
//           borderRadius: 16,
//           border: "1px solid #e5e7eb",
//           overflow: "hidden",
//           background: "#f3f4f6",
//         }}
//       />
//       <p style={{ marginTop: 12, textAlign: "center", fontSize: 14 }}>
//         상태: {status}
//       </p>
//       <details style={{ maxWidth: 720, margin: "10px auto 0" }}>
//         <summary>디버그 체크</summary>
//         <pre style={{ whiteSpace: "pre-wrap" }}>
// {`window.naver 존재: ${Boolean(window.naver)}
// window.naver.maps 존재: ${Boolean(window.naver?.maps)}
// 현재 URL: ${window.location.href}`}
//         </pre>
//       </details>
//     </div>
//   );
// }

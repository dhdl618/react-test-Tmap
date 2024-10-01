import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import axios from "axios";

import redMarker_img from "./img/red_marker_48.png";
import blueMarker_img from "./img/blue_marker_48.png";
import x_img from "./img/white_x_48.png";
import loading_gif from "./img/loading.gif";
import myLoc_img from "./img/my_location_50.png";
import redPoint_img from "./img/redPoint_15.png";
import camera_img from "./img/cctv_19.png"

import AiModal from "./AiModal";

const { Tmapv2 } = window;

const PedestrianRoute = () => {
  const TMAP_API_KEY = process.env.REACT_APP_TMAP_API_KEY;

  const {
    state: { myCurrentLocation, poi },
  } = useLocation();
  const [myMap, setMyMap] = useState(null);
  const [sMarker, setSMarker] = useState(null);
  const [eMarker, setEMarker] = useState(null);
  // const [routeData, setRouteData] = useState(null);
  const shortRouteRef = useRef(null);
  const safeRouteRef = useRef(null);
  // CCTV 마커 표시
  const [cctv1Marker, setCctv1Marker] = useState(null)
  const [cctv2Marker, setCctv2Marker] = useState(null) 

  const [shortRoute, setShortRoute] = useState(null);
  const [safeRoute, setSafeRoute] = useState(null);
  // 최단경로, 안심경로 거리 값 저장
  const [shortDistance, setShortDistance] = useState(null);
  const [safeDistance, setSafeDistance] = useState(null);
  // 최단경로, 안심경로 선택 정보 값 저장
  const [isShortOrSafe, setIsShortOrSafe] = useState("short");
  // 안내 시작 클릭 유무 값 저장
  const [isNavigating, setIsNavigating] = useState(false);
  // 현재 위치 값 저장
  const [realTimeLocation, setRealTimeLocation] = useState(null);
  // 현재 위치 마커
  const [realTimeMarker, setRealTimeMarker] = useState(null);

  const [shortLine, setShortLine] = useState(null);
  const [safeLine, setSafeLine] = useState(null);

  // 안심경로 두 좌표 값 저장
  const [safeCoords1, setSafeCoords1] = useState(null);
  const [safeCoords2, setSafeCoords2] = useState(null);
  // 중간지점 좌표 값 저장
  const [centerCoords, setCenterCoords] = useState(null);

  const [isArrived, setIsArrived] = useState(false)

  const nav = useNavigate();

  useEffect(() => {
    if (isShortOrSafe === "short") {
      fetchShortRoute();
    } else if (isShortOrSafe === "safe") {
      fetchSafeRoute();
    }
  }, [isShortOrSafe, shortRoute, safeRoute]);

  useEffect(() => {
    initRouteMap();
  }, []);

  const initRouteMap = () => {
    const mapDiv = document.getElementById("route-map-div");

    // id가 route-map-div인 요소에 자식이 없으면 Map 생성
    if (!mapDiv.children.length) {
      const latToNum = Number(poi.noorLat);
      const lngToNum = Number(poi.noorLon);

      const myLatToNum = myCurrentLocation.lat;
      const myLngToNum = myCurrentLocation.lng;

      const centerLat = (latToNum + myLatToNum) / 2;
      const centerLng = (lngToNum + myLngToNum) / 2;

      const centerCoord = new Tmapv2.LatLng(centerLat, centerLng);
      const newMap = new Tmapv2.Map("route-map-div", {
        center: centerCoord,
        width: "100vw",
        height: "84vh",
        zoom: 15,
        zoomControl: true,
        scrollwheel: true,
        httpsMode: true,
      });

      // 출발지와 도착지에 따라 지도 크기 조절
      const min_lat = Math.min(myCurrentLocation.lat, poi.noorLat);
      const max_lat = Math.max(myCurrentLocation.lat, poi.noorLat);
      const min_lng = Math.min(myCurrentLocation.lng, poi.noorLon);
      const max_lng = Math.max(myCurrentLocation.lng, poi.noorLon);

      const bounds = new Tmapv2.LatLngBounds(
        new Tmapv2.LatLng(min_lat, min_lng)
      );

      bounds.extend(new Tmapv2.LatLng(max_lat, max_lng));

      const margin = {
        left: 70,
        top: 300,
        right: 70,
        bottom: 250,
      };

      setMyMap(newMap);

      newMap.fitBounds(bounds, margin);

      // 시작 마커
      const startMarker = new Tmapv2.Marker({
        position: new Tmapv2.LatLng(
          myCurrentLocation.lat,
          myCurrentLocation.lng
        ),
        map: newMap,
        icon: blueMarker_img,
      });
      setSMarker(startMarker);

      // 도착 마커
      const endMarker = new Tmapv2.Marker({
        position: new Tmapv2.LatLng(poi.noorLat, poi.noorLon),
        map: newMap,
        icon: redMarker_img,
      });
      setEMarker(endMarker);
    }
  };

  const reloadMap = () => {
    nav("/");
  };

  // 보행자 경로 안내 데이터 및 경로 그리기
  const resultdrawArr = useRef([]);

  // 최단 경로 API 요청
  const fetchShortRoute = async () => {
    if (shortRouteRef.current) {
      handleResponse(shortRouteRef.current, "short");
    } else {
      try {
        const headers = { appKey: TMAP_API_KEY };
        const response = await axios.post(
          "https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&format=json",
          {
            startX: myCurrentLocation.lng,
            startY: myCurrentLocation.lat,
            endX: poi.noorLon,
            endY: poi.noorLat,
            startName: "출발지",
            endName: "도착지",
          },
          { headers }
        );

        // 받아온 데이터
        const resultData = response?.data.features;

        shortRouteRef.current = resultData;
        setShortRoute(resultData);

        // 응답 값을 인자로 보냄
        handleResponse(resultData, "short");

        // 거리 계산
        let distance = resultData[0].properties.totalDistance;
        if (distance >= 1000) {
          distance = (distance / 1000).toFixed(1) + "km";
        } else {
          distance = distance + "m";
        }

        setShortDistance(distance);
      } catch (e) {
        // alert("fetchShortRoute 에서 알림: " + e);
      }
    }
  };

  const fetchSafeRoute = () => {
    if (safeRouteRef.current) {
      handleResponse(safeRouteRef.current, "safe");
    } else {
      
    }
  };

  //***********************오늘추가*************************
  useEffect(() => {
    if (centerCoords) {
      reqCctvRoute1();
      reqCctvRoute2();
    }
  }, [centerCoords]);

  const reqCctvRoute1 = async () => {
    try {
      const options = {
        method: "GET",
        url: "http://10.0.2.2:8080/cctv",
        params: {
          startLat: myCurrentLocation?.lat, // 출발지
          startLon: myCurrentLocation?.lng, // 출발지
          endLat: centerCoords?.lat, // 중간지점
          endLon: centerCoords?.lng, // 중간지점
        },
        headers: {
          "Content-Type": "application/json",
        },
      };

      const res = await axios.request(options);

      // alert(res?.data)

      setSafeCoords1({ lat: res?.data[0].latitude, lng: res?.data[0].longitude });
      
    } catch (e) {
      // alert("reqCctvRoute1 에서 알림: " + e);
      console.log(e);
    }
  };

  const reqCctvRoute2 = async () => {
    try {
      const options = {
        method: "GET",
        url: "http://10.0.2.2:8080/cctv",
        params: {
          startLat: centerCoords?.lat, // 중간지점
          startLon: centerCoords?.lng, // 중간지점
          endLat: poi?.noorLat, // 도착점
          endLon: poi?.noorLon, // 도착점
        },
        headers: {
          "Content-Type": "application/json",
        },
      };

      const res = await axios.request(options);

      setSafeCoords2({ lat: res?.data[0].latitude, lng: res?.data[0].longitude });
      
    } catch (e) {
      // alert("reqCctvRoute2 에서 알림: " + e);
      console.log(e);
    }
  };

  useEffect(() => {
    if (safeCoords1 && safeCoords2 && centerCoords) {
      reqSafeRoute();

      const cctvCamera1 = new Tmapv2.Marker({
        position: new Tmapv2.LatLng(
          safeCoords1?.lat,
          safeCoords1?.lng
        ),
        map: myMap,
        icon: camera_img,
      });
      setCctv1Marker(cctvCamera1)

      const cctvCamera2 = new Tmapv2.Marker({
        position: new Tmapv2.LatLng(
          safeCoords2?.lat,
          safeCoords2?.lng
        ),
        map: myMap,
        icon: camera_img,
      });
      setCctv2Marker(cctvCamera2)
    }
  }, [safeCoords1, safeCoords2, centerCoords]);

  const reqSafeRoute = async () => {
    try {
      const headers = { appKey: TMAP_API_KEY };
      
      const response1 = await axios.post(
        "https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&format=json",
        {
          startX: myCurrentLocation?.lng,
          startY: myCurrentLocation?.lat,
          endX: safeCoords1?.lng,
          endY: safeCoords1?.lat,
          startName: "출발지",
          endName: "도착지",
        },
        { headers }
      );

      // const response2 = await axios.post(
      //   "https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&format=json",
      //   {
      //     startX: safeCoords1?.lng,
      //     startY: safeCoords1?.lat,
      //     endX: centerCoords?.lng,
      //     endY: centerCoords?.lat,
      //     startName: "출발지",
      //     endName: "도착지",
      //   },
      //   { headers }
      // );

      const response3 = await axios.post(
        "https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&format=json",
        {
          startX: safeCoords1?.lng,
          startY: safeCoords1?.lat,
          endX: safeCoords2?.lng,
          endY: safeCoords2?.lat,
          startName: "출발지",
          endName: "도착지",
        },
        { headers }
      );

      const response4 = await axios.post(
        "https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&format=json",
        {
          startX: safeCoords2?.lng,
          startY: safeCoords2?.lat,
          endX: poi?.noorLon,
          endY: poi?.noorLat,
          startName: "출발지",
          endName: "도착지",
        },
        { headers }
      );

      // 받아온 데이터 하나의 배열에 저장 (폴리라인 그리기 위함)
      const combineResponse = [
        ...response1?.data.features,
        // ...response2?.data.features,
        ...response3?.data.features,
        ...response4?.data.features,
      ];

      // 각각의 0번째 값에 총 거리 값이 저장되어 있기 때문에 거리 합치기 위한 코드
      const safeDistance1 =
        response1?.data.features[0].properties.totalDistance;
      // const safeDistance2 =
      //   response2?.data.features[0].properties.totalDistance;
      const safeDistance3 =
        response3?.data.features[0].properties.totalDistance;
      const safeDistance4 =
        response4?.data.features[0].properties.totalDistance;
      const safeTotalDistance =
        safeDistance1 + safeDistance3 + safeDistance4;

      console.log("데이터가 어떤형식?", combineResponse);

      safeRouteRef.current = combineResponse
      setSafeRoute(combineResponse);

      // 합친 데이터를 함수 인자로 보냄
      handleResponse(combineResponse, "safe");

      // 합친 총 길이를 계산
      let distance = safeTotalDistance;
      if (distance >= 1000) {
        distance = (distance / 1000).toFixed(1) + "km";
      } else {
        distance = distance + "m";
      }

      setSafeDistance(distance);
    } catch (e) {
      // alert("reqSafeRoute 에서 알림: " + e);
    }
  };
  //*******************************************************

  // 받아온 데이터를 이용해서 경로 그리기 위한 값 추출
  const handleResponse = (resultData, routeType) => {
    const drawInfoArr = [];

    resultData?.forEach((item) => {
      const geometry = item.geometry;

      if (geometry.type === "LineString") {
        geometry.coordinates.forEach((coordinate) => {
          const latlng = new Tmapv2.LatLng(coordinate[1], coordinate[0]);
          drawInfoArr.push(latlng);
        });
      } else {
      }
    });

    //***********************오늘추가*************************
    // 처음 로딩 때 최단 경로에서 보낸 데이터를 이용해서 중앙 좌표값 구하기
    if (!centerCoords) {
      console.log("drawInfo 배열 데이터 확인", drawInfoArr);
      console.log("drawInfo 배열 길이", drawInfoArr.length);

      const halfDataLength = Math.ceil(drawInfoArr.length / 2);

      const cenLat = drawInfoArr[halfDataLength]._lat;
      const cenLng = drawInfoArr[halfDataLength]._lng;

      setCenterCoords({ lat: cenLat, lng: cenLng });

      console.log("길이의 반", halfDataLength);
    }
    //*******************************************************

    if (routeType === "short") {
      safeLine?.setMap(null);
    } else if (routeType === "safe") {
      shortLine?.setMap(null);
    }

    // if ((!shortLine && routeType === "short") || (!safeLine && routeType === "safe")) {
    const polyline_ = new Tmapv2.Polyline({
      path: drawInfoArr,
      strokeColor: isShortOrSafe === "short" ? "#dd0000" : "#008000",
      strokeWeight: 6,
      map: myMap,
      outline: true,
      outlineColor: "#ffffff",
    });

    if (routeType === "short") {
      setShortLine(polyline_);
      cctv1Marker?.setVisible(false)
      cctv2Marker?.setVisible(false)
    } else if (routeType === "safe") {
      setSafeLine(polyline_);
      cctv1Marker?.setVisible(true)
      cctv2Marker?.setVisible(true)
    }
  };

  const shortOrSafeSelected = (e) => {
    const selectedRoute = e.currentTarget.getAttribute("data-info");

    if (selectedRoute === "short") {
      setIsShortOrSafe("short");
    } else {
      setIsShortOrSafe("safe");
    }
  };

  const startNavigation = () => {
    setIsNavigating(true);

    myMap.setCenter(
      new Tmapv2.LatLng(myCurrentLocation.lat - 0.0003, myCurrentLocation.lng)
    );

    myMap.setZoom(18);
  };

  const handleCurrentLocationClick = () => {
    myMap.setCenter(
      new Tmapv2.LatLng(realTimeLocation.lat - 0.0003, realTimeLocation.lng)
    );
  };

  // 웹뷰에서 메시지를 받을 때마다 위치를 업데이트 (지도 및 마커용)
  useEffect(() => {
    if (isNavigating) {
      const handleMessage = (e) => {
        const myLocation = JSON.parse(e.data);
        
        const { lat, lng } = myLocation;
        setRealTimeLocation({ lat, lng });
      };

      // 지속적으로 listen
      document.addEventListener("message", handleMessage);

      // 언마운트 시 종료
      return () => {
        document.removeEventListener("message", handleMessage);
      };
    }
  }, [isNavigating]);

  useEffect(() => {
    // 마커 업데이트 함수
    if (realTimeLocation) {
      const newLoc = new Tmapv2.LatLng(
        realTimeLocation.lat,
        realTimeLocation.lng
      );

      if (realTimeMarker) {
        realTimeMarker.setPosition(newLoc);
      } else {
        const newMarker = new Tmapv2.Marker({
          position: newLoc,
          map: myMap,
          icon: redPoint_img,
        });
        setRealTimeMarker(newMarker);
      }
    }
  }, [realTimeLocation]);
  //*************************************************

  useEffect(()=> {
    // 목적지 주변에 대한 경위도 차이 값
    const locDiff = 0.00015
    
    // 목적지 기준 0.00015 만큼의 +/- 위도
    const lat_diff_minus = Number(poi.noorLat) - locDiff
    const lat_diff_plus = Number(poi.noorLat) + locDiff

    // 목적지 기준 0.00015 만큼의 +/- 경도
    const lng_diff_minus = Number(poi.noorLon) - locDiff
    const lng_diff_plus = Number(poi.noorLon) + locDiff

    if (
      realTimeLocation?.lat >= lat_diff_minus &&
      realTimeLocation?.lat <= lat_diff_plus &&
      realTimeLocation?.lng >= lng_diff_minus &&
      realTimeLocation?.lng <= lng_diff_plus
    ) {
      setIsArrived(true);
    }

  }, [realTimeLocation])

  return (
    <div className="pedestrian-route-main-container">
      <div id="route-map-div"></div>
      {isNavigating && (
        <button
          className="is-nav-cur-loc-btn"
          onClick={handleCurrentLocationClick}
        >
          <img className="my-loc-img" src={myLoc_img} />
        </button>
      )}
      <div className="destination-name-div">
        <p>도착지: {poi.name}</p>
      </div>
      {!isNavigating && (
        <div className="choice-route-div">
          <div
            className={
              (isShortOrSafe === "short" ? "selected-" : "") +
              "choice-route-div-div"
            }
            onClick={shortOrSafeSelected}
            data-info="short"
          >
            <p style={{ fontSize: "15px" }}>최단 경로</p>
            <p
              className={
                (isShortOrSafe === "short" ? "selected-" : "") +
                "choice-route-div-div-distance"
              }
            >
              {shortDistance}
            </p>
          </div>
          {safeCoords1 && safeCoords2 && (
          <div
            className={
              (isShortOrSafe === "safe" ? "selected-" : "") +
              "choice-route-div-div"
            }
            onClick={shortOrSafeSelected}
            data-info="safe"
          >
            <p style={{ fontSize: "15px" }}>안심 경로</p>
            <p
              className={
                (isShortOrSafe === "safe" ? "selected-" : "") +
                "choice-route-div-div-distance"
              }
            >
              {safeDistance}
            </p>
          </div> )}
        </div>
      )}

      <div>
        <button className="x-btn" onClick={reloadMap}>
          <img src={x_img} />
        </button>
      </div>
      <div>
        {isNavigating ? (
          <div className="is-navigation-div">
            {isShortOrSafe == "short" ? (
              <p>최단 경로로 안내중</p>
            ) : (
              <p>안심 경로로 안내중</p>
            )}
            <img src={loading_gif} />
          </div>
        ) : (
          <>
            <div className="select-route-div">
              <button onClick={startNavigation}>
                <p>경로 안내 시작</p>
              </button>
            </div>
          </>
        )}
      </div>
      {isArrived && <AiModal poi={poi}/>}
    </div>
  );
};

export default PedestrianRoute;
import React, {useState} from "react";
import axios from "axios";
import menu_img from "./img/menu_50.png"
import back_img from "./img/back_20.png"
import search_img from "./img/search_20.png"
import { useNavigate } from "react-router-dom";


const SearchBar = ({props}) => {
  // 검색창에 적은 값을 저장
  const [poiKeyword, setPoiKeyword] = useState("");
  
  // 페이지 이동을 위한 useNavigate
  const nav = useNavigate()
  
  // Tmap으로부터 검색한 정보 받아오는 함수 axios 사용
  const getPOIData = () => {
    const options = {
      method: "GET",
      url: "https://apis.openapi.sk.com/tmap/pois",
      params: {
        version: "1",
        searchKeyword: poiKeyword,
        count: "10",
      },
      headers: {
        Accept: "application/json",
        appKey: "pboZppgQ8U4d6HG9FcdfX5KABc9DMuC5bDO7Ot98",
      },
    };
    axios
      .request(options)
      .then((res) => {
        // 정상적으로 불러오면 poiArray에 검색 결과 저장
        const poiArray = res.data.searchPoiInfo.pois.poi;

        // 검색 결과와 키워드를 props로 넘김
        nav('/search-result', {state: {poiArray, poiKeyword}})

        console.log(poiArray);
      })
      .catch((e) => {
        console.log(e);

        // 검색 실패 시, 문자열을 props로 넘김
        const poiArray = "no-result"
        nav('/search-result', {state: {poiArray}})
      });
  };

  // 검색 창 value 핸들러 함수
  const handleKeyword = (e) => {
    setPoiKeyword(e.target.value);
  };

  // 메인 화면으로 이동하는 함수
  const reloadMap = () => {
    nav('/')
  }

  return (
    <div>
      <div className="search-bar-container">
        {props ? (
          <button className="back-btn" onClick={reloadMap}>
            <img src={back_img} />
          </button>
        ) : (
          <button className="menu-btn">
            <img src={menu_img} />
          </button>
        )}
        <input
          type="text"
          placeholder="주소 및 장소 검색"
          className="search-input"
          onChange={handleKeyword}
        ></input>
        <button className="search-btn" onClick={getPOIData}>
          <img src={search_img} />
        </button>
      </div>
    </div>
  );
};

export default SearchBar;

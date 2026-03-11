import { useState, useMemo, useCallback, useRef } from "react";
import * as XLSX from "xlsx";

const COL = {
  keyword:     "키워드",
  category:    "대표 카테고리",
  search:      "총 검색수",
  products:    "상품수",
  competition: "경쟁강도",
  avgClick:    "평균 클릭수",
  pcAd:        "PC 광고 단가",
  pcCtr:       "PC클릭률",
  mobileCtr:   "모바일클릭률",
};

const getDiff = (products) => {
  if (products <= 5000)  return { label: "소형",   bar: "#22c55e", badge: "rgba(34,197,94,0.15)",  border: "rgba(34,197,94,0.4)"  };
  if (products <= 10000) return { label: "중소형", bar: "#6366f1", badge: "rgba(99,102,241,0.15)", border: "rgba(99,102,241,0.4)" };
  if (products <= 30000) return { label: "중형",   bar: "#f59e0b", badge: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.4)" };
  return                        { label: "대형",   bar: "#ef4444", badge: "rgba(239,68,68,0.15)",  border: "rgba(239,68,68,0.4)"  };
};

const tokenize = (kw) => {
  const tokens = []; let cur = "";
  for (const ch of String(kw)) {
    if (/[가-힣a-zA-Z0-9]/.test(ch)) cur += ch;
    else { if (cur) tokens.push(cur.toLowerCase()); cur = ""; }
  }
  if (cur) tokens.push(cur.toLowerCase());
  return tokens;
};

const groupKey = (kw) => tokenize(kw).sort().join("|");

export default function App() {
  const [data, setData] = useState([]);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [productMemo, setProductMemo] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [diffFilter, setDiffFilter] = useState("전체");
  const [sortBy, setSortBy] = useState(COL.search);
  const [activeTab, setActiveTab] = useState("keywords");
  const [copied, setCopied] = useState(false);
  const fileRef = useRef();

  const currentCategory = useMemo(() =>
    data.length ? (data[0][COL.category] || "") : "", [data]);

  const parseExcel = useCallback((file) => {
    setUploadError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
        if (!rows.length) { setUploadError("데이터가 없습니다."); return; }
        if (!rows[0][COL.keyword]) {
          setUploadError(`'${COL.keyword}' 컬럼을 찾을 수 없습니다. 아이템스카우트 형식 파일을 올려주세요.`);
          return;
        }
        const cleaned = rows.filter(r => r[COL.keyword]).map(r => {
          const o = {};
          Object.values(COL).forEach(col => { o[col] = r[col] ?? 0; });
          return o;
        });
        setData(cleaned);
        setFileName(file.name);
        setSelectedKeywords([]);
      } catch (err) {
        setUploadError("파싱 오류: " + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) parseExcel(file);
  }, [parseExcel]);

  const filtered = useMemo(() =>
    data.filter(k => {
      const diff = getDiff(k[COL.products] || 0);
      return (diffFilter === "전체" || diff.label === diffFilter)
        && String(k[COL.keyword]).includes(searchFilter);
    }).sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0)),
    [data, searchFilter, diffFilter, sortBy]
  );

  const groups = useMemo(() => {
    const selectedData = data.filter(k => selectedKeywords.includes(k[COL.keyword]));
    const map = {};
    selectedData.forEach(k => {
      const gk = groupKey(k[COL.keyword]);
      if (!map[gk]) map[gk] = [];
      map[gk].push(k);
    });
    return Object.values(map).sort((a, b) => (b[0][COL.search] || 0) - (a[0][COL.search] || 0));
  }, [data, selectedKeywords]);

  const toggleKeyword = useCallback((kw) =>
    setSelectedKeywords(prev => prev.includes(kw) ? prev.filter(k => k !== kw) : [...prev, kw]), []);

  const topPicks = useMemo(() =>
    [...data].filter(k => (k[COL.products] || 0) <= 5000 && (k[COL.search] || 0) >= 1000)
      .sort((a, b) => b[COL.search] - a[COL.search]).slice(0, 10), [data]);

  const resetAll = () => {
    setData([]); setFileName(""); setSearchFilter(""); setDiffFilter("전체");
    setSortBy(COL.search); setSelectedKeywords([]); setProductMemo(""); setUploadError("");
  };

  const S = {
    panel:  { background: "#13131f", borderRadius: 12, border: "1px solid #1e1e32" },
    label:  { fontSize: 10, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: 1 },
    side:   (on) => ({ display: "block", width: "100%", textAlign: "left", padding: "6px 10px", marginBottom: 3, borderRadius: 7, border: "none", cursor: "pointer", fontSize: 12, background: on ? "#1e1e3a" : "transparent", color: on ? "#a5b4fc" : "#6688aa", fontWeight: on ? 600 : 400 }),
    tabBtn: (on) => ({ padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: on ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,0.06)", color: on ? "#fff" : "#8888aa" }),
  };

  return (
    <div style={{ fontFamily: "'Noto Sans KR','Apple SD Gothic Neo',sans-serif", background: "#0f0f13", minHeight: "100vh", color: "#e8e8f0", display: "flex", flexDirection: "column" }}
      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}>

      {isDragging && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(99,102,241,0.18)", border: "3px dashed #6366f1", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "#a5b4fc", fontWeight: 700, pointerEvents: "none" }}>
          📂 여기에 아이템스카우트 엑셀 파일을 놓으세요
        </div>
      )}

      {/* 헤더 */}
      <div style={{ background: "linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)", borderBottom: "1px solid #2a2a4a", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🔍</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>네이버 SEO 키워드 관리</div>
            <div style={{ fontSize: 11, color: "#8888aa", display: "flex", alignItems: "center", gap: 8 }}>
              {fileName ? `${fileName} · ${data.length}개 키워드` : "엑셀 파일을 업로드하세요"}
              {currentCategory && <span style={{ color: "#6366f1", background: "rgba(99,102,241,0.12)", borderRadius: 6, padding: "1px 8px" }}>📂 {currentCategory}</span>}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => fileRef.current.click()}
            style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #6366f1", background: "rgba(99,102,241,0.1)", color: "#a5b4fc", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            📂 엑셀 업로드
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }}
            onChange={e => { if (e.target.files[0]) parseExcel(e.target.files[0]); e.target.value = ""; }} />
          <div style={{ width: 1, height: 24, background: "#2a2a4a" }} />
          {["keywords", "groups", "generator"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={S.tabBtn(activeTab === tab)}>
              {tab === "keywords" ? "📊 키워드" : tab === "groups" ? "🔗 그룹" : "✨ 상품명 생성"}
            </button>
          ))}
        </div>
      </div>

      {uploadError && (
        <div style={{ background: "rgba(239,68,68,0.1)", borderBottom: "1px solid rgba(239,68,68,0.3)", padding: "8px 24px", fontSize: 12, color: "#f87171" }}>
          ⚠️ {uploadError}
        </div>
      )}

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* 사이드바 */}
        <div style={{ width: 220, background: "#13131f", borderRight: "1px solid #1e1e32", padding: 16, overflowY: "auto", flexShrink: 0 }}>
          <div style={{ background: "rgba(99,102,241,0.07)", border: "1px dashed #3a3a6a", borderRadius: 8, padding: 10, marginBottom: 16, fontSize: 11, color: "#7788bb", textAlign: "center", lineHeight: 1.7 }}>
            📂 아이템스카우트 엑셀을<br/>드래그하거나 버튼으로 업로드
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ ...S.label, marginBottom: 7 }}>검색</div>
            <input value={searchFilter} onChange={e => setSearchFilter(e.target.value)} placeholder="키워드 검색..."
              style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid #2a2a4a", background: "#1a1a2e", color: "#e8e8f0", fontSize: 12, boxSizing: "border-box", outline: "none" }} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ ...S.label, marginBottom: 7 }}>난이도 (상품수 기준)</div>
            {["전체","소형","중소형","중형","대형"].map(d => (
              <button key={d} onClick={() => setDiffFilter(d)} style={S.side(diffFilter === d)}>
                {d==="소형"?"🟢":d==="중소형"?"🔵":d==="중형"?"🟡":d==="대형"?"🔴":"⚪"} {d}
                {d==="소형"?" ~5천":d==="중소형"?" ~1만":d==="중형"?" ~3만":d==="대형"?" 3만+":""}
              </button>
            ))}
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ ...S.label, marginBottom: 7 }}>정렬</div>
            {[COL.search, COL.competition, COL.products, COL.avgClick].map(s => (
              <button key={s} onClick={() => setSortBy(s)} style={S.side(sortBy === s)}>{s}</button>
            ))}
          </div>

          <div style={{ ...S.panel, padding: 12, marginBottom: 12 }}>
            <div style={{ ...S.label, marginBottom: 6 }}>선택된 키워드</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#a5b4fc" }}>{selectedKeywords.length}</div>
            <div style={{ fontSize: 10, color: "#5566aa" }}>/ {filtered.length}개 표시중</div>
          </div>

          {selectedKeywords.length > 0 && (
            <div style={{ ...S.panel, padding: 12, marginBottom: 12 }}>
              <div style={{ ...S.label, marginBottom: 8 }}>선택 목록</div>
              {selectedKeywords.map(kw => (
                <div key={kw} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: "#c4b5fd", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{kw}</span>
                  <button onClick={() => toggleKeyword(kw)} style={{ background: "none", border: "none", color: "#6644aa", cursor: "pointer", fontSize: 15, padding: "0 0 0 4px" }}>×</button>
                </div>
              ))}
              <button onClick={() => setSelectedKeywords([])}
                style={{ marginTop: 8, width: "100%", padding: 5, borderRadius: 6, border: "1px solid #2a2a4a", background: "transparent", color: "#8888aa", fontSize: 11, cursor: "pointer" }}>
                전체 해제
              </button>
            </div>
          )}
        </div>

        {/* 메인 */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>

          {/* 키워드 탭 */}
          {activeTab === "keywords" && (
            <div>
              {/* 초기화 바 */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, padding: "10px 14px", background: "#13131f", borderRadius: 10, border: "1px solid #1e1e32" }}>
                <span style={{ fontSize: 11, color: "#6688aa", flex: 1 }}>
                  {selectedKeywords.length > 0 ? `✅ ${selectedKeywords.length}개 키워드 선택됨` : "키워드를 클릭해서 선택하세요"}
                </span>
                <button onClick={() => setSearchFilter("")}
                  style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid #2a2a4a", background: "transparent", color: "#8888aa", fontSize: 11, cursor: "pointer" }}>
                  🔍 검색 초기화
                </button>
                <button onClick={() => { setSearchFilter(""); setDiffFilter("전체"); setSortBy(COL.search); }}
                  style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid #2a2a4a", background: "transparent", color: "#8888aa", fontSize: 11, cursor: "pointer" }}>
                  🔄 필터 초기화
                </button>
                <button onClick={() => setSelectedKeywords([])} disabled={selectedKeywords.length === 0}
                  style={{ padding: "5px 12px", borderRadius: 7, border: `1px solid ${selectedKeywords.length > 0 ? "#6366f1" : "#2a2a4a"}`, background: selectedKeywords.length > 0 ? "rgba(99,102,241,0.1)" : "transparent", color: selectedKeywords.length > 0 ? "#a5b4fc" : "#3a3a5a", fontSize: 11, cursor: selectedKeywords.length > 0 ? "pointer" : "default" }}>
                  ✕ 선택 초기화
                </button>
                <button onClick={resetAll}
                  style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid #ef4444", background: "rgba(239,68,68,0.08)", color: "#f87171", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>
                  🗑 전체 초기화
                </button>
              </div>

              {data.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 60, gap: 16 }}>
                  <div style={{ fontSize: 48 }}>📂</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#8888aa" }}>아이템스카우트 엑셀 파일을 업로드하세요</div>
                  <div style={{ fontSize: 12, color: "#5566aa", textAlign: "center", lineHeight: 1.8 }}>
                    상단 '엑셀 업로드' 버튼을 클릭하거나<br/>파일을 화면에 드래그&드롭하세요
                  </div>
                  <button onClick={() => fileRef.current.click()}
                    style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    📂 파일 선택하기
                  </button>
                </div>
              ) : (
                <>
                  {topPicks.length > 0 && (
                    <div style={{ marginBottom: 18 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b", marginBottom: 10 }}>⭐ 황금 키워드 (고검색 + 소형)</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                        {topPicks.map(k => {
                          const sel = selectedKeywords.includes(k[COL.keyword]);
                          return (
                            <button key={k[COL.keyword]} onClick={() => toggleKeyword(k[COL.keyword])}
                              style={{ padding: "5px 12px", borderRadius: 20, border: `1px solid ${sel?"#6366f1":"#2a2a4a"}`, background: sel?"rgba(99,102,241,0.2)":"rgba(255,255,255,0.03)", color: sel?"#a5b4fc":"#8899bb", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>
                              {k[COL.keyword]} <span style={{ color: "#22c55e", marginLeft: 4 }}>{(k[COL.search]||0).toLocaleString()}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div style={{ ...S.panel, overflow: "hidden" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 0.9fr 0.9fr 0.9fr 0.8fr 44px", padding: "9px 16px", background: "#0f0f1a", borderBottom: "1px solid #1e1e32" }}>
                      {["키워드","총 검색수","상품수","경쟁강도","난이도","선택"].map(h => (
                        <div key={h} style={{ fontSize: 10, fontWeight: 700, color: "#5566aa" }}>{h}</div>
                      ))}
                    </div>
                    {filtered.length === 0
                      ? <div style={{ textAlign: "center", padding: 40, color: "#5566aa", fontSize: 13 }}>조건에 맞는 키워드가 없습니다</div>
                      : filtered.map((k, i) => {
                        const diff = getDiff(k[COL.products] || 0);
                        const sel = selectedKeywords.includes(k[COL.keyword]);
                        return (
                          <div key={String(k[COL.keyword])+i} onClick={() => toggleKeyword(k[COL.keyword])}
                            style={{ display: "grid", gridTemplateColumns: "2fr 0.9fr 0.9fr 0.9fr 0.8fr 44px", padding: "8px 16px", borderBottom: "1px solid #1a1a2a", background: sel?"rgba(99,102,241,0.07)":i%2===0?"transparent":"rgba(255,255,255,0.01)", cursor: "pointer", alignItems: "center" }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: sel?"#a5b4fc":"#ccd0e0" }}>{k[COL.keyword]}</div>
                            <div style={{ fontSize: 12, color: "#88aacc", fontWeight: 600 }}>{(k[COL.search]||0).toLocaleString()}</div>
                            <div style={{ fontSize: 12, color: "#6688aa" }}>{(k[COL.products]||0).toLocaleString()}</div>
                            <div>
                              <span style={{ fontSize: 12, color: "#8899aa", fontWeight: 600 }}>{k[COL.competition]}</span>
                              <div style={{ height: 3, borderRadius: 2, background: "#1e1e2e", marginTop: 3, width: 44 }}>
                                <div style={{ height: 3, borderRadius: 2, background: diff.bar, width: `${Math.min((k[COL.competition]||0)/10*100,100)}%` }} />
                              </div>
                            </div>
                            <div><span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10, background: diff.badge, color: diff.bar, border: `1px solid ${diff.border}` }}>{diff.label}</span></div>
                            <div style={{ display: "flex", justifyContent: "center" }}>
                              <div style={{ width: 17, height: 17, borderRadius: 5, border: `2px solid ${sel?"#6366f1":"#2a2a4a"}`, background: sel?"#6366f1":"transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {sel && <span style={{ color:"#fff", fontSize:10 }}>✓</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    }
                  </div>
                </>
              )}
            </div>
          )}

          {/* 그룹 탭 */}
          {activeTab === "groups" && (
            <div>
              <div style={{ fontSize: 12, color: "#8888aa", marginBottom: 4 }}>선택한 키워드 중 단어 순서만 다른 것을 자동으로 묶습니다.</div>
              <div style={{ fontSize: 11, color: "#5566aa", marginBottom: 16 }}>📌 대표 키워드는 검색수 기준 자동 선택 · 키워드 탭에서 먼저 키워드를 선택하세요</div>
              {selectedKeywords.length === 0 ? (
                <div style={{ textAlign: "center", color: "#5566aa", padding: 60, fontSize: 14 }}>
                  선택된 키워드가 없습니다.<br/><span style={{ fontSize: 12 }}>키워드 탭에서 키워드를 선택해주세요.</span>
                </div>
              ) : groups.length === 0 ? (
                <div style={{ textAlign: "center", color: "#5566aa", padding: 60, fontSize: 14 }}>그룹화된 키워드가 없습니다.</div>
              ) : groups.map((group, gi) => {
                const rep = [...group].sort((a,b) => b[COL.search] - a[COL.search])[0];
                const isGrouped = group.length > 1;
                return (
                  <div key={gi} style={{ ...S.panel, marginBottom: 12, overflow: "hidden" }}>
                    <div style={{ padding: "10px 16px", background: "#0f0f1a", display: "flex", alignItems: "center", gap: 10 }}>
                      {isGrouped
                        ? <span style={{ fontSize: 10, fontWeight: 700, color: "#6366f1", background: "rgba(99,102,241,0.15)", padding: "2px 8px", borderRadius: 10 }}>대표 · {group.length}개 묶음</span>
                        : <span style={{ fontSize: 10, fontWeight: 700, color: "#8888aa", background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: 10 }}>단독</span>
                      }
                      <span style={{ fontSize: 13, fontWeight: 700, color: isGrouped ? "#c4b5fd" : "#aabbcc" }}>{rep[COL.keyword]}</span>
                      <span style={{ fontSize: 11, color: "#8888aa" }}>검색 {(rep[COL.search]||0).toLocaleString()}</span>
                      <span style={{ fontSize: 11, color: "#667788" }}>상품 {(rep[COL.products]||0).toLocaleString()}</span>
                      <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 9, background: getDiff(rep[COL.products]||0).badge, color: getDiff(rep[COL.products]||0).bar, border: `1px solid ${getDiff(rep[COL.products]||0).border}` }}>
                        {getDiff(rep[COL.products]||0).label}
                      </span>
                    </div>
                    {isGrouped && (
                      <div style={{ padding: "8px 16px" }}>
                        {group.map(k => {
                          const diff = getDiff(k[COL.products]||0);
                          const isRep = k[COL.keyword] === rep[COL.keyword];
                          return (
                            <div key={k[COL.keyword]}
                              style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px", borderRadius: 8, marginBottom: 2, background: isRep ? "rgba(99,102,241,0.07)" : "transparent" }}>
                              <span style={{ fontSize: 9, color: isRep ? "#6366f1" : "transparent", fontWeight: 700 }}>★</span>
                              <span style={{ fontSize: 12, color: isRep?"#a5b4fc":"#8899bb", fontWeight: isRep?600:400, minWidth: 120 }}>{k[COL.keyword]}</span>
                              <span style={{ fontSize: 11, color: "#6688aa" }}>검색 {(k[COL.search]||0).toLocaleString()}</span>
                              <span style={{ fontSize: 11, color: "#556688" }}>상품 {(k[COL.products]||0).toLocaleString()}</span>
                              <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 9, background: diff.badge, color: diff.bar, border: `1px solid ${diff.border}`, marginLeft: "auto" }}>{diff.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 상품명 생성 탭 */}
          {activeTab === "generator" && (
            <div>
              <div style={{ ...S.panel, padding: 20, marginBottom: 16 }}>
                <div style={{ ...S.label, marginBottom: 12 }}>✅ 선택된 키워드 ({selectedKeywords.length}개)</div>
                {selectedKeywords.length === 0
                  ? <div style={{ color: "#5566aa", fontSize: 12, textAlign: "center", padding: 16 }}>키워드 탭에서 키워드를 선택하세요</div>
                  : <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {[...selectedKeywords]
                        .sort((a, b) => (data.find(k=>k[COL.keyword]===a)?.[COL.products]||0) - (data.find(k=>k[COL.keyword]===b)?.[COL.products]||0))
                        .map(kw => {
                          const d = data.find(k => k[COL.keyword] === kw);
                          const diff = d ? getDiff(d[COL.products]||0) : null;
                          return (
                            <div key={kw} style={{ padding: "4px 10px", borderRadius: 16, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", fontSize: 11, color: "#a5b4fc", display: "flex", alignItems: "center", gap: 6 }}>
                              {kw}
                              {diff && <span style={{ fontSize: 10, color: diff.bar, fontWeight: 700 }}>{diff.label}</span>}
                              {d && <span style={{ fontSize: 10, color: "#6688aa" }}>상품 {(d[COL.products]||0).toLocaleString()}</span>}
                              <button onClick={() => toggleKeyword(kw)} style={{ background: "none", border: "none", color: "#6644cc", cursor: "pointer", padding: 0, fontSize: 14 }}>×</button>
                            </div>
                          );
                        })}
                    </div>
                }
              </div>

              <div style={{ ...S.panel, padding: 20, marginBottom: 16 }}>
                <div style={{ ...S.label, marginBottom: 10 }}>📝 상품 특징 메모 (선택)</div>
                <textarea value={productMemo} onChange={e => setProductMemo(e.target.value)}
                  placeholder="예: 항균, 흠집방지, 원목, 대형, 세트구성..."
                  style={{ width: "100%", height: 70, padding: "10px 12px", borderRadius: 8, border: "1px solid #2a2a4a", background: "#1a1a2e", color: "#e8e8f0", fontSize: 12, resize: "none", outline: "none", boxSizing: "border-box" }} />
              </div>

              {selectedKeywords.length > 0 && (() => {
                const sorted = [...selectedKeywords].sort((a, b) =>
                  (data.find(k=>k[COL.keyword]===a)?.[COL.products]||0) - (data.find(k=>k[COL.keyword]===b)?.[COL.products]||0)
                );
                const kwLines = sorted.map(kw => {
                  const d = data.find(k => k[COL.keyword] === kw);
                  const diff = d ? getDiff(d[COL.products]||0) : null;
                  return `- ${kw} (검색수: ${(d?.[COL.search]||0).toLocaleString()} / 상품수: ${(d?.[COL.products]||0).toLocaleString()} / 난이도: ${diff?.label||""})`;
                }).join("\n");

                const prompt = `네이버 스마트스토어 SEO 상품명을 작성해줘.

[선택 키워드]
${kwLines}${productMemo ? `\n\n[상품 특징]\n${productMemo}` : ""}

[작성 규칙]
1. 45자 이내
2. 소형→중소형 키워드 맨 앞 배치 (자연노출 진입용)
3. 중형→대형 키워드 뒤에 순서 무관 배치 (검색볼륨 확보용)
4. 연관어끼리 인접 배치
5. 단일 상품 1개 = 상품명 1개 (수정 없이 운영 전제)
6. 같은 상품으로 커버 가능한 키워드만 묶기 (전환 적합도 기준)
7. 브랜드 강한 카테고리 제외 (보온병/물통/쌀통 등)
[결과물 형식] 카테고리별 상품명 2개씩 총 10개, 아래 형식으로 출력
① 카테고리명
상품명 (N자)
* 핵심키워드: OOO (검색수 N / 상품수 N)
* 이유: 타겟 고객이 누구인지 + 왜 이 키워드를 묶었는지 + 상품 하나로 커버 가능한 근거`;

                return (
                  <div style={{ ...S.panel, overflow: "hidden" }}>
                    <div style={{ padding: "12px 18px", background: "#0f0f1a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#e8e8f0" }}>📋 AI 프롬프트</span>
                        <span style={{ fontSize: 11, color: "#5566aa", marginLeft: 10 }}>Claude / ChatGPT 등에 바로 붙여넣기</span>
                      </div>
                      <button onClick={() => { navigator.clipboard.writeText(prompt); setCopied(true); setTimeout(()=>setCopied(false),2000); }}
                        style={{ padding: "7px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: copied ? "linear-gradient(135deg,#22c55e,#16a34a)" : "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff" }}>
                        {copied ? "✅ 복사됨!" : "📋 프롬프트 복사"}
                      </button>
                    </div>
                    <div style={{ padding: 18 }}>
                      <pre style={{ margin: 0, fontFamily: "'Noto Sans KR', sans-serif", fontSize: 12, color: "#aabbcc", lineHeight: 1.8, whiteSpace: "pre-wrap", wordBreak: "break-word", background: "#0a0a12", borderRadius: 8, padding: 14, border: "1px solid #1e1e32" }}>
                        {prompt}
                      </pre>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

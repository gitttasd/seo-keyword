import { useState, useCallback, useEffect } from "react";

const SUPABASE_URL = "https://ukebiulblaeqwcahtswk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZWJpdWxibGFlcXdjYWh0c3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NTM1MTIsImV4cCI6MjA4ODMyOTUxMn0.DjrL6iMcdv8aT_IvAj7Dw2L1YwJ9foKaIvIyMdDrZQY";

const db = {
  async select() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/product_names?select=*&order=created_at.desc`, {
      headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
    });
    return res.json();
  },
  async insert(data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/product_names`, {
      method: "POST",
      headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", "Prefer": "return=representation" },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  async delete(id) {
    await fetch(`${SUPABASE_URL}/rest/v1/product_names?id=eq.${id}`, {
      method: "DELETE",
      headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
    });
  }
};

const PROMO_PRESETS = ["포토리뷰 적립", "텍스트리뷰 적립", "자체 쿠폰", "첫구매 할인", "무료배송", "카드사 할인", "리뷰이벤트"];

function CompetitorCard({ comp, index, onChange, onRemove }) {
  const addPromo = (name) => {
    if (comp.promos.find(p => p.name === name)) return;
    onChange({ ...comp, promos: [...comp.promos, { name, amount: "" }] });
  };
  const removePromo = (i) => onChange({ ...comp, promos: comp.promos.filter((_, idx) => idx !== i) });
  const updatePromo = (i, field, val) => {
    const promos = comp.promos.map((p, idx) => idx === i ? { ...p, [field]: val } : p);
    onChange({ ...comp, promos });
  };
  const totalPromo = comp.promos.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
  const basePrice = parseFloat(comp.price) || 0;
  const realPrice = basePrice - totalPromo;

  return (
    <div style={{ background: "#13131f", borderRadius: 14, border: "1px solid #1e1e32", overflow: "hidden", marginBottom: 14 }}>
      <div style={{ padding: "12px 16px", background: "#0f0f1a", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
          {index + 1}
        </div>
        <input value={comp.name} onChange={e => onChange({ ...comp, name: e.target.value })}
          placeholder={`경쟁사 ${index + 1}`}
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#e8e8f0", fontSize: 14, fontWeight: 600 }} />
        <button onClick={onRemove} style={{ background: "none", border: "none", color: "#3a3a5a", cursor: "pointer", fontSize: 18, padding: 0 }}>×</button>
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>판매가</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="number" value={comp.price} onChange={e => onChange({ ...comp, price: e.target.value })} placeholder="판매가 입력"
              style={{ flex: 1, padding: "7px 10px", borderRadius: 8, border: "1px solid #2a2a3a", background: "#0e0e1a", color: "#e8e8f0", fontSize: 13, outline: "none" }} />
            <span style={{ fontSize: 12, color: "#5566aa" }}>원</span>
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>프로모션 (차감 항목)</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
            {PROMO_PRESETS.map(p => (
              <button key={p} onClick={() => addPromo(p)}
                style={{ padding: "3px 10px", borderRadius: 12, border: "1px solid #2a2a3a", background: comp.promos.find(x => x.name === p) ? "rgba(99,102,241,0.15)" : "transparent", color: comp.promos.find(x => x.name === p) ? "#a5b4fc" : "#6677aa", fontSize: 11, cursor: "pointer" }}>
                + {p}
              </button>
            ))}
            <button onClick={() => addPromo(`직접입력${comp.promos.length + 1}`)}
              style={{ padding: "3px 10px", borderRadius: 12, border: "1px dashed #3a3a5a", background: "transparent", color: "#5566aa", fontSize: 11, cursor: "pointer" }}>
              + 직접입력
            </button>
          </div>
          {comp.promos.map((promo, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <input value={promo.name} onChange={e => updatePromo(i, "name", e.target.value)}
                style={{ flex: 1, padding: "6px 10px", borderRadius: 7, border: "1px solid #2a2a3a", background: "#0e0e1a", color: "#c4b5fd", fontSize: 12, outline: "none" }} />
              <input type="number" value={promo.amount} onChange={e => updatePromo(i, "amount", e.target.value)} placeholder="0"
                style={{ width: 80, padding: "6px 10px", borderRadius: 7, border: "1px solid #2a2a3a", background: "#0e0e1a", color: "#e8e8f0", fontSize: 12, outline: "none", textAlign: "right" }} />
              <span style={{ fontSize: 11, color: "#5566aa", width: 14 }}>원</span>
              <button onClick={() => removePromo(i)} style={{ background: "none", border: "none", color: "#3a3a5a", cursor: "pointer", fontSize: 16, padding: 0 }}>×</button>
            </div>
          ))}
        </div>
        {basePrice > 0 && (
          <div style={{ background: "#0a0a14", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 11, color: "#5566aa" }}>{basePrice.toLocaleString()}원 - {totalPromo.toLocaleString()}원 (프로모션)</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#22c55e" }}>{realPrice.toLocaleString()}원</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("price");
  const [competitors, setCompetitors] = useState([{ id: 1, name: "", price: "", promos: [] }]);
  const [reviewText, setReviewText] = useState("");
  const [reviewProduct, setReviewProduct] = useState("");
  const [copied, setCopied] = useState(false);

  // 보관함
  const [savedItems, setSavedItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newCoreKeywords, setNewCoreKeywords] = useState("");
  const [newMemo, setNewMemo] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const fetchItems = useCallback(async () => {
    setLoadingItems(true);
    try {
      const data = await db.select();
      setSavedItems(Array.isArray(data) ? data : []);
    } catch { setSavedItems([]); }
    setLoadingItems(false);
  }, []);

  useEffect(() => { if (tab === "storage") fetchItems(); }, [tab, fetchItems]);

  const handleSave = async () => {
    if (!newProductName.trim()) { setSaveMsg("상품명을 입력해주세요."); return; }
    setSaving(true); setSaveMsg("");
    try {
      await db.insert({ product_name: newProductName.trim(), core_keywords: newCoreKeywords.trim(), memo: newMemo.trim() });
      setNewProductName(""); setNewCoreKeywords(""); setNewMemo("");
      setSaveMsg("✅ 저장됐어요!");
      fetchItems();
    } catch { setSaveMsg("❌ 저장 실패. 다시 시도해주세요."); }
    setSaving(false);
    setTimeout(() => setSaveMsg(""), 3000);
  };

  const handleDelete = async (id) => {
    await db.delete(id);
    setSavedItems(prev => prev.filter(i => i.id !== id));
  };

  const updateComp = useCallback((id, data) => setCompetitors(prev => prev.map(c => c.id === id ? { ...c, ...data } : c)), []);
  const removeComp = useCallback((id) => setCompetitors(prev => prev.filter(c => c.id !== id)), []);

  const validComps = competitors.filter(c => parseFloat(c.price) > 0);
  const realPrices = validComps.map((c, idx) => {
    const base = parseFloat(c.price) || 0;
    const promo = c.promos.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
    return { name: c.name || `경쟁사${idx+1}`, base, promo, real: base - promo };
  });
  const avgReal = realPrices.length ? Math.round(realPrices.reduce((s, r) => s + r.real, 0) / realPrices.length) : 0;
  const minReal = realPrices.length ? Math.min(...realPrices.map(r => r.real)) : 0;
  const maxReal = realPrices.length ? Math.max(...realPrices.map(r => r.real)) : 0;

  const reviewPrompt = `아래는 네이버 쇼핑에서 "${reviewProduct || "상품"}"을 검색했을 때 경쟁사 상품의 실제 구매자 리뷰야.

[리뷰 원문]
${reviewText}

[분석 요청]
1. 페인포인트 TOP 5 (불만/아쉬운 점, 언급 빈도 높은 순)
2. 자주 언급되는 긍정 키워드
3. 역소싱 방향 제안 (이 페인포인트를 해결한 제품을 찾는다면 어떤 스펙/특징을 봐야 하는지)
4. 타오바오/알리바바 검색 추천 키워드 3개

[출력 형식]
① 페인포인트 TOP 5
- (내용) — 언급 빈도: 높음/중간/낮음

② 긍정 키워드
- OOO, OOO, OOO

③ 역소싱 방향
→ (구체적인 스펙/특징 설명)

④ 소싱 검색 키워드
- (한국어), (중국어), (중국어)`;

  const pricePrompt = `[경쟁사 가격 분석]

${realPrices.map((r,i) => `${i+1}. ${r.name}\n   판매가: ${r.base.toLocaleString()}원\n   프로모션 차감: ${r.promo.toLocaleString()}원\n   실질 판매가: ${r.real.toLocaleString()}원`).join("\n\n")}

평균 객단가: ${avgReal.toLocaleString()}원
최저 실질가: ${minReal.toLocaleString()}원
최고 실질가: ${maxReal.toLocaleString()}원

위 데이터를 바탕으로:
1. 내가 진입할 적정 판매가 구간
2. 프로모션 전략 제안
3. 가격 경쟁력 확보 방법`;

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const S = {
    panel: { background: "#13131f", borderRadius: 14, border: "1px solid #1e1e32" },
    label: { fontSize: 10, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: 1 },
    tab: (on) => ({ padding: "8px 18px", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: on ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,0.05)", color: on ? "#fff" : "#8888aa" }),
  };

  return (
    <div style={{ fontFamily: "'Noto Sans KR','Apple SD Gothic Neo',sans-serif", background: "#0a0a12", minHeight: "100vh", color: "#e8e8f0" }}>
      <div style={{ background: "linear-gradient(135deg,#0f0f1e,#131325)", borderBottom: "1px solid #1e1e32", padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📦</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, color: "#fff" }}>소싱 분석 도구</div>
            <div style={{ fontSize: 11, color: "#5566aa" }}>경쟁사 가격 분석 · 리뷰 페인포인트 · 상품명 보관함</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setTab("price")} style={S.tab(tab === "price")}>💰 가격 분석</button>
          <button onClick={() => setTab("review")} style={S.tab(tab === "review")}>💬 리뷰 분석</button>
          <button onClick={() => setTab("storage")} style={S.tab(tab === "storage")}>📁 상품명 보관함</button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 24px" }}>

        {/* 가격 분석 */}
        {tab === "price" && (
          <div>
            {realPrices.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
                {[{ label: "평균 객단가", value: avgReal, color: "#a5b4fc" }, { label: "최저 실질가", value: minReal, color: "#22c55e" }, { label: "최고 실질가", value: maxReal, color: "#f59e0b" }].map(item => (
                  <div key={item.label} style={{ ...S.panel, padding: "18px 20px", textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "#5566aa", marginBottom: 8 }}>{item.label}</div>
                    <div style={{ fontSize: 26, fontWeight: 700, color: item.color }}>{item.value.toLocaleString()}<span style={{ fontSize: 13, marginLeft: 3 }}>원</span></div>
                  </div>
                ))}
              </div>
            )}
            {competitors.map((comp, i) => (
              <CompetitorCard key={comp.id} comp={comp} index={i} onChange={(data) => updateComp(comp.id, data)} onRemove={() => removeComp(comp.id)} />
            ))}
            {competitors.length < 10 && (
              <button onClick={() => setCompetitors(prev => [...prev, { id: Date.now(), name: "", price: "", promos: [] }])}
                style={{ width: "100%", padding: 13, borderRadius: 12, border: "2px dashed #2a2a3a", background: "transparent", color: "#5566aa", fontSize: 13, cursor: "pointer", fontWeight: 600, marginBottom: 20 }}>
                + 경쟁사 추가 ({competitors.length}/10)
              </button>
            )}
            {realPrices.length >= 2 && (
              <div style={{ ...S.panel, overflow: "hidden" }}>
                <div style={{ padding: "12px 18px", background: "#0f0f1a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#e8e8f0" }}>📋 가격 분석 프롬프트</span>
                  <button onClick={() => handleCopy(pricePrompt)}
                    style={{ padding: "7px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: copied ? "linear-gradient(135deg,#22c55e,#16a34a)" : "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff" }}>
                    {copied ? "✅ 복사됨!" : "📋 프롬프트 복사"}
                  </button>
                </div>
                <div style={{ padding: 18 }}>
                  <pre style={{ margin: 0, fontFamily: "'Noto Sans KR',sans-serif", fontSize: 12, color: "#aabbcc", lineHeight: 1.8, whiteSpace: "pre-wrap", background: "#0a0a12", borderRadius: 8, padding: 14, border: "1px solid #1e1e32" }}>{pricePrompt}</pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 리뷰 분석 */}
        {tab === "review" && (
          <div>
            <div style={{ ...S.panel, padding: 20, marginBottom: 16 }}>
              <div style={{ ...S.label, marginBottom: 10 }}>🔍 상품명 / 카테고리</div>
              <input value={reviewProduct} onChange={e => setReviewProduct(e.target.value)} placeholder="예: 서랍형 계란트레이, 실리콘 도마 등"
                style={{ width: "100%", padding: "10px 14px", borderRadius: 9, border: "1px solid #2a2a3a", background: "#0e0e1a", color: "#e8e8f0", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ ...S.panel, padding: 20, marginBottom: 16 }}>
              <div style={{ ...S.label, marginBottom: 10 }}>💬 리뷰 원문 붙여넣기</div>
              <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="네이버 쇼핑 경쟁사 리뷰를 복사해서 붙여넣으세요..."
                style={{ width: "100%", height: 220, padding: "12px 14px", borderRadius: 9, border: "1px solid #2a2a3a", background: "#0e0e1a", color: "#e8e8f0", fontSize: 13, resize: "vertical", outline: "none", lineHeight: 1.7, boxSizing: "border-box" }} />
              <div style={{ textAlign: "right", fontSize: 11, color: "#5566aa", marginTop: 6 }}>{reviewText.length}자</div>
            </div>
            {reviewText.trim() && (
              <div style={{ ...S.panel, overflow: "hidden" }}>
                <div style={{ padding: "12px 18px", background: "#0f0f1a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#e8e8f0" }}>📋 리뷰 분석 프롬프트</span>
                  <button onClick={() => handleCopy(reviewPrompt)}
                    style={{ padding: "7px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: copied ? "linear-gradient(135deg,#22c55e,#16a34a)" : "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff" }}>
                    {copied ? "✅ 복사됨!" : "📋 프롬프트 복사"}
                  </button>
                </div>
                <div style={{ padding: 18 }}>
                  <pre style={{ margin: 0, fontFamily: "'Noto Sans KR',sans-serif", fontSize: 12, color: "#aabbcc", lineHeight: 1.8, whiteSpace: "pre-wrap", background: "#0a0a12", borderRadius: 8, padding: 14, border: "1px solid #1e1e32" }}>{reviewPrompt}</pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 상품명 보관함 */}
        {tab === "storage" && (
          <div>
            <div style={{ ...S.panel, padding: 22, marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#e8e8f0", marginBottom: 16 }}>➕ 새 상품명 저장</div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ ...S.label, marginBottom: 7 }}>상품명 *</div>
                <input value={newProductName} onChange={e => setNewProductName(e.target.value)}
                  placeholder="예: 서랍형 계란트레이 냉장고 정리 보관함 2단 달걀케이스"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 9, border: "1px solid #2a2a3a", background: "#0e0e1a", color: "#e8e8f0", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                <div style={{ textAlign: "right", fontSize: 11, color: newProductName.length > 45 ? "#ef4444" : "#5566aa", marginTop: 4 }}>
                  {newProductName.length}자 {newProductName.length > 45 && "⚠️ 45자 초과"}
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ ...S.label, marginBottom: 7 }}>핵심 키워드</div>
                <input value={newCoreKeywords} onChange={e => setNewCoreKeywords(e.target.value)}
                  placeholder="예: 서랍형계란트레이, 냉장고계란보관, 달걀케이스 (쉼표로 구분)"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 9, border: "1px solid #2a2a3a", background: "#0e0e1a", color: "#e8e8f0", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ ...S.label, marginBottom: 7 }}>메모 (선택)</div>
                <textarea value={newMemo} onChange={e => setNewMemo(e.target.value)} placeholder="소싱 메모, 특이사항 등..."
                  style={{ width: "100%", height: 70, padding: "10px 14px", borderRadius: 9, border: "1px solid #2a2a3a", background: "#0e0e1a", color: "#e8e8f0", fontSize: 13, resize: "none", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button onClick={handleSave} disabled={saving}
                  style={{ padding: "10px 28px", borderRadius: 10, border: "none", cursor: saving ? "default" : "pointer", fontSize: 13, fontWeight: 700, background: saving ? "#2a2a4a" : "linear-gradient(135deg,#6366f1,#8b5cf6)", color: saving ? "#5566aa" : "#fff" }}>
                  {saving ? "저장 중..." : "💾 저장하기"}
                </button>
                {saveMsg && <span style={{ fontSize: 12, color: saveMsg.startsWith("✅") ? "#22c55e" : "#ef4444" }}>{saveMsg}</span>}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#e8e8f0" }}>📁 저장된 상품명 {savedItems.length > 0 ? `(${savedItems.length}개)` : ""}</div>
              <button onClick={fetchItems} style={{ background: "none", border: "1px solid #2a2a3a", borderRadius: 7, color: "#5566aa", fontSize: 11, cursor: "pointer", padding: "4px 12px" }}>🔄 새로고침</button>
            </div>

            {loadingItems ? (
              <div style={{ textAlign: "center", padding: 40, color: "#5566aa" }}>불러오는 중...</div>
            ) : savedItems.length === 0 ? (
              <div style={{ textAlign: "center", padding: 50, color: "#5566aa", fontSize: 13 }}>
                저장된 상품명이 없어요.<br/><span style={{ fontSize: 12 }}>위에서 상품명을 입력하고 저장해보세요!</span>
              </div>
            ) : savedItems.map(item => (
              <div key={item.id} style={{ ...S.panel, padding: "16px 20px", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#e8e8f0" }}>{item.product_name}</span>
                      <span style={{ fontSize: 10, color: item.product_name?.length > 45 ? "#ef4444" : "#22c55e", fontWeight: 700 }}>{item.product_name?.length}자</span>
                    </div>
                    {item.core_keywords && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 6 }}>
                        {item.core_keywords.split(",").map(kw => kw.trim()).filter(Boolean).map(kw => (
                          <span key={kw} style={{ fontSize: 11, padding: "2px 9px", borderRadius: 12, background: "rgba(99,102,241,0.15)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)" }}>{kw}</span>
                        ))}
                      </div>
                    )}
                    {item.memo && <div style={{ fontSize: 12, color: "#5566aa", marginTop: 4 }}>📝 {item.memo}</div>}
                    <div style={{ fontSize: 10, color: "#3a3a5a", marginTop: 6 }}>
                      {new Date(item.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button onClick={() => navigator.clipboard.writeText(item.product_name)}
                      style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid #2a2a3a", background: "transparent", color: "#8888aa", fontSize: 11, cursor: "pointer" }}>복사</button>
                    <button onClick={() => handleDelete(item.id)}
                      style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)", color: "#f87171", fontSize: 11, cursor: "pointer" }}>삭제</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

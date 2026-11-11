import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Stethoscope,
  Sparkles,
  Pill,
  Calculator,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  Eye,
  BookOpen,
  X,
  ClipboardList,
  Plus,
  Check,
  Trash2,
  Copy,
  ArrowLeftRight,
} from 'lucide-react';
import data from './data/tissueSaltsData.json';

const QUICK_SYMPTOMS = [
  'เจ็บคอ',
  'เสมหะขาว',
  'เสมหะเหลือง',
  'น้ำมูกใส',
  'กรดไหลย้อน',
  'ตะคริว',
  'สิวหัวช้าง',
  'นอนไม่หลับ',
  'GERD',
  'Sciatica',
  'Neuralgia',
  'Sinusitis',
  'Eczema',
  'Insomnia',
  'Gout',
  'Abscess',
];

const ORGAN_FILTERS = [
  { label: 'ปอด (Lungs)', query: 'ปอด' },
  { label: 'สมอง & ประสาท (Brain)', query: 'สมอง' },
  { label: 'หัวใจ & หลอดเลือด (Heart)', query: 'หัวใจ' },
  { label: 'ตับ & ถุงน้ำดี (Liver)', query: 'ตับ' },
  { label: 'ไต & ปัสสาวะ (Kidneys)', query: 'ไต' },
  { label: 'กระเพาะ (Stomach)', query: 'กระเพาะ' },
  { label: 'ลำไส้ (Intestines)', query: 'ลำไส้' },
  { label: 'กระดูก & ข้อ (Bones)', query: 'กระดูก' },
  { label: 'ผิวหนัง (Skin)', query: 'ผิวหนัง' },
  { label: 'ต่อมน้ำเหลือง (Lymph)', query: 'ต่อมน้ำเหลือง' },
  { label: 'ตา & หู (Eyes/Ears)', query: 'ตาและหู' },
  { label: 'ฟัน & ช่องปาก (Teeth)', query: 'ฟัน' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('search');
  const [query, setQuery] = useState('');
  const [selectedAilment, setSelectedAilment] = useState(null);
  const [selectedSalt, setSelectedSalt] = useState(null);
  const [expandedSaltIds, setExpandedSaltIds] = useState({});
  const [facialFilter, setFacialFilter] = useState('');
  const [dosageGroup, setDosageGroup] = useState('adult');
  const [dosageMode, setDosageMode] = useState('acute');
  const [numberingSystem, setNumberingSystem] = useState('german'); // 'german' | 'us'
  const [regimenIds, setRegimenIds] = useState(() => {
    try {
      const saved = localStorage.getItem('tissue_salts_regimen');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [copiedMsg, setCopiedMsg] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('tissue_salts_regimen', JSON.stringify(regimenIds));
    } catch {
      // ignore storage errors
    }
  }, [regimenIds]);

  const getDisplayNum = (salt) => {
    if (!salt) return '';
    return numberingSystem === 'us' ? salt.us_id : salt.id;
  };

  const getAltNumLabel = (salt) => {
    if (!salt) return '';
    return numberingSystem === 'us' ? `DE/AU #${salt.id}` : `US #${salt.us_id}`;
  };

  const toggleSaltExpand = (e, id) => {
    e.stopPropagation();
    setExpandedSaltIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleRegimen = (e, id) => {
    if (e) e.stopPropagation();
    setRegimenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const saltsById = useMemo(() => {
    const map = {};
    data.salts.forEach((s) => {
      map[s.id] = s;
    });
    return map;
  }, []);

  const orderedSalts = useMemo(() => {
    return [...data.salts].sort((a, b) => getDisplayNum(a) - getDisplayNum(b));
  }, [numberingSystem]);

  const regimenSalts = useMemo(() => {
    return regimenIds
      .map((id) => saltsById[id])
      .filter(Boolean)
      .sort((a, b) => getDisplayNum(a) - getDisplayNum(b));
  }, [regimenIds, saltsById, numberingSystem]);

  const hasNatMurInRegimen = useMemo(() => regimenIds.includes(8), [regimenIds]);
  const hasSilicaInRegimen = useMemo(() => regimenIds.includes(11), [regimenIds]);
  const otherSaltsInRegimen = useMemo(
    () => regimenSalts.filter((s) => !s.must_take_alone),
    [regimenSalts]
  );

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return { ailments: data.ailments, salts: [] };
    }
    const tokens = q.split(/\s+/).filter(Boolean);

    const matchedAilments = data.ailments.filter((a) => {
      const text = [
        a.name_th,
        a.name_en,
        a.category,
        ...a.synonyms,
        ...a.differential_rules.map((r) => `${r.stage} ${r.condition_match_th} ${r.note_th}`),
      ]
        .join(' ')
        .toLowerCase();
      return tokens.every((t) => text.includes(t));
    });

    const matchedSalts = orderedSalts.filter((s) => {
      const text = [
        `#${s.id}`,
        `#${s.us_id}`,
        s.name_en,
        s.short_name,
        s.latin_name,
        s.name_th,
        s.nickname_th,
        s.primary_function_th,
        ...s.keywords_th,
        ...(s.keywords_en_common || []),
        ...(s.keywords_en_medical || []),
        ...(s.organs || []),
        s.facial_signs.face_appearance,
        s.facial_signs.tongue_coating,
        s.facial_signs.discharge,
      ]
        .join(' ')
        .toLowerCase();
      return tokens.every((t) => text.includes(t));
    });

    return { ailments: matchedAilments, salts: matchedSalts };
  }, [query, orderedSalts]);

  const facialMatches = useMemo(() => {
    const q = facialFilter.trim().toLowerCase();
    if (!q) return orderedSalts;
    const tokens = q.split(/\s+/).filter(Boolean);
    return orderedSalts.filter((s) => {
      const text = [
        `#${s.id}`,
        `#${s.us_id}`,
        s.name_en,
        s.short_name,
        s.name_th,
        s.nickname_th,
        s.facial_signs.face_appearance,
        s.facial_signs.tongue_coating,
        s.facial_signs.discharge,
        s.facial_signs.other_visible_tells_th || '',
        ...(s.facial_signs.keywords_facial_en || []),
        ...s.keywords_th,
      ]
        .join(' ')
        .toLowerCase();
      return tokens.every((t) => text.includes(t));
    });
  }, [facialFilter, orderedSalts]);

  const activeDosageRule = useMemo(() => {
    return data.dosage_rules.find((d) => d.id === dosageGroup) || data.dosage_rules[0];
  }, [dosageGroup]);

  const handleCopyRegimen = () => {
    if (regimenSalts.length === 0) return;
    const sysLabel = numberingSystem === 'us' ? 'US/SA Numbering' : 'German/AU Numbering';
    const modeLabel = dosageMode === 'acute' ? 'เฉียบพลัน (Acute)' : 'เรื้อรัง (Chronic)';
    const lines = [
      `ตารางรับประทาน Tissue Salts (${sysLabel})`,
      `กลุ่มผู้ใช้: ${activeDosageRule.label_th} | อาการ: ${modeLabel}`,
      `ขนาดยา: ${activeDosageRule[dosageMode].dose} | ความถี่: ${activeDosageRule[dosageMode].frequency}`,
      `วิธีทาน: ${activeDosageRule[dosageMode].method}`,
      '',
    ];
    if (hasNatMurInRegimen && otherSaltsInRegimen.length > 0) {
      lines.push('รอบที่ 1 (ทานร่วมกันได้):');
      otherSaltsInRegimen.forEach((s) => {
        lines.push(`- #${getDisplayNum(s)} ${s.short_name} (${s.name_th}) [${s.default_potency}]`);
      });
      lines.push('>> เว้นระยะห่าง 5–10 นาที <<');
      const natMur = saltsById[8];
      lines.push(`รอบที่ 2 (ต้องอมแยกเดี่ยวเสมอ):`);
      lines.push(`- #${getDisplayNum(natMur)} ${natMur.short_name} (${natMur.name_th}) [${natMur.default_potency}]`);
    } else {
      lines.push('รายการยาที่เลือก:');
      regimenSalts.forEach((s) => {
        lines.push(`- #${getDisplayNum(s)} ${s.short_name} (${s.name_th}) [${s.default_potency}]`);
      });
    }
    navigator.clipboard?.writeText(lines.join('\n')).then(() => {
      setCopiedMsg(true);
      setTimeout(() => setCopiedMsg(false), 2500);
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-teal-100 text-sm font-medium mb-1">
                <Sparkles className="w-4 h-4" />
                <span>
                  Biochemic Cell Salts Reference (
                  {numberingSystem === 'german' ? 'German / Australian #1–#12' : 'US / South African #1–#12'})
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Tissue Salts Finder — ค้นหาแร่ธาตุ 12 Cell Salts
              </h1>
              <p className="text-teal-50 text-sm mt-1">
                จำแนกตัวยาตามอาการ โรค สีเสมหะ สีลิ้น จุดสังเกตบนใบหน้า พร้อมจัดตารางยา
              </p>
            </div>

            {/* Numbering System Switcher */}
            <div className="flex flex-col items-start md:items-end gap-2">
              <div className="bg-teal-900/40 p-1 rounded-xl inline-flex items-center gap-1 border border-white/15">
                <span className="text-[11px] text-teal-100 px-2 hidden sm:inline-flex items-center gap-1">
                  <ArrowLeftRight className="w-3 h-3" /> ระบบเลขขวดยา:
                </span>
                <button
                  onClick={() => setNumberingSystem('german')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                    numberingSystem === 'german'
                      ? 'bg-white text-teal-800 shadow-sm'
                      : 'text-teal-100 hover:bg-white/10'
                  }`}
                >
                  German / AU
                </button>
                <button
                  onClick={() => setNumberingSystem('us')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                    numberingSystem === 'us'
                      ? 'bg-white text-teal-800 shadow-sm'
                      : 'text-teal-100 hover:bg-white/10'
                  }`}
                >
                  US / SA
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.meta.sources.slice(0, 2).map((src) => (
                  <a
                    key={src.url}
                    href={src.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-full transition"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>{src.title}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex flex-wrap gap-2 mt-6">
            {[
              { id: 'search', label: 'ค้นหาจากอาการ / โรค', icon: Search },
              { id: 'facial', label: 'สังเกตใบหน้า & ลิ้น', icon: Eye },
              { id: 'salts', label: 'คู่มือ 12 Cell Salts', icon: BookOpen },
              { id: 'dosage', label: 'คำนวณขนาดยา', icon: Calculator },
              {
                id: 'regimen',
                label: 'ตารางยาของฉัน (Regimen)',
                icon: ClipboardList,
                badge: regimenIds.length,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-white text-teal-800 shadow-sm'
                      : 'bg-teal-800/40 text-teal-50 hover:bg-teal-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge > 0 && (
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-teal-600 text-white' : 'bg-amber-400 text-slate-900'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Disclaimer Banner */}
      <div className="bg-amber-50 border-b border-amber-200">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs md:text-sm text-amber-900">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>ข้อควรระวัง:</strong> {data.meta.disclaimer_th}
            </span>
          </div>
          {numberingSystem === 'us' && (
            <span className="text-xs bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-lg font-medium shrink-0">
              กำลังแสดงเลขแบบ US/SA (เช่น Calc sulph = #3, Nat mur = #9)
            </span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {/* TAB 1: SYMPTOM & AILMENT SEARCH */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                ค้นหาด้วยภาษาไทย ภาษาอังกฤษทั่วไป หรือศัพท์ทางการแพทย์ (Medical Terms)
              </label>
              <div className="relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="เช่น เจ็บคอ, จมูกตัน, กรดไหลย้อน, acid reflux, GERD, sciatica, neuralgia, abscess..."
                  className="w-full pl-11 pr-10 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm md:text-base"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    aria-label="ล้างคำค้นหา"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Quick Tags */}
              <div className="mt-3 flex flex-wrap gap-1.5 items-center">
                <span className="text-xs text-slate-500 mr-1">อาการพบบ่อย:</span>
                {QUICK_SYMPTOMS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition ${
                      query === tag
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-teal-400 hover:text-teal-700'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* Organ Filter Bar */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5 items-center">
                <span className="text-xs font-medium text-emerald-800 mr-1">เลือกตามอวัยวะ (Organs):</span>
                {ORGAN_FILTERS.map((org) => (
                  <button
                    key={org.query}
                    onClick={() => setQuery(query === org.query ? '' : org.query)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition ${
                      query === org.query
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-emerald-50/70 text-emerald-800 border-emerald-200 hover:border-emerald-400'
                    }`}
                  >
                    {org.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Matched Salts directly from query */}
            {query.trim() && searchResults.salts.length > 0 && (
              <section>
                <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Pill className="w-4 h-4 text-teal-600" />
                  <span>แร่ธาตุที่ตรงกับอาการ "{query}" ({searchResults.salts.length} ชนิด)</span>
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.salts.map((salt) => {
                    const inRegimen = regimenIds.includes(salt.id);
                    return (
                      <div
                        key={salt.id}
                        onClick={() => setSelectedSalt(salt)}
                        className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-teal-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span
                              className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
                              style={{ backgroundColor: salt.color }}
                            >
                              #{getDisplayNum(salt)} {salt.short_name}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              ({getAltNumLabel(salt)}) • {salt.default_potency}
                            </span>
                          </div>
                          <h3 className="font-bold text-slate-900">
                            {salt.name_en} ({salt.name_th})
                          </h3>
                          <p className="text-xs text-teal-700 font-medium mt-0.5">{salt.nickname_th}</p>
                          <p className="text-xs text-slate-600 mt-2 line-clamp-3">
                            {salt.primary_function_th}
                          </p>
                        </div>
                        <div className="mt-3 space-y-2">
                          {salt.must_take_alone && (
                            <div className="text-xs bg-cyan-50 text-cyan-800 border border-cyan-200 rounded-lg px-2.5 py-1.5">
                              ⚠️ ต้องอมแยกเดี่ยวห่างจากตัวอื่น {salt.separate_minutes} นาที
                            </div>
                          )}
                          <button
                            onClick={(e) => toggleRegimen(e, salt.id)}
                            className={`w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-lg border transition ${
                              inRegimen
                                ? 'bg-teal-600 text-white border-teal-600'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-teal-400'
                            }`}
                          >
                            {inRegimen ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                            <span>{inRegimen ? 'อยู่ในตารางยาแล้ว' : 'เพิ่มในตารางยา'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Differential Ailment Cards */}
            <section>
              <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-teal-600" />
                <span>การจำแนกกลุ่มโรคและระยะอาการ ({searchResults.ailments.length} หมวด)</span>
              </h2>
              {searchResults.ailments.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
                  ไม่พบกลุ่มโรคที่ตรงกับคำค้นหา ลองพิมพ์คำสั้นลงหรือดูในแท็บ "คู่มือ 12 Cell Salts" นะคะ
                </div>
              ) : (
                <div className="space-y-4">
                  {searchResults.ailments.map((ailment) => (
                    <div
                      key={ailment.id}
                      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                    >
                      <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <span className="text-xs font-medium text-teal-700">{ailment.category}</span>
                          <h3 className="text-lg font-bold text-slate-900">
                            {ailment.name_th}{' '}
                            <span className="text-sm font-normal text-slate-500">({ailment.name_en})</span>
                          </h3>
                        </div>
                        <button
                          onClick={() =>
                            setSelectedAilment(selectedAilment === ailment.id ? null : ailment.id)
                          }
                          className="text-xs font-medium text-teal-700 hover:underline self-start sm:self-center"
                        >
                          {selectedAilment === ailment.id ? 'แสดงเงื่อนไขจำแนก' : 'ย่อรายละเอียด'}
                        </button>
                      </div>

                      {selectedAilment !== ailment.id && (
                        <div className="p-5 divide-y divide-slate-100">
                          {ailment.differential_rules.map((rule) => {
                            const primary = saltsById[rule.primary_salt_id];
                            const secondaries = rule.secondary_salt_ids
                              .map((id) => saltsById[id])
                              .filter(Boolean);
                            return (
                              <div
                                key={rule.rule_id}
                                className="py-3.5 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-3"
                              >
                                <div className="space-y-1 flex-1">
                                  <div className="text-sm font-semibold text-slate-800">{rule.stage}</div>
                                  <div className="text-xs md:text-sm text-slate-600">
                                    <strong>อาการบ่งชี้:</strong> {rule.condition_match_th}
                                  </div>
                                  <div className="text-xs text-slate-500">{rule.note_th}</div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 shrink-0">
                                  {primary && (
                                    <div className="inline-flex items-center rounded-xl overflow-hidden shadow-sm">
                                      <button
                                        onClick={() => setSelectedSalt(primary)}
                                        className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 text-white hover:opacity-90 transition"
                                        style={{ backgroundColor: primary.color }}
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>
                                          ตัวหลัก: #{getDisplayNum(primary)} {primary.short_name}
                                        </span>
                                      </button>
                                      <button
                                        onClick={(e) => toggleRegimen(e, primary.id)}
                                        title="เพิ่ม/นำออกจากตารางยา"
                                        className={`px-2 py-1.5 text-xs font-bold border-l border-white/25 text-white transition ${
                                          regimenIds.includes(primary.id) ? 'bg-slate-900/50' : 'bg-black/20 hover:bg-black/35'
                                        }`}
                                      >
                                        {regimenIds.includes(primary.id) ? '✓' : '+'}
                                      </button>
                                    </div>
                                  )}
                                  {secondaries.map((sec) => (
                                    <div
                                      key={sec.id}
                                      className="inline-flex items-center rounded-xl border border-slate-300 bg-white overflow-hidden"
                                    >
                                      <button
                                        onClick={() => setSelectedSalt(sec)}
                                        className="text-xs font-medium px-2.5 py-1.5 text-slate-700 hover:bg-slate-50 transition"
                                      >
                                        เสริม: #{getDisplayNum(sec)} {sec.short_name}
                                      </button>
                                      <button
                                        onClick={(e) => toggleRegimen(e, sec.id)}
                                        title="เพิ่ม/นำออกจากตารางยา"
                                        className={`px-2 py-1.5 text-xs font-bold border-l border-slate-200 transition ${
                                          regimenIds.includes(sec.id)
                                            ? 'bg-teal-600 text-white'
                                            : 'text-teal-700 hover:bg-teal-50'
                                        }`}
                                      >
                                        {regimenIds.includes(sec.id) ? '✓' : '+'}
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="px-5 py-2.5 bg-rose-50 border-t border-rose-100 text-xs text-rose-800">
                        <strong>สัญญาณอันตราย:</strong> {ailment.emergency_warning_th}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* TAB 2: FACIAL & TONGUE DIAGNOSIS */}
        {activeTab === 'facial' && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-1">
                การสังเกตใบหน้า สีลิ้น เล็บ และสารคัดหลั่ง (Facial & Tongue Diagnosis)
              </h2>
              <p className="text-sm text-slate-600 mb-4">
                ค้นหาได้ทั้งภาษาไทยและภาษาอังกฤษ เช่น "ฝ้าขาว", "หน้าแดง", "waxy", "ferrum redness", "glassy", "orange peel", "age spots", "brittle nails"
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  { label: 'ฝ้าขาว (White tongue)', q: 'ฝ้าขาว' },
                  { label: 'ฝ้าเหลือง (Yellow tongue)', q: 'ฝ้าเหลือง' },
                  { label: 'หน้าแดง (Red face)', q: 'หน้าแดง' },
                  { label: 'ผิวมัน/สิว (Greasy)', q: 'greasy' },
                  { label: 'มันวาว (Glassy/Sheen)', q: 'มันวาว' },
                  { label: 'ซีด/ขี้ผึ้ง (Waxy/Pale)', q: 'waxy' },
                  { label: 'ริ้วรอย (Wrinkles)', q: 'ริ้วรอย' },
                  { label: 'จุดด่างดำ (Age spots)', q: 'age spots' },
                  { label: 'เล็บ (Nails)', q: 'nails' },
                  { label: 'รูขุมขนกว้าง (Large pores)', q: 'large pores' },
                ].map((f) => (
                  <button
                    key={f.q}
                    onClick={() => setFacialFilter(facialFilter === f.q ? '' : f.q)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition ${
                      facialFilter === f.q
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-teal-400'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={facialFilter}
                  onChange={(e) => setFacialFilter(e.target.value)}
                  placeholder="พิมพ์จุดสังเกตภาษาไทยหรืออังกฤษ เช่น ฝ้าขาว, ตาโหล, glassy skin, drinker's nose, white spots on nails..."
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                />
                {facialFilter && (
                  <button
                    onClick={() => setFacialFilter('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    aria-label="ล้างตัวกรอง"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {facialMatches.map((salt) => {
                const inRegimen = regimenIds.includes(salt.id);
                return (
                  <div
                    key={salt.id}
                    onClick={() => setSelectedSalt(salt)}
                    className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-teal-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-xs font-bold px-3 py-1 rounded-full text-white"
                            style={{ backgroundColor: salt.color }}
                          >
                            #{getDisplayNum(salt)} {salt.short_name}
                          </span>
                          <span className="text-[11px] text-slate-400">({getAltNumLabel(salt)})</span>
                        </div>
                        <span className="text-xs font-medium text-slate-500">
                          {salt.name_en} ({salt.name_th})
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-semibold text-slate-800">ใบหน้า/ผิวหนัง: </span>
                          <span className="text-slate-600">{salt.facial_signs.face_appearance}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-800">ลิ้นและรสชาติ: </span>
                          <span className="text-slate-600">{salt.facial_signs.tongue_coating}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-800">เสมหะ/สารคัดหลั่ง: </span>
                          <span className="text-slate-600">{salt.facial_signs.discharge}</span>
                        </div>
                        {salt.facial_signs.other_visible_tells_th && (
                          <div>
                            <span className="font-semibold text-slate-800">จุดสังเกตทางกายภาพอื่นๆ: </span>
                            <span className="text-slate-600">{salt.facial_signs.other_visible_tells_th}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex flex-wrap gap-1">
                        {salt.facial_signs.keywords_facial_en?.slice(0, 4).map((kw) => (
                          <span
                            key={kw}
                            className="text-[11px] bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={(e) => toggleRegimen(e, salt.id)}
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border transition ${
                          inRegimen
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-teal-400'
                        }`}
                      >
                        {inRegimen ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        <span>{inRegimen ? 'ในตารางยา' : 'เพิ่มยา'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: ALL 12 CELL SALTS */}
        {activeTab === 'salts' && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
            {orderedSalts.map((salt) => {
              const isExpanded = !!expandedSaltIds[salt.id];
              const inRegimen = regimenIds.includes(salt.id);
              return (
                <div
                  key={salt.id}
                  onClick={() => setSelectedSalt(salt)}
                  className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-teal-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
                        style={{ backgroundColor: salt.color }}
                      >
                        #{getDisplayNum(salt)} {salt.short_name}
                      </span>
                      <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        {getAltNumLabel(salt)} • {salt.default_potency}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{salt.name_en}</h3>
                    <p className="text-xs text-slate-500 italic">{salt.latin_name}</p>
                    <p className="text-sm font-semibold text-teal-700 mt-1">
                      {salt.name_th} — {salt.nickname_th}
                    </p>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {salt.primary_function_th}
                    </p>

                    {isExpanded && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="mt-3 pt-3 border-t border-slate-200 space-y-2.5 text-xs text-slate-700 bg-slate-50/80 -mx-2 px-3 py-3 rounded-xl cursor-default"
                      >
                        <div>
                          <div className="font-bold text-teal-800 mb-0.5">กลไกระดับเซลล์และพยาธิวิทยา:</div>
                          <p className="leading-relaxed">{salt.detailed_mechanism_th}</p>
                        </div>
                        <div>
                          <div className="font-bold text-teal-800 mb-0.5">โรคและอาการที่รักษาได้:</div>
                          <p className="leading-relaxed">{salt.detailed_conditions_th}</p>
                        </div>
                        <div>
                          <div className="font-bold text-amber-800 mb-0.5">เคล็ดลับการใช้จริงและข้อสังเกต:</div>
                          <p className="leading-relaxed text-amber-950">{salt.clinical_tips_th}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5">
                    <div className="flex flex-wrap gap-1">
                      {salt.keywords_th.slice(0, 4).map((kw) => (
                        <span key={kw} className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {kw}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        onClick={(e) => toggleSaltExpand(e, salt.id)}
                        className="text-xs font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2.5 py-1.5 rounded-lg transition"
                      >
                        {isExpanded ? '▲ ซ่อนคำอธิบาย' : '▼ คำอธิบายเพิ่ม'}
                      </button>
                      <button
                        onClick={(e) => toggleRegimen(e, salt.id)}
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition ${
                          inRegimen
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-teal-500'
                        }`}
                      >
                        {inRegimen ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        <span>{inRegimen ? 'ในตารางยา' : 'เพิ่มยา'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 4: DOSAGE CALCULATOR */}
        {activeTab === 'dosage' && (
          <div className="max-w-3xl mx-auto space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">คำนวณขนาดยาและวิธีรับประทาน</h2>
                <p className="text-sm text-slate-500">
                  เลือกกลุ่มผู้ใช้และลักษณะอาการเพื่อดูขนาดยาที่แนะนำ
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    กลุ่มผู้ใช้ / น้ำหนักสัตว์เลี้ยง
                  </label>
                  <select
                    value={dosageGroup}
                    onChange={(e) => setDosageGroup(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    {data.dosage_rules.map((rule) => (
                      <option key={rule.id} value={rule.id}>
                        {rule.label_th}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    ลักษณะอาการ
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setDosageMode('acute')}
                      className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition ${
                        dosageMode === 'acute'
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-teal-400'
                      }`}
                    >
                      เฉียบพลัน (Acute)
                    </button>
                    <button
                      onClick={() => setDosageMode('chronic')}
                      className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition ${
                        dosageMode === 'chronic'
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-teal-400'
                      }`}
                    >
                      เรื้อรัง (Chronic)
                    </button>
                  </div>
                </div>
              </div>

              {activeDosageRule && (
                <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5 space-y-3">
                  <div className="text-xs font-semibold text-teal-700 uppercase tracking-wide">
                    คำแนะนำสำหรับ: {activeDosageRule.label_th} (
                    {dosageMode === 'acute' ? 'กรณีเฉียบพลัน' : 'กรณีเรื้อรัง'})
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl p-3.5 border border-teal-100">
                      <div className="text-xs text-slate-500">ปริมาณต่อครั้ง</div>
                      <div className="text-base font-bold text-slate-900 mt-0.5">
                        {activeDosageRule[dosageMode].dose}
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-3.5 border border-teal-100">
                      <div className="text-xs text-slate-500">ความถี่ในการให้ยา</div>
                      <div className="text-base font-bold text-slate-900 mt-0.5">
                        {activeDosageRule[dosageMode].frequency}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-teal-950 bg-white/80 rounded-xl p-3.5 border border-teal-100">
                    <strong>วิธีรับประทาน / เตรียมยา:</strong> {activeDosageRule[dosageMode].method}
                  </div>
                </div>
              )}

              <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4 text-sm text-cyan-950">
                <strong>กฎสำคัญที่ต้องจำเสมอ:</strong> สามารถอมแร่ธาตุหลายชนิดรวมกันได้{' '}
                <strong>
                  ยกเว้น #{numberingSystem === 'us' ? '9' : '8'} Sodium Chloride (Nat mur)
                </strong>{' '}
                ที่ต้องอมแยกเดี่ยวห่างจากตัวอื่นอย่างน้อย <strong>5–10 นาที</strong> เพื่อไม่ให้รบกวนการดูดซึมของแร่ธาตุชนิดอื่น
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: MY REMEDY REGIMEN */}
        {activeTab === 'regimen' && (
          <div className="max-w-4xl mx-auto space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    ตารางรับประทานยาของฉัน (My Remedy Regimen)
                  </h2>
                  <p className="text-sm text-slate-500">
                    รวมรายการแร่ธาตุที่เลือกไว้ พร้อมจัดลำดับรอบทานและแยกเวลาให้อัตโนมัติ
                  </p>
                </div>
                {regimenSalts.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyRegimen}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-2 rounded-xl transition"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedMsg ? 'คัดลอกแล้ว!' : 'คัดลอกตารางยา'}</span>
                    </button>
                    <button
                      onClick={() => setRegimenIds([])}
                      className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-xl border border-rose-200 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ล้างทั้งหมด</span>
                    </button>
                  </div>
                )}
              </div>

              {regimenSalts.length === 0 ? (
                <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-3">
                  <ClipboardList className="w-10 h-10 text-slate-400 mx-auto" />
                  <div className="text-sm text-slate-600">
                    ยังไม่มีรายการยาในตารางของคุณค่ะ กดปุ่ม <strong>+ เพิ่มในตารางยา</strong> จากหน้าค้นหาหรือคู่มือ 12 Cell Salts ได้เลย
                  </div>
                  <button
                    onClick={() => setActiveTab('search')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold bg-teal-600 text-white px-4 py-2 rounded-xl hover:bg-teal-700 transition"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>ไปหน้าค้นหาอาการ</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* Regimen Controls */}
                  <div className="grid sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        กลุ่มผู้ใช้
                      </label>
                      <select
                        value={dosageGroup}
                        onChange={(e) => setDosageGroup(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                      >
                        {data.dosage_rules.map((rule) => (
                          <option key={rule.id} value={rule.id}>
                            {rule.label_th}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        ลักษณะอาการ
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setDosageMode('acute')}
                          className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                            dosageMode === 'acute'
                              ? 'bg-teal-600 text-white border-teal-600'
                              : 'bg-white text-slate-700 border-slate-300'
                          }`}
                        >
                          เฉียบพลัน (Acute)
                        </button>
                        <button
                          onClick={() => setDosageMode('chronic')}
                          className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                            dosageMode === 'chronic'
                              ? 'bg-teal-600 text-white border-teal-600'
                              : 'bg-white text-slate-700 border-slate-300'
                          }`}
                        >
                          เรื้อรัง (Chronic)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Safety Alerts */}
                  {hasNatMurInRegimen && otherSaltsInRegimen.length > 0 && (
                    <div className="bg-cyan-50 border border-cyan-300 rounded-xl p-4 text-sm text-cyan-950 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-cyan-700" />
                        <span>ตรวจพบ Nat mur (#{getDisplayNum(saltsById[8])}) ร่วมกับแร่ธาตุอื่น — ระบบจัดรอบแยกเวลาให้แล้ว</span>
                      </div>
                      <p className="text-xs text-cyan-900">
                        เพื่อไม่ให้ Nat mur เปลี่ยนประจุไอออนและลดการดูดซึมของตัวอื่น ให้อมตัวอื่นๆ ก่อน แล้วพัก 5–10 นาทีจึงอม Nat mur แยกเดี่ยว
                      </p>
                    </div>
                  )}

                  {hasSilicaInRegimen && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-950">
                      <strong>หมายเหตุสำหรับ Silica (#{getDisplayNum(saltsById[11])}):</strong> หากมีวัสดุฝังในร่างกาย (เช่น รากฟันเทียม สกรู/เหล็กดามกระดูก) ควรปรึกษาผู้เชี่ยวชาญก่อนใช้ต่อเนื่อง
                    </div>
                  )}

                  {/* Generated Schedule */}
                  <div className="space-y-4">
                    {hasNatMurInRegimen && otherSaltsInRegimen.length > 0 ? (
                      <>
                        <div className="border border-teal-200 bg-teal-50/50 rounded-2xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-teal-900">
                              รอบที่ 1: อมแร่ธาตุเหล่านี้รวมกันได้
                            </span>
                            <span className="text-xs bg-teal-100 text-teal-800 px-2.5 py-0.5 rounded-full font-semibold">
                              อย่างละ {activeDosageRule[dosageMode].dose} • {activeDosageRule[dosageMode].frequency}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {otherSaltsInRegimen.map((s) => (
                              <div
                                key={s.id}
                                className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs shadow-sm"
                              >
                                <span
                                  className="font-bold px-2 py-0.5 rounded-full text-white"
                                  style={{ backgroundColor: s.color }}
                                >
                                  #{getDisplayNum(s)} {s.short_name}
                                </span>
                                <span className="font-medium text-slate-700">{s.name_th}</span>
                                <button
                                  onClick={(e) => toggleRegimen(e, s.id)}
                                  className="text-slate-400 hover:text-rose-600"
                                  title="นำออก"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="text-center text-xs font-bold text-cyan-800 bg-cyan-50 border border-cyan-200 py-1.5 rounded-lg">
                          ⏱ พักรออย่างน้อย 5–10 นาที (ดื่มน้ำเปล่าล้างปากได้)
                        </div>

                        <div className="border border-cyan-300 bg-cyan-50/60 rounded-2xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-cyan-950">
                              รอบที่ 2: อมแยกเดี่ยวเสมอ
                            </span>
                            <span className="text-xs bg-cyan-100 text-cyan-900 px-2.5 py-0.5 rounded-full font-semibold">
                              {activeDosageRule[dosageMode].dose} • {activeDosageRule[dosageMode].frequency}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(() => {
                              const nat = saltsById[8];
                              return (
                                <div className="inline-flex items-center gap-2 bg-white border border-cyan-200 rounded-xl px-3 py-2 text-xs shadow-sm">
                                  <span
                                    className="font-bold px-2 py-0.5 rounded-full text-white"
                                    style={{ backgroundColor: nat.color }}
                                  >
                                    #{getDisplayNum(nat)} {nat.short_name}
                                  </span>
                                  <span className="font-medium text-slate-700">{nat.name_th}</span>
                                  <button
                                    onClick={(e) => toggleRegimen(e, nat.id)}
                                    className="text-slate-400 hover:text-rose-600"
                                    title="นำออก"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="border border-teal-200 bg-teal-50/50 rounded-2xl p-4 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="text-sm font-bold text-teal-900">
                            รายการแร่ธาตุที่เลือก (อมรวมกันในครั้งเดียวได้)
                          </span>
                          <span className="text-xs bg-teal-100 text-teal-800 px-2.5 py-0.5 rounded-full font-semibold self-start">
                            อย่างละ {activeDosageRule[dosageMode].dose} • {activeDosageRule[dosageMode].frequency}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {regimenSalts.map((s) => (
                            <div
                              key={s.id}
                              className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs shadow-sm"
                            >
                              <span
                                className="font-bold px-2 py-0.5 rounded-full text-white"
                                style={{ backgroundColor: s.color }}
                              >
                                #{getDisplayNum(s)} {s.short_name}
                              </span>
                              <span className="font-medium text-slate-700">{s.name_th}</span>
                              <button
                                onClick={(e) => toggleRegimen(e, s.id)}
                                className="text-slate-400 hover:text-rose-600"
                                title="นำออก"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                      <strong>วิธีรับประทาน ({activeDosageRule.label_th}):</strong>{' '}
                      {activeDosageRule[dosageMode].method}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Salt Detail Modal */}
      {selectedSalt && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedSalt(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span
                    className="inline-block text-xs font-bold px-3 py-1 rounded-full text-white"
                    style={{ backgroundColor: selectedSalt.color }}
                  >
                    #{getDisplayNum(selectedSalt)} {selectedSalt.short_name} • {selectedSalt.default_potency}
                  </span>
                  <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    {getAltNumLabel(selectedSalt)}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  {selectedSalt.name_en} ({selectedSalt.name_th})
                </h2>
                <p className="text-sm text-slate-500 italic">
                  {selectedSalt.latin_name} — {selectedSalt.nickname_th}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => toggleRegimen(e, selectedSalt.id)}
                  className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl border transition ${
                    regimenIds.includes(selectedSalt.id)
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-slate-50 text-slate-700 border-slate-300 hover:border-teal-500'
                  }`}
                >
                  {regimenIds.includes(selectedSalt.id) ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>{regimenIds.includes(selectedSalt.id) ? 'อยู่ในตารางยา' : 'เพิ่มในตารางยา'}</span>
                </button>
                <button
                  onClick={() => setSelectedSalt(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {selectedSalt.must_take_alone && (
              <div className="bg-cyan-50 border border-cyan-200 text-cyan-900 rounded-xl p-3 text-sm">
                ⚠️ {selectedSalt.administration_note_th}
              </div>
            )}

            <div className="space-y-3 text-sm">
              <div>
                <h3 className="font-bold text-slate-800">หน้าที่หลักทางชีวเคมี</h3>
                <p className="text-slate-600 mt-0.5">{selectedSalt.primary_function_th}</p>
              </div>

              {selectedSalt.detailed_mechanism_th && (
                <div className="bg-teal-50/70 border border-teal-100 rounded-xl p-3.5 space-y-2">
                  <div>
                    <h4 className="font-bold text-teal-900">กลไกระดับเซลล์และพยาธิวิทยา</h4>
                    <p className="text-slate-700 mt-0.5 leading-relaxed">{selectedSalt.detailed_mechanism_th}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-teal-900">โรคและอาการที่รักษาได้ทั้งหมด</h4>
                    <p className="text-slate-700 mt-0.5 leading-relaxed">{selectedSalt.detailed_conditions_th}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-amber-900">เคล็ดลับการใช้จริงและข้อสังเกต</h4>
                    <p className="text-amber-950 mt-0.5 leading-relaxed">{selectedSalt.clinical_tips_th}</p>
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-bold text-slate-800">บริเวณเป้าหมาย</h3>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {selectedSalt.target_areas.map((area) => (
                    <span key={area} className="text-xs bg-teal-50 text-teal-800 px-2.5 py-1 rounded-lg">
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              {selectedSalt.organs && selectedSalt.organs.length > 0 && (
                <div>
                  <h3 className="font-bold text-slate-800">อวัยวะที่เกี่ยวข้อง (Organs)</h3>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {selectedSalt.organs.map((org) => (
                      <span
                        key={org}
                        className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg"
                      >
                        {org}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-slate-50 rounded-xl p-4 space-y-2 border border-slate-200">
                <h3 className="font-bold text-slate-800">จุดสังเกตบนใบหน้า ลิ้น และสารคัดหลั่ง</h3>
                <p className="text-slate-600">
                  <strong>ใบหน้า/ผิว:</strong> {selectedSalt.facial_signs.face_appearance}
                </p>
                <p className="text-slate-600">
                  <strong>ลิ้น:</strong> {selectedSalt.facial_signs.tongue_coating}
                </p>
                <p className="text-slate-600">
                  <strong>เสมหะ/สิ่งขับหลั่ง:</strong> {selectedSalt.facial_signs.discharge}
                </p>
                {selectedSalt.facial_signs.other_visible_tells_th && (
                  <p className="text-slate-600">
                    <strong>จุดสังเกตทางกายภาพอื่นๆ:</strong> {selectedSalt.facial_signs.other_visible_tells_th}
                  </p>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="bg-rose-50 rounded-xl p-3 border border-rose-100">
                  <div className="text-xs font-bold text-rose-800 mb-1">อาการแย่ลงเมื่อ (Worse)</div>
                  <ul className="text-xs text-rose-900 list-disc list-inside space-y-0.5">
                    {selectedSalt.modalities.worse_with.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                  <div className="text-xs font-bold text-emerald-800 mb-1">อาการดีขึ้นเมื่อ (Better)</div>
                  <ul className="text-xs text-emerald-900 list-disc list-inside space-y-0.5">
                    {selectedSalt.modalities.better_with.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 mb-1.5">อาการและโรคที่เกี่ยวข้อง (ภาษาไทย)</h3>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSalt.keywords_th.map((kw) => (
                    <span
                      key={kw}
                      className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              {selectedSalt.keywords_en_common && selectedSalt.keywords_en_common.length > 0 && (
                <div>
                  <h3 className="font-bold text-slate-800 mb-1.5">
                    Everyday English Terms (คำค้นอาการทั่วไป)
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSalt.keywords_en_common.map((kw) => (
                      <span
                        key={kw}
                        className="text-xs bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-1 rounded-full"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedSalt.keywords_en_medical && selectedSalt.keywords_en_medical.length > 0 && (
                <div>
                  <h3 className="font-bold text-slate-800 mb-1.5">
                    Medical & Classical Terms (ศัพท์ทางการแพทย์ / ตำรา Dr. Schüssler)
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSalt.keywords_en_medical.map((kw) => (
                      <span
                        key={kw}
                        className="text-xs bg-indigo-50 text-indigo-800 border border-indigo-200 px-2.5 py-1 rounded-full"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-10">
        <div className="max-w-6xl mx-auto px-4 py-4 text-xs text-slate-500 flex flex-col sm:flex-row justify-between gap-2">
          <span>Tissue Salts Finder • ข้อมูลเพื่อการศึกษาเท่านั้น</span>
          <span>
            อ้างอิง:{' '}
            <a
              href="https://themineralbody.com/"
              target="_blank"
              rel="noreferrer"
              className="text-teal-700 hover:underline"
            >
              The Mineral Body
            </a>{' '}
            & Dr. Schüssler's Biochemic System
          </span>
        </div>
      </footer>
    </div>
  );
}

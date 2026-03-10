import React, { useState } from 'react';
import { Search, Book, List as ListIcon, Loader2, BookOpen, ChevronRight } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';

// Initialize Gemini API safely
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const commonWords = [
  { word: 'الله', meaning: 'خودێ' },
  { word: 'رب', meaning: 'پەروەردگار' },
  { word: 'رحمن', meaning: 'دلۆڤان' },
  { word: 'رحيم', meaning: 'میهرەبان' },
  { word: 'مالك', meaning: 'خودان / سەروەر' },
  { word: 'يوم', meaning: 'ڕۆژ' },
  { word: 'دين', meaning: 'ئایین / پاداشت' },
  { word: 'إياك', meaning: 'ب تنێ تە' },
  { word: 'نعبد', meaning: 'ئەم پەرستنێ دکەین' },
  { word: 'نستعين', meaning: 'ئەم هاریكاریێ دخوازین' },
  { word: 'اهدنا', meaning: 'مە رێنمایی بکە' },
  { word: 'صراط', meaning: 'ڕێك' },
  { word: 'مستقيم', meaning: 'ڕاست' },
  { word: 'صلاة', meaning: 'نڤێژ' },
  { word: 'زكاة', meaning: 'زەكات' },
  { word: 'سماء', meaning: 'ئەسمان' },
  { word: 'أرض', meaning: 'ئەرد' },
  { word: 'شمس', meaning: 'ڕۆژ (تەڤ)' },
  { word: 'قمر', meaning: 'هەیڤ' },
  { word: 'ماء', meaning: 'ئاڤ' },
  { word: 'نار', meaning: 'ئاگر' },
  { word: 'جنة', meaning: 'بەهەشت' },
  { word: 'علم', meaning: 'زانین' },
  { word: 'كتاب', meaning: 'پەرتووک' },
  { word: 'نبي', meaning: 'پێغەمبەر' },
  { word: 'رسول', meaning: 'هنارتی' },
  { word: 'ملائكة', meaning: 'فریشتە' },
  { word: 'إنسان', meaning: 'مرۆڤ' },
  { word: 'حياة', meaning: 'ژیان' },
  { word: 'موت', meaning: 'مرن' },
  { word: 'حق', meaning: 'راستی / حەق' },
  { word: 'باطل', meaning: 'بەتاڵ / نەڕاست' },
  { word: 'نور', meaning: 'ڕۆناهی' },
  { word: 'ظلمات', meaning: 'تاریاتی' },
  { word: 'قلب', meaning: 'دل' },
  { word: 'عقل', meaning: 'هزر / ئەقل' },
  { word: 'خير', meaning: 'باشی / خێر' },
  { word: 'شر', meaning: 'خرابی / شەڕ' },
  { word: 'سلام', meaning: 'ئاشتی / سەلامەتی' },
  { word: 'مؤمن', meaning: 'باوەڕدار' },
  { word: 'كافر', meaning: 'بێ باوەڕ' },
  { word: 'عمل', meaning: 'کار / کردەوە' },
  { word: 'صبر', meaning: 'بێهنفرەهی / سەبر' },
  { word: 'شكر', meaning: 'سووپاسگوزاری' },
  { word: 'غفور', meaning: 'لێخۆشبوو' },
  { word: 'عذاب', meaning: 'سزا / ئەزاب' },
  { word: 'ثواب', meaning: 'پاداشت / خێر' },
  { word: 'دنيا', meaning: 'جیهان / دونیا' },
  { word: 'آخرة', meaning: 'قیامەت / ئاخیرەت' },
  { word: 'هدى', meaning: 'رێنمایی / هیدایەت' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'dictionary' | 'list'>('dictionary');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<{ word: string; meaning: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPart, setSelectedPart] = useState<number | null>(null);
  const [partWords, setPartWords] = useState<Record<number, {word: string, meaning: string}[]>>({
    1: commonWords
  });
  const [isLoadingPart, setIsLoadingPart] = useState(false);

  const loadPartWords = async (part: number) => {
    setSelectedPart(part);
    
    const expectedCount = part === 100 ? 184 : 190;
    
    // 1. Check memory state
    if (partWords[part] && partWords[part].length >= expectedCount) {
      return;
    }

    // 2. Check offline cache (localStorage)
    const cached = localStorage.getItem(`quran_words_part_${part}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.length > 0) {
          setPartWords(prev => ({ ...prev, [part]: parsed }));
          return;
        }
      } catch (e) {
        console.error("Cache parse error", e);
      }
    }

    // 3. Fetch from API if not cached
    if (!ai) {
      setError('کۆدا نهێنی یا API (GEMINI_API_KEY) ل Netlify نەهاتیە دانان. ژ کەرەما خۆ ل بەشێ Environment Variables زێدە بکە.');
      return;
    }

    setIsLoadingPart(true);
    setError('');

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a JSON array of exactly ${expectedCount} unique Quranic Arabic words and their Kurmanji Kurdish (Arabic script) translations. This is for part ${part} out of 100 of a Quranic dictionary. Ensure the words are diverse and appropriate for a comprehensive dictionary.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING, description: "Quranic Arabic word" },
                meaning: { type: Type.STRING, description: "Kurmanji Kurdish translation in Arabic script" }
              },
              required: ["word", "meaning"]
            }
          }
        }
      });

      const text = response.text?.trim();
      if (text) {
        const words = JSON.parse(text);
        setPartWords(prev => ({ ...prev, [part]: words }));
        // Save to offline cache
        localStorage.setItem(`quran_words_part_${part}`, JSON.stringify(words));
      } else {
        throw new Error("Empty response");
      }
    } catch (err) {
      console.error(err);
      setError('خەلەتیەک چێبوو د دەمێ ئینانا پەیڤان دا. هیڤییە دوبارە هەول بدە.');
      setSelectedPart(null);
    } finally {
      setIsLoadingPart(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const query = searchQuery.trim();
    
    // Check local dictionary first
    const localMatch = commonWords.find(w => w.word === query || w.meaning.includes(query));
    if (localMatch) {
      setSearchResult(localMatch);
      setError('');
      return;
    }

    // If not found, use Gemini API
    if (!ai) {
      setError('کۆدا نهێنی یا API (GEMINI_API_KEY) ل Netlify نەهاتیە دانان. ژ کەرەما خۆ ل بەشێ Environment Variables زێدە بکە.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSearchResult(null);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `What is the meaning of the Quranic Arabic word "${query}" in Kurdish (Kurmanji)? Provide ONLY the short, direct translation in Kurmanji Kurdish (using Arabic script), without any extra explanation. If the input is in Kurdish, provide the Arabic Quranic word.`,
      });

      const meaning = response.text?.trim() || 'نەهاتە دیتن';
      setSearchResult({ word: query, meaning });
    } catch (err) {
      console.error(err);
      setError('خەلەتیەک چێبوو د دەمێ گەڕیانێ دا. هیڤییە دوبارە هەول بدە.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 font-sans" dir="rtl">
      {/* Header */}
      <header className="bg-emerald-700 text-white shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                فەرهەنگا پەیڤێن قورئانێ
              </h1>
              <p className="mt-2 text-emerald-100/90 text-lg">
                لێگەڕیان و لیستا پەیڤێن قورئانا پیرۆز ب زمانێ کوردی
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex space-x-2 space-x-reverse mb-8 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200/60 w-fit">
          <button
            onClick={() => setActiveTab('dictionary')}
            className={`px-6 py-2.5 rounded-xl text-base font-medium flex items-center gap-2 transition-all ${
              activeTab === 'dictionary'
                ? 'bg-emerald-100/80 text-emerald-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Search className="w-4 h-4" />
            قامووس
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-6 py-2.5 rounded-xl text-base font-medium flex items-center gap-2 transition-all ${
              activeTab === 'list'
                ? 'bg-emerald-100/80 text-emerald-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <ListIcon className="w-4 h-4" />
            لیستا پەیڤان
          </button>
        </div>

        {/* Dictionary Tab */}
        {activeTab === 'dictionary' && (
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200/60">
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
              <label htmlFor="search" className="block text-base font-medium text-slate-700 mb-3">
                ل پەیڤەکێ بگەڕە (ب عەرەبی یان کوردی)
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    id="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="نموونە: رحمن, ئاڤ..."
                    className="block w-full pr-11 pl-4 py-3.5 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-lg bg-slate-50 focus:bg-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !searchQuery.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3.5 rounded-2xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'لێگەڕیان'}
                </button>
              </div>
            </form>

            {error && (
              <div className="max-w-2xl mx-auto p-4 bg-red-50/80 text-red-700 rounded-2xl border border-red-100 mb-6 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                {error}
              </div>
            )}

            {searchResult && (
              <div className="max-w-2xl mx-auto bg-gradient-to-br from-emerald-50 to-teal-50/30 border border-emerald-100/80 rounded-3xl p-10 text-center shadow-sm">
                <h2 className="text-5xl font-bold text-emerald-950 mb-6 font-serif leading-tight">
                  {searchResult.word}
                </h2>
                <div className="w-12 h-1.5 bg-emerald-200/60 mx-auto mb-6 rounded-full"></div>
                <p className="text-2xl text-emerald-800 font-medium">
                  {searchResult.meaning}
                </p>
              </div>
            )}

            {!searchResult && !isLoading && !error && (
              <div className="text-center py-16 text-slate-400 max-w-md mx-auto">
                <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5">
                  <Book className="w-10 h-10 text-slate-300" />
                </div>
                <p className="text-lg text-slate-500 font-medium">پەیڤەکێ بنڤیسە بۆ دیتنا رامانا وێ</p>
                <p className="text-sm mt-3 text-slate-400 leading-relaxed">ئەگەر پەیڤ د لیستا مە دا نەبیت، دێ ب رێکا ژیرییا دەستکرد (AI) هێتە وەرگرتن و وەرگێڕان بۆ کوردی.</p>
              </div>
            )}
          </div>
        )}

        {/* List Tab */}
        {activeTab === 'list' && (
          <div className="space-y-6">
            {!selectedPart && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
                <div className="bg-white p-4 rounded-2xl shadow-sm text-emerald-600 shrink-0">
                  <BookOpen className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-emerald-900 mb-2">زانیاری ل سەر پەیڤێن قورئانێ</h3>
                  <p className="text-emerald-800/80 leading-relaxed">
                    د قورئانا پیرۆز دا نێزیکی <strong className="font-bold">٧٧,٤٣٠</strong> پەیڤ هەنە، لێ ئەگەر پەیڤێن دووبارەبووی لاببەین، نێزیکی <strong className="font-bold">١٨,٩٩٤</strong> پەیڤێن جودا دمینن. ل ڤێرە مە لیستەکا پەیڤێن هەرە بەربەلاڤ کرینە ١٠٠ بەش.
                  </p>
                </div>
              </div>
            )}

            {!selectedPart ? (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden p-6 md:p-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">بەشێن پەیڤان (١٠٠ بەش)</h2>
                {error && (
                  <div className="p-4 bg-red-50 text-red-700 rounded-xl mb-6 border border-red-100">
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {Array.from({ length: 100 }, (_, i) => i + 1).map((part) => (
                    <button
                      key={part}
                      onClick={() => loadPartWords(part)}
                      className="relative p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 transition-all flex flex-col items-center justify-center gap-2 group"
                    >
                      {localStorage.getItem(`quran_words_part_${part}`) || part === 1 ? (
                        <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-emerald-500 rounded-full" title="ئۆفلاین بەردەستە"></div>
                      ) : null}
                      <Book className="w-6 h-6 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                      <span className="font-bold text-lg">بەشێ {part}</span>
                      <span className="text-xs text-slate-400">{part === 100 ? '١٨٤' : '١٩٠'} پەیڤ</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
                <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">پەیڤێن بەشێ {selectedPart}</h2>
                    <p className="text-slate-500 mt-2 text-lg">{selectedPart === 100 ? '١٨٤' : '١٩٠'} پەیڤ د ڤی بەشی دا هەنە.</p>
                  </div>
                  <button
                    onClick={() => setSelectedPart(null)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 font-medium transition-colors shrink-0"
                  >
                    <ChevronRight className="w-5 h-5" />
                    ڤەگەڕە بۆ بەشان
                  </button>
                </div>
                
                {isLoadingPart ? (
                  <div className="p-20 flex flex-col items-center justify-center text-emerald-600">
                    <Loader2 className="w-12 h-12 animate-spin mb-4" />
                    <p className="text-lg font-medium">پەیڤ دهێنە ئامادەکرن ژ لایێ ژیرییا دەستکرد ڤە...</p>
                    <p className="text-sm text-slate-500 mt-2">دبیت چەند چرکەیەک پێبچیت ژبەر زۆرییا پەیڤان ({selectedPart === 100 ? '١٨٤' : '١٩٠'} پەیڤ)</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0">
                      {partWords[selectedPart]?.map((item, index) => (
                        <div 
                          key={index} 
                          className="p-6 border-b border-l border-slate-100 hover:bg-emerald-50/40 transition-colors flex flex-col justify-center items-center text-center group"
                        >
                          <span className="text-3xl font-bold text-slate-800 font-serif mb-3 group-hover:text-emerald-700 transition-colors">{item.word}</span>
                          <span className="text-emerald-600 font-medium text-lg bg-emerald-50 px-4 py-1 rounded-full">{item.meaning}</span>
                        </div>
                      ))}
                    </div>
                    <div className="p-6 text-center text-slate-500 bg-slate-50/50 border-t border-slate-100">
                      <p>ئەڤ پەیڤە هاتینە خەزنکرن و نوکە ب شێوەیێ <strong className="text-emerald-600">ئۆفلاین</strong> د بەردەستن.</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

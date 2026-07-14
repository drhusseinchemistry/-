import React, { useState, useMemo, useEffect } from 'react';
import { Search, Book, List as ListIcon, Loader2, BookOpen, ChevronRight, Key, Save, Check, Play, Volume2, MessageCircle, BookHeart, Pause, Image as ImageIcon, Download, Sun, Moon, Type as TypeIcon, Plus, Minus, Minimize2 } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import { motion, AnimatePresence } from 'motion/react';

const commonWords = [
  { word: 'ٱللَّهُ', meaning: 'خودێ' },
  { word: 'رَبِّ', meaning: 'پەروەردگار' },
  { word: 'ٱلرَّحْمَٰنِ', meaning: 'دلۆڤان' },
  { word: 'ٱلرَّحِيمِ', meaning: 'میهرەبان' },
  { word: 'مَٰلِكِ', meaning: 'خودان / سەروەر' },
  { word: 'يَوْمِ', meaning: 'ڕۆژ' },
  { word: 'ٱلدِّينِ', meaning: 'ئایین / پاداشت' },
  { word: 'إِيَّاكَ', meaning: 'ب تنێ تە' },
  { word: 'نَعْبُدُ', meaning: 'ئەم پەرستنێ دکەین' },
  { word: 'نَسْتَعِينُ', meaning: 'ئەم هاریكاریێ دخوازین' },
  { word: 'ٱهْدِنَا', meaning: 'مە رێنمایی بکە' },
  { word: 'ٱلصِّرَٰطَ', meaning: 'ڕێك' },
  { word: 'ٱلْمُسْتَقِيمَ', meaning: 'ڕاست' },
  { word: 'صَلَوٰةٌ', meaning: 'نڤێژ' },
  { word: 'زَكَوٰةٌ', meaning: 'زەكات' },
  { word: 'سَمَآءٌ', meaning: 'ئەسمان' },
  { word: 'أَرْضٌ', meaning: 'ئەرد' },
  { word: 'شَمْسٌ', meaning: 'ڕۆژ (تەڤ)' },
  { word: 'قَمَرٌ', meaning: 'هەیڤ' },
  { word: 'مَآءٌ', meaning: 'ئاڤ' },
  { word: 'نَارٌ', meaning: 'ئاگر' },
  { word: 'جَنَّةٌ', meaning: 'بەهەشت' },
  { word: 'عِلْمٌ', meaning: 'زانین' },
  { word: 'كِتَٰبٌ', meaning: 'پەرتووک' },
  { word: 'نَبِىٌّ', meaning: 'پێغەمبەر' },
  { word: 'رَسُولٌ', meaning: 'هنارتی' },
  { word: 'مَلَٰٓئِكَةٌ', meaning: 'فریشتە' },
  { word: 'إِنسَٰنٌ', meaning: 'مرۆڤ' },
  { word: 'حَيَوٰةٌ', meaning: 'ژیان' },
  { word: 'مَوْتٌ', meaning: 'مرن' },
  { word: 'حَقٌّ', meaning: 'راستی / حەق' },
  { word: 'بَٰطِلٌ', meaning: 'بەتاڵ / نەڕاست' },
  { word: 'نُورٌ', meaning: 'ڕۆناهی' },
  { word: 'ظُلُمَٰتٌ', meaning: 'تاریاتی' },
  { word: 'قَلْبٌ', meaning: 'دل' },
  { word: 'عَقْلٌ', meaning: 'هزر / ئەقل' },
  { word: 'خَيْرٌ', meaning: 'باشی / خێر' },
  { word: 'شەرٌّ', meaning: 'خرابی / شەڕ' },
  { word: 'سَلَٰمٌ', meaning: 'ئاشتی / سەلامەتی' },
  { word: 'مُؤْمِنٌ', meaning: 'باوەڕدار' },
  { word: 'كَافِرٌ', meaning: 'بێ باوەڕ' },
  { word: 'عَمَلٌ', meaning: 'کار / کردەوە' },
  { word: 'صَبْرٌ', meaning: 'بێهنفرەهی / سەبر' },
  { word: 'شُكْرٌ', meaning: 'سووپاسگوزاری' },
  { word: 'غَفُورٌ', meaning: 'لێخۆشبوو' },
  { word: 'عَذَابٌ', meaning: 'سزا / ئەزاب' },
  { word: 'ثَوَابٌ', meaning: 'پاداشت / خێر' },
  { word: 'دُنْيَا', meaning: 'جیهان / دونیا' },
  { word: 'ءَاخِرَةٌ', meaning: 'قیامەت / ئاخیرەت' },
  { word: 'هُدًى', meaning: 'رێنمایی / هیدایەت' }
];

const cleanTajweed = (text: string) => {
  if (!text) return '';
  // Remove black circle (U+25CF)
  return text.replace(/\u25CF/g, '');
};

const getCorrectWordAudioUrl = (word: any, wordsList: any[], verseKey: string): string => {
  if (!word || !wordsList || !verseKey) return word?.audio_url || '';
  
  // Parse surah and verse
  const [surahStr, verseStr] = verseKey.split(':');
  const surahNum = parseInt(surahStr);
  const verseNum = parseInt(verseStr);
  if (isNaN(surahNum) || isNaN(verseNum)) return word.audio_url || '';
  
  // Filter words that are actual spoken words
  const spokenWords = wordsList.filter((w: any) => w.char_type_name === 'word');
  const wordIndex = spokenWords.findIndex((w: any) => w.id === word.id);
  
  if (wordIndex === -1) {
    return word.audio_url || '';
  }
  
  const spokenWordNum = wordIndex + 1;
  const pad3 = (num: number) => String(num).padStart(3, '0');
  
  return `wbw/${pad3(surahNum)}_${pad3(verseNum)}_${pad3(spokenWordNum)}.mp3`;
};

import { surahs as surahList } from './constants';

// A helper to render elegant gold corner flourishes for the Mus'haf page border
const CornerOrnament = ({ position }: { position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }) => {
  const rotationClass = {
    'top-left': '',
    'top-right': 'rotate-90',
    'bottom-right': 'rotate-180',
    'bottom-left': '-rotate-90',
  }[position];

  return (
    <svg 
      className={`absolute w-10 h-10 sm:w-16 sm:h-16 text-amber-600/40 dark:text-amber-500/30 pointer-events-none ${rotationClass} ${
        position.startsWith('top') ? 'top-0' : 'bottom-0'
      } ${
        position.endsWith('left') ? 'left-0' : 'right-0'
      }`} 
      viewBox="0 0 100 100" 
      fill="currentColor"
    >
      <path d="M0 0 L100 0 C90 10, 90 20, 80 30 C70 40, 60 40, 50 50 C40 60, 40 70, 30 80 C20 90, 10 90, 0 100 Z" opacity="0.1" />
      <path d="M0 0 H40 C32 8, 24 12, 20 20 C12 24, 8 32, 0 40 Z" />
      <path d="M0 0 V40 C8 32, 12 24, 20 20 C24 12, 32 8, 40 0 Z" />
      <circle cx="12" cy="12" r="4" fill="#d97706" />
      <circle cx="20" cy="20" r="2.5" fill="#d97706" />
      <circle cx="28" cy="28" r="1.5" fill="#d97706" />
    </svg>
  );
};

// A helper to render a stunning gold Medina-style verse marker
const VerseEndMarker = ({ num, isPlaying, onClick }: { num: string; isPlaying: boolean; onClick: () => void }) => {
  const toArabicNumerals = (str: string) => {
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return str.replace(/[0-9]/g, (w) => arabicDigits[parseInt(w)]);
  };

  return (
    <span 
      onClick={onClick}
      className={`inline-flex items-center justify-center mx-1.5 cursor-pointer select-none transition-transform hover:scale-115 active:scale-90 ${
        isPlaying ? 'scale-105' : ''
      }`}
      title={`ئایەتا ${num} - کلیک بکە بۆ تەفسیر و دەنگی`}
    >
      <svg className="w-7 h-7 sm:w-8 sm:h-8 inline-block align-middle" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Outer star/polygon ornament */}
        <path 
          d="M50 2 C58 12 68 12 78 22 C88 32 88 42 98 50 C88 58 88 68 78 78 C68 88 58 88 50 98 C42 88 32 88 22 78 C12 68 12 58 2 50 C12 42 12 32 22 22 C32 12 42 12 50 2 Z" 
          fill={isPlaying ? "url(#gold-grad-active)" : "url(#gold-grad)"} 
          stroke={isPlaying ? "#10b981" : "#b45309"} 
          strokeWidth="3.5"
        />
        {/* Inner circle */}
        <circle cx="50" cy="50" r="26" fill={isPlaying ? "#10b981" : "#fcfaf6"} stroke={isPlaying ? "#047857" : "#d97706"} strokeWidth="2" />
        {/* Small golden beads */}
        <circle cx="50" cy="18" r="3.5" fill="#b45309" />
        <circle cx="50" cy="82" r="3.5" fill="#b45309" />
        <circle cx="18" cy="50" r="3.5" fill="#b45309" />
        <circle cx="82" cy="50" r="3.5" fill="#b45309" />
        {/* Verse Number */}
        <text 
          x="50" 
          y="57" 
          textAnchor="middle" 
          fill={isPlaying ? "#ffffff" : "#1e293b"} 
          fontWeight="800" 
          fontSize="24" 
          fontFamily="sans-serif"
        >
          {toArabicNumerals(num)}
        </text>
        <defs>
          <linearGradient id="gold-grad" x1="0" y1="0" x2="100" y2="100">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <linearGradient id="gold-grad-active" x1="0" y1="0" x2="100" y2="100">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
      </svg>
    </span>
  );
};

function MushafView({ 
  page, 
  setPage, 
  fontSize, 
  selectedFont, 
  showTajweed,
  isDarkMode,
  selectedReciter,
  playAudio,
  playingWordId,
  playingVerseKey,
  tafsirData,
  isLoadingTafsir,
  generatedImages,
  imageOverlayTexts,
  isGeneratingImage,
  handleGetTafsir,
  handleGenerateImage,
  downloadIllustratedImage,
  getCorrectWordAudioUrl,
  cleanTajweed
}: { 
  page: number;
  setPage: (p: number) => void;
  fontSize: number;
  selectedFont: string;
  showTajweed: boolean;
  isDarkMode: boolean;
  selectedReciter: number;
  playAudio: (url: string | undefined, type: 'word' | 'verse', id: string | number) => void;
  playingWordId: number | null;
  playingVerseKey: string | null;
  tafsirData: Record<string, string>;
  isLoadingTafsir: Record<string, boolean>;
  generatedImages: Record<string, string>;
  imageOverlayTexts: Record<string, string>;
  isGeneratingImage: Record<string, boolean>;
  handleGetTafsir: (verseKey: string, words: any[]) => Promise<void>;
  handleGenerateImage: (verseKey: string, words: any[]) => Promise<void>;
  downloadIllustratedImage: (verseKey: string) => void;
  getCorrectWordAudioUrl: (word: any, wordsList: any[], verseKey: string) => string;
  cleanTajweed: (text: string) => string;
}) {
  const [showSurahList, setShowSurahList] = useState(false);
  const [jumpPage, setJumpPage] = useState(page.toString());
  const [isLoading, setIsLoading] = useState(true);
  const [verses, setVerses] = useState<any[]>([]);
  const [selectedVerse, setSelectedVerse] = useState<any | null>(null);

  const [isQuranFullScreen, setIsQuranFullScreen] = useState(false);
  const [showFullscreenControls, setShowFullscreenControls] = useState(true);
  const controlsTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  const triggerShowControls = () => {
    setShowFullscreenControls(true);
    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
    }
    controlsTimerRef.current = setTimeout(() => {
      setShowFullscreenControls(false);
    }, 5000);
  };

  useEffect(() => {
    return () => {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, []);

  const handleFullscreenClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('button') || 
      target.closest('a') || 
      target.closest('.quran-word') || 
      target.closest('.verse-end-marker') ||
      target.closest('.interactive-control')
    ) {
      return;
    }

    if (showFullscreenControls) {
      setShowFullscreenControls(false);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    } else {
      triggerShowControls();
    }
  };

  const handlePageClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('button') || 
      target.closest('a') || 
      target.closest('.quran-word') || 
      target.closest('.verse-end-marker') ||
      target.closest('.interactive-control')
    ) {
      return;
    }
    setIsQuranFullScreen(true);
    triggerShowControls();
  };

  const renderBookPageContent = () => {
    const isFullScreenLandscape = isQuranFullScreen && isLandscape;
    
    return (
      <div 
        onClick={isQuranFullScreen ? handleFullscreenClick : handlePageClick}
        className={
          isQuranFullScreen
            ? `relative transition-all duration-300 group select-none ${
                isFullScreenLandscape 
                  ? 'w-full h-full max-h-none aspect-none rounded-none border-0 p-0' 
                  : 'w-full h-auto max-h-[96vh] md:h-[95vh] md:w-auto aspect-[1/1.42] sm:aspect-[1/1.41] rounded-2xl md:rounded-3xl shadow-2xl border p-0'
              } ${
                isDarkMode 
                  ? 'bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 border-amber-900/40 text-slate-100' 
                  : 'bg-[#fcf9f2] border-amber-900/20 text-zinc-900'
              }`
            : `relative w-full aspect-[1/1.42] sm:aspect-[1/1.41] rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.12)] border overflow-hidden transition-all duration-300 group p-0 cursor-zoom-in ${
                isDarkMode 
                  ? 'bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 border-amber-900/30' 
                  : 'bg-[#fcf9f2] border-amber-900/15'
              }`
        }
      >
        
        {/* Outer Elegant Gold Border Line */}
        <div className={`absolute border pointer-events-none z-10 transition-all ${
          isFullScreenLandscape ? 'inset-1.5 sm:inset-2.5 rounded-xl' : 'inset-2 sm:inset-3 rounded-2xl'
        } ${
          isDarkMode ? 'border-amber-700/20' : 'border-amber-600/25'
        }`} />
        
        {/* Inner Detailed Gilded Border Framework */}
        <div className={`absolute border-[3px] pointer-events-none z-10 transition-all ${
          isFullScreenLandscape ? 'inset-3 sm:inset-5 rounded-lg border-2' : 'inset-4 sm:inset-6 rounded-xl border-[3px]'
        } ${
          isDarkMode ? 'border-amber-500/15' : 'border-amber-600/20'
        }`} />

        {/* Thick Ornate Middle Margin Fill */}
        <div className={`absolute border pointer-events-none opacity-25 dark:opacity-10 z-10 transition-all ${
          isFullScreenLandscape ? 'inset-3 sm:inset-5 rounded-lg border-[5px] sm:border-[8px]' : 'inset-4 sm:inset-6 rounded-xl border-[8px] sm:border-[12px]'
        } ${
          isDarkMode ? 'border-amber-700/10 bg-gradient-to-b from-amber-900/5 to-amber-900/0' : 'border-amber-700/10 bg-amber-50/10'
        }`} />

        {/* 4 Beautiful Corner Medallions */}
        <CornerOrnament position="top-left" />
        <CornerOrnament position="top-right" />
        <CornerOrnament position="bottom-left" />
        <CornerOrnament position="bottom-right" />

        {/* The Text & Content Area inside the Borders */}
        <div className={`absolute inset-0 flex flex-col justify-between overflow-y-auto transition-all ${
          isFullScreenLandscape ? 'p-5 sm:p-9 md:p-11' : 'p-7 sm:p-12'
        }`}>
          
          {/* Dynamic Page Header (Surah and Juz) */}
          <div className={`flex items-center justify-between w-full border-b pb-2 text-xs sm:text-sm font-serif font-bold select-none px-2 z-10 ${
            isFullScreenLandscape ? 'mb-2' : 'mb-4'
          } ${
            isDarkMode ? 'border-amber-800/30 text-amber-500/80' : 'border-amber-600/35 text-amber-800/80'
          }`}>
            <span>سُورَةُ {currentSurah.name}</span>
            <span className="opacity-90 tracking-wide">الجُزْءُ {getJuzForPage(page)}</span>
            <span>لاپەڕە {page}</span>
          </div>

          {/* Loading Spinner */}
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 rounded-2xl bg-inherit">
              <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-2" />
              <span className={`text-xs animate-pulse font-bold ${isDarkMode ? 'text-slate-400' : 'text-zinc-500'}`}>لاپەڕە دهێتە ئامادەکرن...</span>
            </div>
          )}

          {/* Core Quran Texts */}
          <div 
            className={`w-full flex-1 text-zinc-900 dark:text-zinc-100 quran-text select-none pb-16 z-10 pt-2`} 
            style={{ 
              fontFamily: selectedFont, 
              fontSize: isFullScreenLandscape ? `${Math.min(64, fontSize * 1.35)}px` : `${fontSize}px`,
              lineHeight: isFullScreenLandscape ? '2.1em' : '2.4em',
              textAlign: 'justify',
              textAlignLast: 'center'
            }}
            dir="rtl"
          >
            {verses.map((verse) => {
              const isFirstVerseOfSurah = verse.verse_key.endsWith(':1');
              const surahId = parseInt(verse.verse_key.split(':')[0]);
              const verseNum = verse.verse_key.split(':')[1];
              const isVersePlaying = playingVerseKey === verse.verse_key;
              const isSelected = selectedVerse?.id === verse.id;

              return (
                <React.Fragment key={verse.id}>
                  {/* Ornate Surah Start Banner */}
                  {isFirstVerseOfSurah && (
                    <div className="w-full block my-6 sm:my-8 select-none text-center">
                      <div className="relative w-full max-w-lg mx-auto h-16 sm:h-20 flex items-center justify-center bg-[#fbf9f4] dark:bg-slate-950 border-double border-[5px] border-amber-600/60 rounded-xl shadow-sm px-4">
                        <div className="absolute left-3 text-amber-600/60 text-lg select-none">💠</div>
                        <div className="absolute right-3 text-amber-600/60 text-lg select-none">💠</div>
                        <span className="font-serif text-2xl sm:text-3xl text-amber-800 dark:text-amber-300 font-extrabold tracking-wide drop-shadow-sm">
                          سُورَةُ {surahList.find(s => s.id === surahId)?.name || ""}
                        </span>
                      </div>
                      
                      {/* Basmalah block */}
                      {surahId !== 1 && surahId !== 9 && (
                        <div className="w-full text-center my-6 py-2 text-2xl sm:text-3xl font-serif text-zinc-800 dark:text-zinc-100 select-none font-extrabold tracking-wide">
                          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                        </div>
                      )}
                    </div>
                  )}

                  {/* Words segment with highlight support */}
                  <span className={`inline transition-colors duration-300 px-1 rounded-xl ${
                    isVersePlaying 
                      ? 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-500/20' 
                      : isSelected
                        ? 'bg-amber-500/10 dark:bg-amber-500/15 ring-1 ring-amber-500/20'
                        : ''
                  }`}>
                    {verse.words?.map((word: any) => {
                      if (word.char_type_name === 'end') return null;
                      const isWordPlaying = playingWordId === word.id;
                      const hasAudio = !!word.audio_url;

                      return (
                        <React.Fragment key={word.id}>
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              if (hasAudio) {
                                const correctUrl = getCorrectWordAudioUrl(word, verse.words, verse.verse_key);
                                playAudio(correctUrl, 'word', word.id);
                              }
                            }}
                            className={`inline-block quran-word select-none mx-0.5 sm:mx-1 my-1 transition-all hover:scale-110 active:scale-95 ${
                              isWordPlaying 
                                ? 'text-amber-500 scale-110 font-extrabold' 
                                : ''
                            } ${
                              isDarkMode ? 'dark-mode-text' : ''
                            } ${
                              hasAudio 
                                ? 'cursor-pointer hover:text-emerald-500 hover:bg-emerald-500/10 rounded px-1' 
                                : ''
                            } ${
                              isWordPlaying 
                                ? (isDarkMode ? 'bg-emerald-950 text-emerald-400 font-bold border-b-2 border-emerald-500 scale-105' : 'bg-emerald-50 text-emerald-700 font-bold border-b-2 border-emerald-500 scale-105') 
                                : ''
                            }`}
                            dangerouslySetInnerHTML={{ __html: cleanTajweed(showTajweed ? (word.text_uthmani_tajweed || word.text_uthmani) : word.text_uthmani) }}
                            title={hasAudio ? "بۆ گوهداریکرنێ کلیک بکە" : undefined}
                          />
                          {' '}
                        </React.Fragment>
                      );
                    })}

                    {/* Highly Polished Gold Flower Verse End Marker */}
                    <VerseEndMarker 
                      num={verseNum} 
                      isPlaying={isVersePlaying} 
                      onClick={() => setSelectedVerse(verse)} 
                    />
                  </span>
                  {' '}
                </React.Fragment>
              );
            })}
          </div>

          {/* Premium Side Page & Juz Indicators (Split to sides, keeping center completely clear to avoid hiding Quran text) */}
          <div className="absolute bottom-2.5 left-6 right-6 flex items-center justify-between z-10 pointer-events-none select-none">
            <span className={`px-3 py-1 rounded-xl text-[10px] sm:text-xs font-bold shadow-sm border ${
              isDarkMode ? 'bg-slate-950/85 border-amber-900/30 text-amber-500/80' : 'bg-amber-50/90 border-amber-600/15 text-amber-800'
            }`}>
              صَفْحَة {page}
            </span>
            <span className={`px-3 py-1 rounded-xl text-[10px] sm:text-xs font-bold shadow-sm border ${
              isDarkMode ? 'bg-slate-950/85 border-amber-900/30 text-amber-500/80' : 'bg-amber-50/90 border-amber-600/15 text-amber-800'
            }`}>
              الْجُزْءُ {getJuzForPage(page)}
            </span>
          </div>
        </div>

        {/* Side-floating gold page turner arrows (Non-blocking) */}
        {(!isQuranFullScreen || showFullscreenControls) && (
          <>
            <button 
              onClick={(e) => { e.stopPropagation(); prevPage(); }}
              disabled={page === 1}
              className="absolute left-3 md:left-10 top-1/2 -translate-y-1/2 p-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-400 rounded-full transition-all hover:scale-110 disabled:opacity-30 z-30 shadow-md border border-amber-500/20 backdrop-blur-sm interactive-control"
              title="لاپەڕێ پێشتر"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); nextPage(); }}
              disabled={page === 604}
              className="absolute right-3 md:right-10 top-1/2 -translate-y-1/2 p-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-400 rounded-full transition-all hover:scale-110 disabled:opacity-30 z-30 shadow-md border border-amber-500/20 backdrop-blur-sm interactive-control"
              title="لاپەڕێ پاشتر"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
          </>
        )}

        {/* Interactive Tafsir & AI Image slide-up drawer */}
        <AnimatePresence>
          {selectedVerse && (
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className={`absolute bottom-0 left-0 right-0 max-h-[78%] overflow-y-auto border-t shadow-[0_-12px_40px_rgba(0,0,0,0.18)] z-40 rounded-t-[2.5rem] backdrop-blur-md flex flex-col transition-all duration-300 interactive-control ${
                isDarkMode ? 'bg-slate-900/95 border-slate-800 text-slate-100' : 'bg-white/95 border-amber-600/15 text-slate-950'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer Header */}
              <div className={`p-4 sm:p-5 border-b flex items-center justify-between sticky top-0 z-10 backdrop-blur-md ${
                isDarkMode ? 'border-slate-800/80 bg-slate-900/80' : 'border-slate-100 bg-slate-50/80'
              }`}>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      const isPlaying = playingVerseKey === selectedVerse.verse_key;
                      if (isPlaying) {
                        playAudio(undefined, 'verse', selectedVerse.verse_key);
                      } else {
                        playAudio(selectedVerse.audio_url, 'verse', selectedVerse.verse_key);
                      }
                    }}
                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-md hover:scale-105 active:scale-95 ${
                      playingVerseKey === selectedVerse.verse_key
                        ? 'bg-amber-500 text-white animate-pulse'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                    title="گوهداریکرنا ئایەتێ"
                  >
                    {playingVerseKey === selectedVerse.verse_key ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5 ml-0.5" />
                    )}
                  </button>
                  <div className="text-right">
                    <h4 className="font-extrabold text-sm sm:text-base text-amber-800 dark:text-amber-400">ئایەتا {selectedVerse.verse_key}</h4>
                    <p className="text-[10px] sm:text-xs opacity-60">تەفسیرا کوردی و وێنێ ژیرییا دەستکرد</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedVerse(null)}
                  className={`p-2 rounded-full transition-all ${
                    isDarkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>

              {/* Drawer Content Body */}
              <div className="p-4 sm:p-6 space-y-6 md:space-y-0 md:grid md:grid-cols-2 md:gap-6 overflow-y-auto">
                
                {/* 1. Kurmanji Badini Tafsir Panel */}
                <div className={`space-y-4 p-5 rounded-2xl border ${
                  isDarkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50/50 border-zinc-100'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle className="w-5 h-5 text-emerald-600" />
                    <h5 className="font-extrabold text-sm sm:text-base text-emerald-600 dark:text-emerald-400">تەفسیرا بادینی</h5>
                  </div>
                  
                  {tafsirData[selectedVerse.verse_key] ? (
                    <p className="text-sm sm:text-base leading-relaxed text-right whitespace-pre-line font-medium" dir="rtl">
                      {tafsirData[selectedVerse.verse_key]}
                    </p>
                  ) : isLoadingTafsir[selectedVerse.verse_key] ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
                      <p className="text-xs opacity-70 animate-pulse">تەفسیر دهێتە ئامادەکرن ب رێکا ژیرییا دەستکرد...</p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-xs opacity-60 mb-4">چ تەفسیر بۆ ڤێ ئایەتێ نەهاتینە دیتن.</p>
                      <button
                        onClick={() => handleGetTafsir(selectedVerse.verse_key, selectedVerse.words)}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-sm"
                      >
                        وەرگرتنا تەفسیرا کوردی (Gemini Tafsir)
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Beautiful AI Illustration Card Panel */}
                <div className={`space-y-4 p-5 rounded-2xl border flex flex-col justify-between ${
                  isDarkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50/50 border-zinc-100'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <ImageIcon className="w-5 h-5 text-amber-500" />
                    <h5 className="font-extrabold text-sm sm:text-base text-amber-600 dark:text-amber-400">وێنێ ژیرییا دەستکرد (AI Illustration)</h5>
                  </div>

                  {generatedImages[selectedVerse.verse_key] ? (
                    <div className="space-y-3">
                      <div className="relative rounded-2xl overflow-hidden shadow-lg border border-amber-500/10 max-w-md mx-auto aspect-video group">
                        <img 
                          src={generatedImages[selectedVerse.verse_key]} 
                          alt={`Illustration for ${selectedVerse.verse_key}`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        
                        {/* Dynamic Elegant Vignette Shadow and Kurdish Caption Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/25 to-black/85 flex flex-col justify-between p-4">
                          
                          {/* Top row with Quran Icon and Kurdish Translation Overlay */}
                          <div className="flex items-start gap-3 text-right" dir="rtl">
                            {/* Floating stylized Quran Icon */}
                            <div className="bg-amber-500/90 text-white p-2 rounded-xl shadow-md text-xl shrink-0">
                              📖
                            </div>
                            
                            {/* The precise Kurdish meaning text */}
                            {imageOverlayTexts[selectedVerse.verse_key] && (
                              <p className="text-white font-extrabold text-xs sm:text-sm leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] select-text">
                                {imageOverlayTexts[selectedVerse.verse_key]}
                              </p>
                            )}
                          </div>
                          
                          {/* Bottom info row */}
                          <div className="flex items-center justify-between mt-auto">
                            <span className="text-[9px] text-white/70 font-bold font-mono bg-black/40 px-2 py-0.5 rounded-full">
                              Gemini AI Art
                            </span>
                            <span className="text-[9px] text-amber-300 font-bold bg-black/40 px-2 py-0.5 rounded-full">
                              ئایەتا {selectedVerse.verse_key}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action buttons (Download Card) */}
                      <div className="flex justify-center">
                        <button
                          onClick={() => downloadIllustratedImage(selectedVerse.verse_key)}
                          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-md flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          داگرتنا وێنەی دگەل تەفسیرێ (Download Card)
                        </button>
                      </div>
                    </div>
                  ) : isGeneratingImage[selectedVerse.verse_key] ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
                      <p className="text-xs opacity-70 animate-pulse">وێنە دهێتە دروستکرن ب رێکا ژیرییا دەستکرد...</p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-xs opacity-60 mb-4">چ وێنە بۆ ڤێ ئایەتێ نەهاتینە دروستکرن.</p>
                      <button
                        onClick={() => handleGenerateImage(selectedVerse.verse_key, selectedVerse.words)}
                        className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-sm inline-flex items-center gap-2"
                      >
                        <ImageIcon className="w-4 h-4" />
                        دروستکرنا وێنەی (AI Image)
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  useEffect(() => {
    const fetchPageVerses = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`https://api.quran.com/api/v4/verses/by_page/${page}?language=ar&words=true&word_fields=text_uthmani,text_uthmani_tajweed,audio_url&per_page=50`);
        const data = await res.json();
        setVerses(data.verses);
      } catch (err) {
        console.error("Failed to fetch page verses", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPageVerses();
  }, [page]);

  const nextPage = () => { if (page < 604) { setPage(page + 1); setJumpPage((page + 1).toString()); setSelectedVerse(null); } };
  const prevPage = () => { if (page > 1) { setPage(page - 1); setJumpPage((page - 1).toString()); setSelectedVerse(null); } };

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpPage);
    if (p >= 1 && p <= 604) {
      setPage(p);
      setSelectedVerse(null);
    }
  };

  const getSurahForPage = (p: number) => {
    return [...surahList].reverse().find(s => s.startPage <= p) || surahList[0];
  };

  const getJuzForPage = (p: number) => {
    if (p <= 1) return 1;
    if (p <= 21) return 1;
    return Math.min(30, Math.floor((p - 2) / 20) + 1);
  };

  const currentSurah = getSurahForPage(page);

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-2 sm:p-4 space-y-5">
      {/* Header Controls */}
      <div className={`flex items-center justify-between w-full p-3 sm:p-4 rounded-2xl shadow-sm border sticky top-0 z-20 transition-colors ${
        isDarkMode ? 'bg-slate-900/90 border-slate-800 backdrop-blur-md' : 'bg-white/90 border-zinc-200/80 backdrop-blur-md'
      }`}>
        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={() => setShowSurahList(!showSurahList)}
            className={`p-2.5 rounded-xl transition-all ${
              isDarkMode ? 'hover:bg-slate-800 text-emerald-400 bg-slate-900' : 'hover:bg-emerald-50 text-emerald-600 bg-emerald-50/40'
            }`}
            title="لیستا سورەتان"
          >
            <ListIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div className="flex flex-col text-right">
            <span className={`text-base sm:text-lg font-bold leading-tight ${isDarkMode ? 'text-emerald-400' : 'text-emerald-900'}`}>{currentSurah.name}</span>
            <span className="text-[10px] sm:text-xs text-zinc-500">{currentSurah.englishName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <form onSubmit={handleJump} className="flex items-center gap-1.5 sm:gap-2">
            <input 
              type="number"
              value={jumpPage}
              onChange={(e) => setJumpPage(e.target.value)}
              className={`w-14 sm:w-16 p-2 text-center rounded-xl border font-bold text-sm sm:text-base ${
                isDarkMode ? 'bg-slate-800 border-slate-700 text-emerald-400' : 'bg-slate-50 border-zinc-200 text-emerald-800'
              }`}
              min="1"
              max="604"
            />
            <span className="text-zinc-400 text-xs sm:text-sm font-bold">/ ٦٠٤</span>
          </form>
        </div>
      </div>

      {/* Surah Selection Dropdown */}
      {showSurahList && (
        <div className={`w-full rounded-2xl shadow-xl border overflow-hidden max-h-[60vh] overflow-y-auto duration-200 transition-colors ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-zinc-200'
        }`}>
          <div className={`sticky top-0 p-4 border-b z-10 flex justify-between items-center ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-zinc-100'
          }`}>
            <h3 className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>لیستا سورەتان</h3>
            <button onClick={() => setShowSurahList(false)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
              <Plus className="w-5 h-5 rotate-45" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1 p-2">
            {surahList.map(s => (
              <button
                key={s.id}
                onClick={() => {
                  setPage(s.startPage);
                  setJumpPage(s.startPage.toString());
                  setShowSurahList(false);
                  setSelectedVerse(null);
                }}
                className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                  currentSurah.id === s.id 
                    ? (isDarkMode ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40' : 'bg-emerald-50 text-emerald-700') 
                    : (isDarkMode ? 'hover:bg-slate-800/60 text-slate-300' : 'hover:bg-zinc-50 text-zinc-700')
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] w-5 h-5 flex items-center justify-center rounded-full opacity-70 font-bold ${
                    isDarkMode ? 'bg-slate-800 text-emerald-400' : 'bg-zinc-100 text-zinc-600'
                  }`}>{s.id}</span>
                  <span className="font-semibold text-sm sm:text-base">{s.name}</span>
                </div>
                <span className="text-[10px] opacity-60">ل. {s.startPage}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Quran Book Page Container */}
      {renderBookPageContent()}

      {/* Immersive Fullscreen Mode */}
      <AnimatePresence>
        {isQuranFullScreen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-50 flex flex-col justify-center items-center w-full h-[100dvh] select-none ${
              isLandscape ? 'p-0' : 'p-2 sm:p-4 md:p-6'
            } ${
              isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#faf8f5] text-zinc-900'
            }`}
            onClick={handleFullscreenClick}
          >
            {/* Immersive Top Bar */}
            <AnimatePresence>
              {showFullscreenControls && (
                <motion.div
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -50, opacity: 0 }}
                  className="absolute top-4 left-4 right-4 flex items-center justify-between z-50 bg-black/60 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 select-none cursor-default max-w-3xl mx-auto w-[92%]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button 
                    onClick={() => setIsQuranFullScreen(false)}
                    className="p-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-xl transition-all"
                    title="بچیککرن"
                  >
                    <Minimize2 className="w-5 h-5" />
                  </button>
                  
                  <div className="text-white text-right font-medium">
                    <span className="font-extrabold text-amber-300 ml-2">سُورَةُ {currentSurah.name}</span>
                    <span className="text-xs text-zinc-300">| لاپەڕە {page}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Immersive Page content itself */}
            <div className={`w-full flex items-center justify-center ${isLandscape ? 'h-full w-full' : ''}`}>
              {renderBookPageContent()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      <div className="flex flex-col items-center gap-2 text-[10px] sm:text-xs text-zinc-400 text-center px-4">
        <p className="font-medium">بۆ لاپەڕێ دی: ل سەر پەرێن چەپێ یان ڕاستێ یێن ڕوخسارێ قورئانێ کلیک بکە</p>
        <p className="opacity-50 font-bold">قورئانا پیرۆز ب شێوازێ لاپەر - ٦٠٤ لاپەڕە</p>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'dictionary' | 'list' | 'quran' | 'adhkar' | 'mushaf'>('mushaf');
  const [mushafPage, setMushafPage] = useState(54); // Default to page 54 as in the image
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<{ word: string; meaning: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPart, setSelectedPart] = useState<number | null>(null);
  const [partWords, setPartWords] = useState<Record<number, {word: string, meaning: string}[]>>({
    1: commonWords
  });
  const [isLoadingPart, setIsLoadingPart] = useState(false);

  // Adhkar State
  const [selectedAdhkarCategory, setSelectedAdhkarCategory] = useState<string | null>(null);
  const [expandedAdhkarIds, setExpandedAdhkarIds] = useState<Set<string>>(new Set());
  const [isAdhkarAudioPlaying, setIsAdhkarAudioPlaying] = useState<string | null>(null);

  // Quran Tab State
  const [surahs, setSurahs] = useState<any[]>([]);
  const [selectedSurahObj, setSelectedSurahObj] = useState<any | null>(null);
  const [verses, setVerses] = useState<any[]>([]);
  const [isLoadingQuran, setIsLoadingQuran] = useState(false);
  const [quranPage, setQuranPage] = useState(1);
  const [quranTotalPages, setQuranTotalPages] = useState(1);
  const [selectedReciter, setSelectedReciter] = useState(7);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [playingWordId, setPlayingWordId] = useState<number | null>(null);
  const [playingVerseKey, setPlayingVerseKey] = useState<string | null>(null);
  const [tafsirData, setTafsirData] = useState<Record<string, string>>({});
  const [isLoadingTafsir, setIsLoadingTafsir] = useState<Record<string, boolean>>({});
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  const [imageOverlayTexts, setImageOverlayTexts] = useState<Record<string, string>>({});
  const [isGeneratingImage, setIsGeneratingImage] = useState<Record<string, boolean>>({});
  
  // Font State
  const [selectedFont, setSelectedFont] = useState<string>('Uthmanic Hafs');
  const [customFonts, setCustomFonts] = useState<{name: string, url: string}[]>([]);
  const [showTajweed, setShowTajweed] = useState<boolean>(true);
  
  // Quran Search State
  const [quranSearchQuery, setQuranSearchQuery] = useState('');
  const [quranSearchResults, setQuranSearchResults] = useState<any[]>([]);
  const [isSearchingQuran, setIsSearchingQuran] = useState(false);

  // API Key State
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [savedApiKey, setSavedApiKey] = useState(() => localStorage.getItem('user_gemini_api_key') || '');
  const [isKeySaved, setIsKeySaved] = useState(!!localStorage.getItem('user_gemini_api_key'));

  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  // Dark Mode & Font Size State
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('dark_mode') === 'true');
  const [fontSize, setFontSize] = useState(() => Number(localStorage.getItem('font_size')) || 24);

  useEffect(() => {
    localStorage.setItem('dark_mode', isDarkMode.toString());
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('font_size', fontSize.toString());
  }, [fontSize]);

  // Continuous Tab State
  const [continuousSurahObj, setContinuousSurahObj] = useState<any | null>(null);
  const [continuousVerses, setContinuousVerses] = useState<any[]>([]);
  const [isLoadingContinuous, setIsLoadingContinuous] = useState(false);
  const [continuousVerseIndex, setContinuousVerseIndex] = useState<number>(0);
  const [isContinuousAudioPlaying, setIsContinuousAudioPlaying] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(5);
  const continuousAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const nextAudioPreloadRef = React.useRef<HTMLAudioElement | null>(null);

  const toggleAdhkarExpansion = (id: string) => {
    const newExpanded = new Set(expandedAdhkarIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedAdhkarIds(newExpanded);
  };

  const playAdhkarAudio = async (text: string, id: string) => {
    if (isAdhkarAudioPlaying === id) {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsAdhkarAudioPlaying(null);
      }
      return;
    }

    setIsAdhkarAudioPlaying(id);
    try {
      if (!ai) throw new Error('Please save your API Key first');
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `بصوت هادئ وواضح، اقرأ هذا الذكر: ${text}` }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioSrc = `data:audio/mp3;base64,${base64Audio}`;
        if (audioRef.current) {
          audioRef.current.src = audioSrc;
          audioRef.current.play();
          audioRef.current.onended = () => setIsAdhkarAudioPlaying(null);
        }
      }
    } catch (err: any) {
      console.error('Audio error:', err);
      setError(err.message || 'Error playing audio');
      setIsAdhkarAudioPlaying(null);
    }
  };

  const adhkarData = [
    {
      id: 'morning',
      title: 'زکرێن سپێدێ',
      icon: <Sun className="w-5 h-5" />,
      items: [
        { id: 'm1', arabic: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لاَ إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ', kurdish: 'ئەم گەهشتینە سپێدێ و پاشایەتی هەمی بۆ خودێ یە، و سوپاسی هەمی بۆ خودێ یە، چ خودایێن دی نینن ژبلی خودێ ب تنێ، چ هەڤال بۆ نینن، پاشایەتی و سوپاسی هەر بۆ وی نە و ئەو یێ خودان شیانە ل سەر هەمی تشتان.' },
        { id: 'm2', arabic: 'اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ', kurdish: 'خودایێ من، ب تە ئەم گەهشتینە سپێدێ، و ب تە ئەم گەهشتینە ئێڤاری، و ب تە ئەم دژین، و ب تە ئەم دمرین، و ڤەگەر هەر بۆ دەف تە یە.' },
        { id: 'm3', arabic: 'آية الكرسي: اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ...', kurdish: 'ئایەتا کورسی: خودێ ئەو زاتە یێ کو چ خودایێن دی نینن ژبلی وی، ئەوێ هەر ساخ و ڕاگرێ هەمی تشتانە...' }
      ]
    },
    {
      id: 'evening',
      title: 'زکرێن هێڤاری',
      icon: <Moon className="w-5 h-5" />,
      items: [
        { id: 'e1', arabic: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لاَ إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ', kurdish: 'ئەم گەهشتینە ئێڤاری و پاشایەتی هەمی بۆ خودێ یە، و سوپاسی هەمی بۆ خودێ یە، چ خودایێن دی نینن ژبلی خودێ ب تنێ، چ هەڤال بۆ نینن، پاشایەتی و سوپاسی هەر بۆ وی نە و ئەو یێ خودان شیانە ل سەر هەمی تشتان.' },
        { id: 'e2', arabic: 'اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ', kurdish: 'خودایێ من، ب تە ئەم گەهشتینە ئێڤاری، و ب تە ئەم گەهشتینە سپێدێ، و ب تە ئەم دژین، و ب تە ئەم دمرین، و ڤەگەر هەر بۆ دەف تە یە.' }
      ]
    },
    {
      id: 'night',
      title: 'زکرێن شەڤێ',
      icon: <Pause className="w-5 h-5 rotate-90" />, // Using Pause as a placeholder or I can import CloudMoon
      items: [
        { id: 'n1', arabic: 'بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي، وَبِكَ أَرْفَعُهُ، فَإِنْ أَمْسَكْتَ نَفْسِي فَارْحَمْهَا، وَإِنْ أَرْسَلْتَهَا فَاحْفَظْهَا، بِمَا تَحْفَظُ بِهِ عِبَادَكَ الصَّالِحِينَ', kurdish: 'ب ناڤێ تە پەروەردگارێ من، من تەنیشتا خۆ دانا، و ب تە ئەز دێ بلند کەم، ئەگەر تە گیانێ من گرت رەحمێ پێ ببە، و ئەگەر تە هنارتە ڤە پارێزگاریێ لێ بکە ب وێ تشتێ تو پارێزگاریێ ل بەندەیێن خۆ یێن چاک دکەی.' }
      ]
    },
    {
      id: 'prayer',
      title: 'زکرێن پشتی نڤێژێ',
      icon: <Check className="w-5 h-5" />,
      items: [
        { id: 'p1', arabic: 'أستغفر الله (ثلاثاً)، اللهم أنت السلام ومنك السلام تباركت يا ذا الجلال والإكرام', kurdish: 'داخوازا لێخۆشبوونێ ژ خودێ دکەم (سێ جاران)، خودایێ من تو سەلامەتی و سەلامەتی هەر ژ تە دهێت، تو یێ پیرۆزی ئەی خودانێ مەزناهی و رێزێ.' }
      ]
    },
    {
      id: 'dua',
      title: 'هەمی دوعا',
      icon: <BookHeart className="w-5 h-5" />,
      items: [
        { id: 'd1', arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ', kurdish: 'پەروەردگارێ مە، ل دونیایێ باشیێ بدە مە و ل ئاخیرەتێ ژی باشیێ بدە مە و مە ژ عەزابا ئاگری بپارێزە.' },
        { id: 'd2', arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ', kurdish: 'خودایێ من، ئەز داخوازا لێبۆرین و ساخلەمیێ ژ تە دکەم ل دونیا و ئاخیرەتێ.' }
      ]
    }
  ];

  const activeApiKey = savedApiKey || process.env.GEMINI_API_KEY || '';
  const ai = useMemo(() => activeApiKey ? new GoogleGenAI({ apiKey: activeApiKey }) : null, [activeApiKey]);

  const handleSaveApiKey = () => {
    if (apiKeyInput.trim()) {
      localStorage.setItem('user_gemini_api_key', apiKeyInput.trim());
      setSavedApiKey(apiKeyInput.trim());
      setIsKeySaved(true);
      setApiKeyInput('');
      setError(''); // Clear any previous API key errors
    }
  };

  const handleClearApiKey = () => {
    localStorage.removeItem('user_gemini_api_key');
    setSavedApiKey('');
    setIsKeySaved(false);
  };

  const handleDownloadAll = async () => {
    if (!ai) {
      setError('کۆدا نهێنی یا API نەهاتیە دانان. ژ کەرەما خۆ ل سەرێ لاپەڕەی زێدە بکە.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsDownloadingAll(true);
    setDownloadProgress(0);
    setError('');

    const allWords = [];
    
    try {
      for (let part = 1; part <= 100; part++) {
        // Check cache first
        const cached = localStorage.getItem(`quran_words_part_${part}`);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed && parsed.length > 0) {
              allWords.push(...parsed);
              setDownloadProgress(part);
              continue;
            }
          } catch (e) {
            // ignore cache error
          }
        }

        // Fetch from API
        let success = false;
        let retries = 3;
        while (!success && retries > 0) {
          try {
            const expectedCount = part === 100 ? 184 : 190;
            const response = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: `Generate a JSON array of exactly ${expectedCount} unique Quranic Arabic words and their Kurmanji Kurdish (Arabic script) translations. This is for part ${part} out of 100 of a Quranic dictionary. Ensure the words are diverse and appropriate for a comprehensive dictionary. IMPORTANT: The Arabic words MUST include full diacritics (Tashkeel) such as Fatha, Kasra, Damma, Shadda, Sukun, etc. (e.g., "بَيِّنَة").`,
              config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      word: { type: Type.STRING, description: "The Quranic Arabic word with full diacritics (Tashkeel)" },
                      meaning: { type: Type.STRING, description: "The Kurmanji Kurdish meaning in Arabic script" }
                    },
                    required: ["word", "meaning"]
                  }
                }
              }
            });

            const text = response.text?.trim();
            if (text) {
              const words = JSON.parse(text);
              allWords.push(...words);
              localStorage.setItem(`quran_words_part_${part}`, JSON.stringify(words));
              success = true;
            } else {
              throw new Error("Empty response");
            }
          } catch (err: any) {
            console.error(`Error fetching part ${part}:`, err);
            if (err.message && err.message.includes('429')) {
              // Rate limit hit, wait longer
              await new Promise(resolve => setTimeout(resolve, 5000));
            } else {
              retries--;
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        }
        
        if (!success) {
          throw new Error(`Failed to fetch part ${part} after retries.`);
        }

        setDownloadProgress(part);
        // Wait to avoid rate limits (15 RPM -> 4 seconds per request)
        await new Promise(resolve => setTimeout(resolve, 4000));
      }

      // Create and download file
      const blob = new Blob([JSON.stringify(allWords, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'quran_dictionary_all_words.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert('داگرتن ب سەرکەفتیانە ب دوماهی هات!');
    } catch (err: any) {
      console.error(err);
      setError('خەلەتیەک چێبوو د دەمێ داگرتنا هەمی پەیڤان دا. رەنگە لیمیتێ بکارئینانا API ب دوماهی هاتبیت. ' + (err.message || ''));
    } finally {
      setIsDownloadingAll(false);
      setDownloadProgress(0);
    }
  };

  const handleFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fontUrl = URL.createObjectURL(file);
    const fontName = `CustomFont_${Date.now()}`;

    const newFont = new FontFace(fontName, `url(${fontUrl})`);
    newFont.load().then((loadedFont) => {
      document.fonts.add(loadedFont);
      setCustomFonts(prev => [...prev, { name: fontName, url: fontUrl }]);
      setSelectedFont(fontName);
    }).catch(err => {
      console.error("Failed to load custom font", err);
      alert("خەلەتیەک چێبوو د دەمێ بارکرنا فۆنتێ دا. پشتڕاست بە کو فۆنتێ تە دروستە (.ttf, .otf, .woff).");
    });
    
    // Reset input
    e.target.value = '';
  };

  // Quran Functions
  useEffect(() => {
    if ((activeTab === 'quran' || activeTab === 'continuous') && surahs.length === 0) {
      fetchSurahs();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'continuous') {
      if (continuousAudioRef.current) continuousAudioRef.current.pause();
      if (nextAudioPreloadRef.current) {
        nextAudioPreloadRef.current.pause();
        nextAudioPreloadRef.current = null;
      }
      setIsContinuousAudioPlaying(false);
      setIsAutoScrolling(false);
      return;
    }

    if (isContinuousAudioPlaying && continuousVerses.length > 0) {
      const verse = continuousVerses[continuousVerseIndex];
      if (!verse) {
        // End of Surah, load next Surah
        if (continuousSurahObj && continuousSurahObj.id < 114) {
          const nextSurah = surahs.find(s => s.id === continuousSurahObj.id + 1);
          if (nextSurah) {
            loadContinuousSurah(nextSurah, true);
          }
        } else {
          setIsContinuousAudioPlaying(false); // End of Quran
        }
        return;
      }

      const customUrl = getVerseAudioUrl(verse.verse_key, selectedReciter, verse.audio?.url);
      if (customUrl) {
        const fullUrl = customUrl.startsWith('http') ? customUrl : `https://verses.quran.com/${customUrl}`;
        if (continuousAudioRef.current) {
          continuousAudioRef.current.pause();
        }

        let audio: HTMLAudioElement;
        
        // If we already preloaded this audio element, use it directly!
        if (nextAudioPreloadRef.current && (nextAudioPreloadRef.current.src === fullUrl || decodeURIComponent(nextAudioPreloadRef.current.src) === decodeURIComponent(fullUrl))) {
          audio = nextAudioPreloadRef.current;
        } else {
          audio = new Audio(fullUrl);
        }

        audio.onended = () => {
          setContinuousVerseIndex(prev => prev + 1);
        };
        audio.onerror = () => {
          console.error("Continuous audio failed to load:", fullUrl);
          setContinuousVerseIndex(prev => prev + 1);
        };
        audio.play().catch(e => console.error("Play error:", e));
        continuousAudioRef.current = audio;

        // Immediately start preloading the NEXT verse to guarantee gapless instant playback
        const nextVerse = continuousVerses[continuousVerseIndex + 1];
        if (nextVerse) {
          const nextCustomUrl = getVerseAudioUrl(nextVerse.verse_key, selectedReciter, nextVerse.audio?.url);
          if (nextCustomUrl) {
            const nextFullUrl = nextCustomUrl.startsWith('http') ? nextCustomUrl : `https://verses.quran.com/${nextCustomUrl}`;
            const preloadAudio = new Audio(nextFullUrl);
            preloadAudio.preload = "auto";
            preloadAudio.load(); // explicitly buffer the file in the background
            nextAudioPreloadRef.current = preloadAudio;
          } else {
            nextAudioPreloadRef.current = null;
          }
        } else {
          nextAudioPreloadRef.current = null;
        }
      } else {
        setContinuousVerseIndex(prev => prev + 1);
      }
    } else if (!isContinuousAudioPlaying && continuousAudioRef.current) {
      continuousAudioRef.current.pause();
      if (nextAudioPreloadRef.current) {
        nextAudioPreloadRef.current.pause();
      }
    }
  }, [isContinuousAudioPlaying, continuousVerseIndex, continuousVerses, activeTab, selectedReciter]);

  useEffect(() => {
    let requestRef: number;
    const scroll = () => {
      if (isAutoScrolling && activeTab === 'continuous') {
        // Use a smaller increment for smoother motion
        window.scrollBy(0, autoScrollSpeed / 20); 
        requestRef = requestAnimationFrame(scroll);
      }
    };
    
    if (isAutoScrolling && activeTab === 'continuous') {
      requestRef = requestAnimationFrame(scroll);
    }
    
    return () => {
      if (requestRef) cancelAnimationFrame(requestRef);
    };
  }, [isAutoScrolling, autoScrollSpeed, activeTab]);

  // Synchronized scrolling to follow the playing audio in the Continuous Recitation tab
  useEffect(() => {
    if (activeTab === 'continuous' && isContinuousAudioPlaying && continuousVerses.length > 0) {
      const element = document.getElementById(`verse-card-${continuousVerseIndex}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [continuousVerseIndex, isContinuousAudioPlaying, activeTab, continuousVerses.length]);

  // Synchronized scrolling to follow the playing audio in the normal Quran tab
  useEffect(() => {
    if (activeTab === 'quran' && playingVerseKey) {
      const element = document.getElementById(`quran-verse-${playingVerseKey}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [playingVerseKey, activeTab]);

  const getVerseAudioUrl = (verseKey: string, reciterId: number, defaultUrl?: string): string => {
    const everyAyahReciters: Record<number, string> = {
      16: "Ghamadi_40kbps",            // سعد الغامدي
      67: "Yasser_Ad-Dussary_128kbps",  // ياسر الدوسري
      68: "Nasser_Alqatami_128kbps",   // ناصر القطامي
      29: "MaherAlMuaiqly128kbps",     // ماهر المعيقلي
      71: "ahmed_ibn_ali_al_ajamy_128kbps", // أحمد العجمي
      77: "Fares_Abbad_64kbps"         // فارس عباد
    };
    
    const subfolder = everyAyahReciters[reciterId];
    if (subfolder && verseKey) {
      const [surahStr, verseStr] = verseKey.split(':');
      const surahNum = parseInt(surahStr);
      const verseNum = parseInt(verseStr);
      if (!isNaN(surahNum) && !isNaN(verseNum)) {
        const pad3 = (num: number) => String(num).padStart(3, '0');
        return `https://everyayah.com/data/${subfolder}/${pad3(surahNum)}${pad3(verseNum)}.mp3`;
      }
    }
    
    return defaultUrl || '';
  };

  const getApiReciterId = (reciterId: number): number => {
    const customIds = [16, 67, 68, 29, 71, 77];
    return customIds.includes(reciterId) ? 7 : reciterId;
  };

  const fetchSurahs = async () => {
    try {
      setIsLoadingQuran(true);
      const res = await fetch('https://api.quran.com/api/v4/chapters?language=ar');
      const data = await res.json();
      setSurahs(data.chapters);
    } catch (err) {
      console.error("Failed to fetch surahs", err);
    } finally {
      setIsLoadingQuran(false);
    }
  };

  const loadSurah = async (surah: any, page: number = 1, append: boolean = false) => {
    setSelectedSurahObj(surah);
    setIsLoadingQuran(true);
    try {
      const apiReciter = getApiReciterId(selectedReciter);
      const res = await fetch(`https://api.quran.com/api/v4/verses/by_chapter/${surah.id}?language=ar&words=true&word_fields=text_uthmani,text_uthmani_tajweed,audio_url&audio=${apiReciter}&page=${page}&per_page=20`);
      const data = await res.json();
      if (append) {
        setVerses(prev => [...prev, ...data.verses]);
      } else {
        setVerses(data.verses);
        setQuranPage(1);
      }
      setQuranTotalPages(data.pagination.total_pages);
      setQuranPage(page);
    } catch (err) {
      console.error("Failed to fetch verses", err);
    } finally {
      setIsLoadingQuran(false);
    }
  };

  const loadContinuousSurah = async (surah: any, autoPlay: boolean = false) => {
    setContinuousSurahObj(surah);
    setIsLoadingContinuous(true);
    setContinuousVerseIndex(0);
    setIsContinuousAudioPlaying(false);
    if (continuousAudioRef.current) {
      continuousAudioRef.current.pause();
    }
    try {
      // Fetch all verses at once (per_page=300 covers the longest surah Al-Baqarah which is 286)
      const apiReciter = getApiReciterId(selectedReciter);
      const res = await fetch(`https://api.quran.com/api/v4/verses/by_chapter/${surah.id}?language=ar&words=true&word_fields=text_uthmani,text_uthmani_tajweed,audio_url&audio=${apiReciter}&page=1&per_page=300`);
      const data = await res.json();
      setContinuousVerses(data.verses);
      if (autoPlay) {
        setIsContinuousAudioPlaying(true);
      }
    } catch (err) {
      console.error("Failed to fetch continuous verses", err);
    } finally {
      setIsLoadingContinuous(false);
    }
  };

  const handleReciterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newReciter = Number(e.target.value);
    setSelectedReciter(newReciter);
    if (selectedSurahObj) {
      // Reload current surah from page 1 with new reciter
      loadSurah(selectedSurahObj, 1, false);
    }
    if (continuousSurahObj) {
      // Reload current continuous surah with new reciter
      loadContinuousSurah(continuousSurahObj, isContinuousAudioPlaying);
    }
  };

  const playAudio = (url: string | undefined, type: 'word' | 'verse', id: string | number) => {
    if (audioRef.current) {
      audioRef.current.pause();
      if (playingWordId === id || playingVerseKey === id) {
         // Toggle pause
         setPlayingWordId(null);
         setPlayingVerseKey(null);
         audioRef.current = null;
         return;
      }
    }
    
    let urlToPlay = url;
    if (type === 'verse' && id) {
      urlToPlay = getVerseAudioUrl(id as string, selectedReciter, url);
    }
    
    if (!urlToPlay) return;
    
    let fullUrl = urlToPlay;
    if (!urlToPlay.startsWith('http') && !urlToPlay.startsWith('//')) {
      fullUrl = `https://audio.qurancdn.com/${urlToPlay}`;
    } else if (urlToPlay.startsWith('//')) {
      fullUrl = `https:${urlToPlay}`;
    }
    
    const audio = new Audio(fullUrl);
    
    audio.onplay = () => {
      if (type === 'word') setPlayingWordId(id as number);
      else setPlayingVerseKey(id as string);
    };
    
    audio.onended = () => {
      if (type === 'word') setPlayingWordId(null);
      else setPlayingVerseKey(null);
      audioRef.current = null;
    };
    
    audio.onerror = () => {
      if (type === 'word') setPlayingWordId(null);
      else setPlayingVerseKey(null);
      audioRef.current = null;
      console.error("Audio failed to load:", fullUrl);
    };

    audio.play();
    audioRef.current = audio;
  };

  const speakWord = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      window.speechSynthesis.speak(utterance);
    } else {
      alert('ببورە، براوسەرێ تە پشتگیرییا خواندنا دەنگی ناکەت.');
    }
  };

  const handleGetTafsir = async (verseKey: string, words: any[]) => {
    if (!ai) {
      setError('کۆدا نهێنی یا API نەهاتیە دانان. ژ کەرەما خۆ ل سەرێ لاپەڕەی زێدە بکە.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (tafsirData[verseKey]) return; // Already have it

    const verseText = words.map(w => w.text_uthmani).join(' ');

    setIsLoadingTafsir(prev => ({ ...prev, [verseKey]: true }));
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Please provide a detailed Kurdish Badini (Kurmanji in Arabic script) Tafsir (interpretation) for the following Quranic Ayah. Provide ONLY the Tafsir text, without any introductions or extra formatting. Ayah: ${verseText}`,
      });
      setTafsirData(prev => ({ ...prev, [verseKey]: response.text?.trim() || 'تەفسیر نەهاتە دیتن' }));
    } catch (err) {
      console.error(err);
      setTafsirData(prev => ({ ...prev, [verseKey]: 'خەلەتیەک چێبوو د دەمێ ئینانا تەفسیرێ دا.' }));
    } finally {
      setIsLoadingTafsir(prev => ({ ...prev, [verseKey]: false }));
    }
  };

  const handleGenerateImage = async (verseKey: string, words: any[]) => {
    if (!ai) {
      setError('کۆدا نهێنی یا API نەهاتیە دانان. ژ کەرەما خۆ ل سەرێ لاپەڕەی زێدە بکە.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (generatedImages[verseKey]) return;

    setIsGeneratingImage(prev => ({ ...prev, [verseKey]: true }));
    try {
      const verseText = words.map(w => w.text_uthmani).join(' ');
      
      // Ensure we have Tafsir for context to make an extremely accurate image
      let tafsir = tafsirData[verseKey];
      if (!tafsir) {
        try {
          const tafsirResponse = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: `Please provide a detailed Kurdish Badini (Kurmanji in Arabic script) Tafsir (interpretation) for the following Quranic Ayah. Provide ONLY the Tafsir text, without any introductions or extra formatting. Ayah: ${verseText}`,
          });
          tafsir = tafsirResponse.text?.trim() || '';
          if (tafsir) {
            setTafsirData(prev => ({ ...prev, [verseKey]: tafsir }));
          }
        } catch (tafsirErr) {
          console.error("Failed to automatically pre-fetch tafsir for image gen", tafsirErr);
        }
      }

      // Generate a highly specific, visually descriptive image prompt and concise Kurdish overlay
      let imagePrompt = `A beautiful, respectful, and highly-detailed photorealistic or historical fine-art painting depicting the meaning of this Quranic verse: "${verseText}". Focus on elegant natural scenery, soft warm lighting, or respectful historical human gatherings. No modern elements. DO NOT depict God, angels, or prophets.`;
      let kurdishOverlay = '';

      if (tafsir) {
        try {
          const promptGenResponse = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: `Create a highly descriptive, cinematic, and respectful AI image generation prompt (in English) representing the visual story, theme, and meaning of this Quranic verse, along with a concise, single-sentence Kurdish (Kurmanji Badini) translation or key message of the verse to be overlayed on the image.

            Arabic Verse: "${verseText}"
            Kurdish Tafsir: "${tafsir}"

            You MUST return a valid JSON object with exactly two keys:
            1. "prompt": A highly-detailed, cinematic, photorealistic, or classical fine-art scene description (in English) that beautifully and accurately illustrates the moral, story, or concept behind the verse. Emphasize warm natural lighting, composition, mood, and details. Since the user is Kurdish, if the verse is about family, community, sharing, children, or nature, describe a warm, traditional Middle Eastern/Kurdish setting (e.g., traditional Kurdish attire with traditional sash and headscarf, a rustic stone house, warm family gathering on carpets, olive trees, or mountains) to make it culturally resonant. Keep it under 120 words. Absolutely NO text inside the image. Ensure it is respectful and DO NOT depict God, angels, or prophets.
            2. "kurdish_overlay": A beautiful, extremely concise, single-sentence translation or main lesson of the verse in Kurmanji Badini Kurdish (Arabic script). This text will be written on the image, so it must be short, clear, and elegant (e.g., similar to: "ئەگەر ترسیان کۆ نەشێن دادپەروەریێ بکەن، تەنێ ئێک ژێ مارە بکەن.").

            Return ONLY the valid JSON object, no markdown formatting, no introductions.`,
            config: {
              responseMimeType: "application/json"
            }
          });
          
          if (promptGenResponse.text) {
            const parsed = JSON.parse(promptGenResponse.text.trim());
            if (parsed.prompt) imagePrompt = parsed.prompt;
            if (parsed.kurdish_overlay) kurdishOverlay = parsed.kurdish_overlay;
          }
        } catch (promptErr) {
          console.error("Failed to generate advanced prompt, falling back to basic prompt:", promptErr);
        }
      }

      // If Kurdish overlay is still empty, let's make a basic one
      if (!kurdishOverlay && tafsir) {
        kurdishOverlay = tafsir.split(/[.،؛]/)[0].trim(); // Take first phrase/sentence
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [
            {
              text: imagePrompt,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9",
          }
        }
      });
      
      let imageUrl = '';
      if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      }
      
      if (imageUrl) {
        setGeneratedImages(prev => ({ ...prev, [verseKey]: imageUrl }));
        if (kurdishOverlay) {
          setImageOverlayTexts(prev => ({ ...prev, [verseKey]: kurdishOverlay }));
        }
      } else {
        throw new Error("No image generated");
      }
    } catch (err: any) {
      console.error(err);
      let errorMessage = 'خەلەتیەک چێبوو د دەمێ دروستکرنا وێنەی دا.';
      
      if (err.message && (err.message.includes('429') || err.message.includes('quota'))) {
        errorMessage = 'ببورە، لیمیتێ بکارئینانا API یێ وێنە دروستکرنێ ب دوماهی هاتیە (Quota Exceeded). پێدڤییە تو API Key یەکێ دی بکاربینی یان ژی هەتا سوبەهی چاڤەڕێ بکی.';
      } else if (err.message) {
        errorMessage += '\n' + err.message;
      }
      
      alert(errorMessage);
    } finally {
      setIsGeneratingImage(prev => ({ ...prev, [verseKey]: false }));
    }
  };

  const downloadIllustratedImage = (verseKey: string) => {
    const base64Data = generatedImages[verseKey];
    if (!base64Data) return;

    const overlayText = imageOverlayTexts[verseKey] || '';
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = base64Data;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 1280;
      canvas.height = img.naturalHeight || 720;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Draw the generated background image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // 2. Add an elegant dark vignette at the top-left to make text highly readable
      const gradient = ctx.createLinearGradient(0, 0, canvas.width * 0.7, canvas.height * 0.5);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
      gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.2)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 3. Draw Kurdish text with beautiful drop shadow
      if (overlayText) {
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        ctx.fillStyle = '#ffffff';
        const fontSize = Math.round(canvas.height * 0.05); // ~36px for 720p
        ctx.font = `bold ${fontSize}px "Inter", "Scheherazade New", sans-serif`;
        ctx.textAlign = 'right';
        ctx.direction = 'rtl';

        // Word wrap
        const words = overlayText.split(' ');
        let line = '';
        let y = canvas.height * 0.12; 
        const x = canvas.width * 0.92; 
        const maxWidth = canvas.width * 0.5; 
        const lineHeight = fontSize * 1.4;

        for (let n = 0; n < words.length; n++) {
          let testLine = line + words[n] + ' ';
          let metrics = ctx.measureText(testLine);
          let testWidth = metrics.width;
          if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line.trim(), x, y);
            line = words[n] + ' ';
            y += lineHeight;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line.trim(), x, y);
        ctx.restore();
      }

      // 4. Draw an elegant book and stand icon
      ctx.save();
      const iconSize = Math.round(canvas.height * 0.1); 
      ctx.font = `${iconSize}px sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText('📖', canvas.width * 0.05, canvas.height * 0.15);
      ctx.restore();

      // 5. Download the final composited card!
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `Quran_Ayah_${verseKey.replace(':', '_')}_Illustrated.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
  };

  const handleQuranSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quranSearchQuery.trim()) return;
    
    setIsSearchingQuran(true);
    setQuranSearchResults([]);
    setSelectedSurahObj(null);
    setError('');
    
    try {
      if (!ai) {
        setError('کۆدا نهێنی یا API نەهاتیە دانان بۆ لێگەڕیانا زیرەک. ژ کەرەما خۆ ل سەرێ لاپەڕەی زێدە بکە.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setIsSearchingQuran(false);
        return;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Find up to 5 Quranic verses that match or discuss this topic/query: "${quranSearchQuery}". 
        Return ONLY a valid JSON array of objects. Each object must have:
        "verse_key": the chapter:verse number (e.g., "2:255"),
        "explanation": a brief explanation in Kurmanji Kurdish (Arabic script) of why this verse matches.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                verse_key: { type: Type.STRING },
                explanation: { type: Type.STRING }
              },
              required: ["verse_key", "explanation"]
            }
          }
        }
      });

      const text = response.text?.trim();
      if (text) {
        const aiResults = JSON.parse(text);
        
        const fetchedVerses = [];
        for (const item of aiResults) {
          try {
            const apiReciter = getApiReciterId(selectedReciter);
            const res = await fetch(`https://api.quran.com/api/v4/verses/by_key/${item.verse_key}?language=ar&words=true&word_fields=text_uthmani,text_uthmani_tajweed,audio_url&audio=${apiReciter}`);
            const data = await res.json();
            if (data.verse) {
              fetchedVerses.push({
                ...data.verse,
                ai_explanation: item.explanation
              });
            }
          } catch (e) {
            console.error("Failed to fetch verse", item.verse_key);
          }
        }
        setQuranSearchResults(fetchedVerses);
      }
    } catch (err) {
      console.error("AI Search failed", err);
      setError('خەلەتیەک چێبوو د لێگەڕیانێ دا.');
    } finally {
      setIsSearchingQuran(false);
    }
  };

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
      setError('کۆدا نهێنی یا API نەهاتیە دانان. ژ کەرەما خۆ ل سەرێ لاپەڕەی زێدە بکە.');
      return;
    }

    setIsLoadingPart(true);
    setError('');

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a JSON array of exactly ${expectedCount} unique Quranic Arabic words and their Kurmanji Kurdish (Arabic script) translations. This is for part ${part} out of 100 of a Quranic dictionary. Ensure the words are diverse and appropriate for a comprehensive dictionary. IMPORTANT: The Arabic words MUST include full diacritics (Tashkeel) such as Fatha, Kasra, Damma, Shadda, Sukun, etc. (e.g., "بَيِّنَة").`,
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
      setError('کۆدا نهێنی یا API نەهاتیە دانان. ژ کەرەما خۆ ل سەرێ لاپەڕەی زێدە بکە.');
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
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-[#f8f9fa] text-slate-800'} font-sans`} dir="rtl">
      {/* Header */}
      <header className={`${isDarkMode ? 'bg-slate-800 border-b border-slate-700' : 'bg-emerald-700'} text-white shadow-lg transition-colors duration-300`}>
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  فەرهەنگا پەیڤێن قورئانێ
                </h1>
                <p className={`mt-1 text-lg ${isDarkMode ? 'text-slate-400' : 'text-emerald-100/90'}`}>
                  لێگەڕیان و لیستا پەیڤێن قورئانا پیرۆز ب زمانێ کوردی
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 bg-black/10 p-2 rounded-2xl backdrop-blur-sm self-end md:self-auto">
              {/* Font Size Controls */}
              <div className="flex items-center gap-1 bg-white/10 rounded-xl p-1">
                <button 
                  onClick={() => setFontSize(prev => Math.max(16, prev - 2))}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="بچیککرنا خەتی"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1 px-2 min-w-[60px] justify-center">
                  <TypeIcon className="w-4 h-4 opacity-70" />
                  <span className="text-sm font-bold">{fontSize}</span>
                </div>
                <button 
                  onClick={() => setFontSize(prev => Math.min(64, prev + 2))}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="مەزنکرنا خەتی"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Dark Mode Toggle */}
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all flex items-center gap-2"
                title={isDarkMode ? 'دوخێ ڕۆناهی' : 'دوخێ تاری'}
              >
                {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-emerald-100" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* API Key Section */}
        <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200/60'} p-4 rounded-2xl shadow-sm border mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between transition-colors`}>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className={`${isDarkMode ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-100 text-emerald-600'} p-2.5 rounded-xl shrink-0`}>
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>کۆدا نهێنی (API Key)</h3>
              <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>پێدڤییە بۆ وەرگێڕان و ئینانا پەیڤان</p>
            </div>
          </div>
          
          <div className="flex w-full md:w-auto gap-2">
            {!isKeySaved ? (
              <>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="کۆدا API ل ڤێرە بنڤیسە..."
                  className={`flex-1 md:w-64 px-4 py-2.5 rounded-xl border outline-none text-left font-mono text-sm transition-all ${
                    isDarkMode 
                      ? 'bg-slate-900 border-slate-700 text-slate-200 focus:border-emerald-500' 
                      : 'bg-slate-50 border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
                  }`}
                  dir="ltr"
                />
                <button
                  onClick={handleSaveApiKey}
                  disabled={!apiKeyInput.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50 shrink-0"
                >
                  <Save className="w-4 h-4" />
                  خەزن بکە
                </button>
              </>
            ) : (
              <div className={`flex items-center gap-4 px-4 py-2.5 rounded-xl border w-full md:w-auto justify-between md:justify-start ${
                isDarkMode ? 'bg-emerald-900/20 border-emerald-800/50' : 'bg-emerald-50 border-emerald-100'
              }`}>
                <span className={`${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'} flex items-center gap-2 text-sm font-bold`}>
                  <Check className="w-4 h-4" />
                  هاتیە خەزنکرن
                </span>
                <button
                  onClick={handleClearApiKey}
                  className={`text-xs font-medium px-2 py-1 rounded transition-colors ${
                    isDarkMode ? 'text-red-400 hover:bg-red-900/30' : 'text-red-500 hover:text-red-700 hover:bg-red-50'
                  }`}
                >
                  ژێببە
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className={`flex space-x-2 space-x-reverse mb-8 p-1.5 rounded-2xl shadow-sm border w-fit overflow-x-auto max-w-full transition-colors ${
          isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200/60'
        }`}>
          <button
            onClick={() => { setActiveTab('mushaf'); setError(''); }}
            className={`px-5 py-2.5 rounded-xl text-base font-medium flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'mushaf'
                ? (isDarkMode ? 'bg-emerald-600 text-white shadow-md' : 'bg-emerald-100/80 text-emerald-800 shadow-sm')
                : (isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50')
            }`}
          >
            <BookOpen className="w-4 h-4" />
            قورئان (لاپەڕ)
          </button>
          <button
            onClick={() => { setActiveTab('quran'); setError(''); }}
            className={`px-5 py-2.5 rounded-xl text-base font-medium flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'quran'
                ? (isDarkMode ? 'bg-emerald-600 text-white shadow-md' : 'bg-emerald-100/80 text-emerald-800 shadow-sm')
                : (isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50')
            }`}
          >
            <BookHeart className="w-4 h-4" />
            قورئانا پیرۆز
          </button>
          <button
            onClick={() => { setActiveTab('continuous'); setError(''); }}
            className={`px-5 py-2.5 rounded-xl text-base font-medium flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'continuous'
                ? (isDarkMode ? 'bg-emerald-600 text-white shadow-md' : 'bg-emerald-100/80 text-emerald-800 shadow-sm')
                : (isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50')
            }`}
          >
            <Play className="w-4 h-4" />
            خوێندنا بەردەوام
          </button>
          <button
            onClick={() => { setActiveTab('adhkar'); setError(''); }}
            className={`px-5 py-2.5 rounded-xl text-base font-medium flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'adhkar'
                ? (isDarkMode ? 'bg-emerald-600 text-white shadow-md' : 'bg-emerald-100/80 text-emerald-800 shadow-sm')
                : (isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50')
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            زکر و دوعا
          </button>
          <button
            onClick={() => { setActiveTab('dictionary'); setError(''); }}
            className={`px-5 py-2.5 rounded-xl text-base font-medium flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'dictionary'
                ? (isDarkMode ? 'bg-emerald-600 text-white shadow-md' : 'bg-emerald-100/80 text-emerald-800 shadow-sm')
                : (isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50')
            }`}
          >
            <Search className="w-4 h-4" />
            قامووس
          </button>
          <button
            onClick={() => { setActiveTab('list'); setError(''); }}
            className={`px-5 py-2.5 rounded-xl text-base font-medium flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'list'
                ? (isDarkMode ? 'bg-emerald-600 text-white shadow-md' : 'bg-emerald-100/80 text-emerald-800 shadow-sm')
                : (isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50')
            }`}
          >
            <ListIcon className="w-4 h-4" />
            لیستا پەیڤان
          </button>
        </div>

        {/* Adhkar Tab */}
        {activeTab === 'adhkar' && (
          <div className="space-y-6">
            {!selectedAdhkarCategory ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {adhkarData.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedAdhkarCategory(category.id)}
                    className={`p-6 rounded-3xl border transition-all flex flex-col items-center gap-4 group ${
                      isDarkMode 
                        ? 'bg-slate-800 border-slate-700 hover:border-emerald-500 hover:bg-emerald-900/20' 
                        : 'bg-white border-slate-200/60 hover:border-emerald-500 hover:bg-emerald-50'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                      isDarkMode ? 'bg-slate-900 text-emerald-400 group-hover:bg-emerald-900 group-hover:text-emerald-300' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100'
                    }`}>
                      {category.icon}
                    </div>
                    <span className={`text-xl font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{category.title}</span>
                    <span className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{category.items.length} زکر</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200/60'} rounded-3xl shadow-sm border overflow-hidden transition-colors`}>
                <div className={`p-6 md:p-8 border-b flex items-center justify-between transition-colors ${
                  isDarkMode ? 'border-slate-700 bg-slate-900/30' : 'border-slate-100 bg-slate-50/50'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                      {adhkarData.find(c => c.id === selectedAdhkarCategory)?.icon}
                    </div>
                    <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                      {adhkarData.find(c => c.id === selectedAdhkarCategory)?.title}
                    </h2>
                  </div>
                  <button
                    onClick={() => setSelectedAdhkarCategory(null)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors border ${
                      isDarkMode 
                        ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-700' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ChevronRight className="w-5 h-5" />
                    ڤەگەڕە
                  </button>
                </div>

                <div className="p-4 md:p-6 space-y-4">
                  {adhkarData.find(c => c.id === selectedAdhkarCategory)?.items.map((item) => (
                    <div 
                      key={item.id}
                      className={`rounded-2xl border transition-all overflow-hidden ${
                        isDarkMode ? 'bg-slate-900/40 border-slate-700' : 'bg-white border-slate-100 shadow-sm'
                      }`}
                    >
                      <div 
                        onClick={() => toggleAdhkarExpansion(item.id)}
                        className="p-6 cursor-pointer hover:bg-emerald-50/10 transition-colors"
                      >
                        <div className="flex justify-between items-start gap-4 mb-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              playAdhkarAudio(item.arabic, item.id);
                            }}
                            className={`p-2 rounded-full transition-all ${
                              isAdhkarAudioPlaying === item.id
                                ? 'bg-amber-500 text-white animate-pulse'
                                : (isDarkMode ? 'bg-slate-800 text-emerald-400 hover:bg-slate-700' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100')
                            }`}
                          >
                            {isAdhkarAudioPlaying === item.id ? <Pause className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                          </button>
                          <p 
                            className={`text-right leading-relaxed font-serif ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}
                            style={{ fontSize: `${fontSize}px` }}
                            dir="rtl"
                          >
                            {item.arabic}
                          </p>
                        </div>
                        
                        {expandedAdhkarIds.has(item.id) && (
                          <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                            <p className={`text-lg leading-relaxed ${isDarkMode ? 'text-emerald-400/90' : 'text-emerald-700'}`}>
                              {item.kurdish}
                            </p>
                          </div>
                        )}
                        
                        {!expandedAdhkarIds.has(item.id) && (
                          <div className="text-center mt-2">
                            <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>بۆ دیتنا رامانێ کلیک بکە</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dictionary Tab */}
        {activeTab === 'mushaf' && (
          <MushafView 
            page={mushafPage} 
            setPage={setMushafPage} 
            fontSize={fontSize} 
            selectedFont={selectedFont} 
            showTajweed={showTajweed}
            isDarkMode={isDarkMode}
            selectedReciter={selectedReciter}
            playAudio={playAudio}
            playingWordId={playingWordId}
            playingVerseKey={playingVerseKey}
            tafsirData={tafsirData}
            isLoadingTafsir={isLoadingTafsir}
            generatedImages={generatedImages}
            imageOverlayTexts={imageOverlayTexts}
            isGeneratingImage={isGeneratingImage}
            handleGetTafsir={handleGetTafsir}
            handleGenerateImage={handleGenerateImage}
            downloadIllustratedImage={downloadIllustratedImage}
            getCorrectWordAudioUrl={getCorrectWordAudioUrl}
            cleanTajweed={cleanTajweed}
          />
        )}
        {activeTab === 'dictionary' && (
          <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200/60'} p-6 md:p-8 rounded-3xl shadow-sm border transition-colors`}>
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
              <label htmlFor="search" className={`block text-base font-medium mb-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
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
                    className={`block w-full pr-11 pl-4 py-3.5 rounded-2xl border outline-none transition-all text-lg ${
                      isDarkMode 
                        ? 'bg-slate-900 border-slate-700 text-slate-200 focus:border-emerald-500' 
                        : 'bg-slate-50 border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white'
                    }`}
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
              <div className={`max-w-2xl mx-auto p-4 rounded-2xl border mb-6 flex items-center gap-3 ${
                isDarkMode ? 'bg-red-900/20 border-red-800/50 text-red-400' : 'bg-red-50/80 text-red-700 border-red-100'
              }`}>
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                {error}
              </div>
            )}

            {searchResult && (
              <div className={`max-w-2xl mx-auto border rounded-3xl p-10 text-center shadow-sm transition-colors ${
                isDarkMode ? 'bg-slate-900/50 border-emerald-900/50' : 'bg-gradient-to-br from-emerald-50 to-teal-50/30 border-emerald-100/80'
              }`}>
                <h2 
                  className={`font-bold mb-6 font-serif leading-tight ${isDarkMode ? 'text-emerald-400' : 'text-emerald-950'}`}
                  style={{ fontSize: `${fontSize * 1.5}px` }}
                >
                  {searchResult.word}
                </h2>
                <div className={`w-12 h-1.5 mx-auto mb-6 rounded-full ${isDarkMode ? 'bg-emerald-900/40' : 'bg-emerald-200/60'}`}></div>
                <p className={`text-2xl font-medium ${isDarkMode ? 'text-slate-300' : 'text-emerald-800'}`}>
                  {searchResult.meaning}
                </p>
              </div>
            )}

            {!searchResult && !isLoading && !error && (
              <div className="text-center py-16 text-slate-400 max-w-md mx-auto">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
                  <Book className={`w-10 h-10 ${isDarkMode ? 'text-slate-700' : 'text-slate-300'}`} />
                </div>
                <p className={`text-lg font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>پەیڤەکێ بنڤیسە بۆ دیتنا رامانا وێ</p>
                <p className={`text-sm mt-3 leading-relaxed ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>ئەگەر پەیڤ د لیستا مە دا نەبیت، دێ ب رێکا ژیرییا دەستکرد (AI) هێتە وەرگرتن و وەرگێڕان بۆ کوردی.</p>
              </div>
            )}
          </div>
        )}

        {/* List Tab */}
        {activeTab === 'list' && (
          <div className="space-y-6">
            {!selectedPart && (
              <div className={`${isDarkMode ? 'bg-emerald-900/20 border-emerald-800/50' : 'bg-emerald-50 border-emerald-100'} rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 transition-colors`}>
                <div className={`${isDarkMode ? 'bg-slate-800 text-emerald-400' : 'bg-white text-emerald-600'} p-4 rounded-2xl shadow-sm shrink-0`}>
                  <BookOpen className="w-8 h-8" />
                </div>
                <div>
                  <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-emerald-300' : 'text-emerald-900'}`}>زانیاری ل سەر پەیڤێن قورئانێ</h3>
                  <p className={`${isDarkMode ? 'text-emerald-400/80' : 'text-emerald-800/80'} leading-relaxed`}>
                    د قورئانا پیرۆز دا نێزیکی <strong className="font-bold">٧٧,٤٣٠</strong> پەیڤ هەنە، لێ ئەگەر پەیڤێن دووبارەبووی لاببەین، نێزیکی <strong className="font-bold">١٨,٩٩٤</strong> پەیڤێن جودا دمینن. ل ڤێرە مە لیستەکا پەیڤێن هەرە بەربەلاڤ کرینە ١٠٠ بەش.
                  </p>
                </div>
              </div>
            )}

            {!selectedPart ? (
              <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200/60'} rounded-3xl shadow-sm border overflow-hidden p-6 md:p-8 transition-colors`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                  <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>بەشێن پەیڤان (١٠٠ بەش)</h2>
                  
                  <div className="flex items-center gap-3">
                    {isDownloadingAll && (
                      <div className={`${isDarkMode ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-50 text-emerald-600'} flex items-center gap-2 font-bold px-4 py-2 rounded-xl`}>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{Math.round((downloadProgress / 100) * 100)}%</span>
                      </div>
                    )}
                    <button
                      onClick={handleDownloadAll}
                      disabled={isDownloadingAll}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors disabled:opacity-50 ${
                        isDarkMode ? 'bg-emerald-900/40 text-emerald-400 hover:bg-emerald-900/60' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      }`}
                      title="هەمی پەیڤان پێکڤە داگرە"
                    >
                      <Download className="w-5 h-5" />
                      داگرتنا هەمی پەیڤان
                    </button>
                  </div>
                </div>
                {error && (
                  <div className={`p-4 rounded-xl mb-6 border ${isDarkMode ? 'bg-red-900/20 border-red-800/50 text-red-400' : 'bg-red-50 text-red-700 border-red-100'}`}>
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {Array.from({ length: 100 }, (_, i) => i + 1).map((part) => (
                    <button
                      key={part}
                      onClick={() => loadPartWords(part)}
                      className={`relative p-4 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 group ${
                        isDarkMode 
                          ? 'border-slate-700 hover:border-emerald-500 hover:bg-emerald-900/20 text-slate-300' 
                          : 'border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700'
                      }`}
                    >
                      {localStorage.getItem(`quran_words_part_${part}`) || part === 1 ? (
                        <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-emerald-500 rounded-full" title="ئۆفلاین بەردەستە"></div>
                      ) : null}
                      <Book className={`w-6 h-6 transition-colors ${isDarkMode ? 'text-slate-600 group-hover:text-emerald-500' : 'text-slate-400 group-hover:text-emerald-500'}`} />
                      <span className="font-bold text-lg">بەشێ {part}</span>
                      <span className="text-xs text-slate-400">{part === 100 ? '١٨٤' : '١٩٠'} پەیڤ</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200/60'} rounded-3xl shadow-sm border overflow-hidden transition-colors`}>
                <div className={`p-6 md:p-8 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
                  isDarkMode ? 'border-slate-700 bg-slate-900/30' : 'border-slate-100 bg-slate-50/50'
                }`}>
                  <div>
                    <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>پەیڤێن بەشێ {selectedPart}</h2>
                    <p className={`mt-2 text-lg ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{selectedPart === 100 ? '١٨٤' : '١٩٠'} پەیڤ د ڤی بەشی دا هەنە.</p>
                  </div>
                  <button
                    onClick={() => setSelectedPart(null)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-colors shrink-0 border ${
                      isDarkMode 
                        ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-700' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ChevronRight className="w-5 h-5" />
                    ڤەگەڕە بۆ بەشان
                  </button>
                </div>
                
                {isLoadingPart ? (
                  <div className="p-20 flex flex-col items-center justify-center text-emerald-600">
                    <Loader2 className="w-12 h-12 animate-spin mb-4" />
                    <p className="text-lg font-medium">پەیڤ دهێنە ئامادەکرن ژ لایێ ژیرییا دەستکرد ڤە...</p>
                    <p className={`text-sm mt-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>دبیت چەند چرکەیەک پێبچیت ژبەر زۆرییا پەیڤان ({selectedPart === 100 ? '١٨٤' : '١٩٠'} پەیڤ)</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0">
                      {partWords[selectedPart]?.map((item, index) => (
                        <div 
                          key={index} 
                          className={`p-6 border-b border-l transition-colors flex flex-col justify-center items-center text-center group relative ${
                            isDarkMode ? 'border-slate-700 hover:bg-emerald-900/20' : 'border-slate-100 hover:bg-emerald-50/40'
                          }`}
                        >
                          <button 
                            onClick={() => speakWord(item.word)}
                            className={`absolute top-4 left-4 p-2 rounded-full shadow-sm transition-all opacity-0 group-hover:opacity-100 ${
                              isDarkMode ? 'bg-slate-800 text-emerald-400 hover:bg-slate-700' : 'bg-white text-emerald-600 hover:bg-emerald-50'
                            } hover:scale-110`}
                            title="گوهداری بکە"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                          <span 
                            className={`font-bold font-serif mb-3 transition-colors quran-text ${isDarkMode ? 'dark-mode-text' : 'text-slate-800'} group-hover:text-emerald-700`}
                            style={{ fontSize: `${fontSize}px` }}
                          >
                            {item.word}
                          </span>
                          <span className={`font-medium text-lg px-4 py-1 rounded-full ${isDarkMode ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                            {item.meaning}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className={`p-6 text-center border-t transition-colors ${
                      isDarkMode ? 'text-slate-500 bg-slate-900/30 border-slate-700' : 'text-slate-500 bg-slate-50/50 border-slate-100'
                    }`}>
                      <p>ئەڤ پەیڤە هاتینە خەزنکرن و نوکە ب شێوەیێ <strong className="text-emerald-600">ئۆفلاین</strong> د بەردەستن.</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Quran Tab */}
        {activeTab === 'quran' && (
          <div className="space-y-6">
            {error && (
              <div className="max-w-3xl mx-auto p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                {error}
              </div>
            )}
            
            {/* Quran AI Search Bar */}
            <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200/60'} p-6 rounded-3xl shadow-sm border transition-colors`}>
              <form onSubmit={handleQuranSearch} className="max-w-3xl mx-auto">
                <label className={`block text-base font-medium mb-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  ل ئایەتەکێ بگەڕە (ب عەرەبی یان بابەتێ وێ ب کوردی بنڤیسە)
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={quranSearchQuery}
                      onChange={(e) => setQuranSearchQuery(e.target.value)}
                      placeholder="نموونە: ئەو ئایەتێن بەحسێ دایک و بابان دکەن..."
                      className={`block w-full pr-11 pl-4 py-3.5 rounded-2xl border outline-none transition-all text-lg ${
                        isDarkMode 
                          ? 'bg-slate-900 border-slate-700 text-slate-200 focus:border-emerald-500' 
                          : 'bg-slate-50 border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white'
                      }`}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearchingQuran || !quranSearchQuery.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3.5 rounded-2xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                  >
                    {isSearchingQuran ? <Loader2 className="w-5 h-5 animate-spin" /> : 'لێگەڕیان'}
                  </button>
                </div>
              </form>
            </div>

            {/* Quran Settings Bar */}
            <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200/60'} p-4 rounded-2xl shadow-sm border flex flex-wrap items-center gap-4 transition-colors`}>
              <div className="flex items-center gap-2">
                <label className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>فۆنتێ قورئانێ:</label>
                <select 
                  value={selectedFont} 
                  onChange={(e) => setSelectedFont(e.target.value)}
                  className={`px-3 py-1.5 rounded-lg border text-sm outline-none transition-colors ${
                    isDarkMode 
                      ? 'bg-slate-900 border-slate-700 text-slate-200 focus:border-emerald-500' 
                      : 'bg-slate-50 border-slate-200 text-slate-700 focus:border-emerald-500'
                  }`}
                >
                  <option value="Uthmanic Hafs">Uthman Taha Naskh (Hafs)</option>
                  <option value="Amiri Quran">Amiri Quran</option>
                  <option value="Traditional Arabic">Traditional Arabic</option>
                  <option value="Scheherazade New">Scheherazade New</option>
                  <option value="Lateef">Lateef</option>
                  <option value="Noto Naskh Arabic">Noto Naskh Arabic</option>
                  <option value="Amiri">Amiri</option>
                  {customFonts.map(f => (
                    <option key={f.name} value={f.name}>فۆنتێ تە ({f.name.substring(0, 10)}...)</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <label className={`text-sm font-medium cursor-pointer px-3 py-1.5 rounded-lg transition-colors border ${
                  isDarkMode 
                    ? 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-700' 
                    : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                }`}>
                  فۆنتەکێ باربکە (Upload)
                  <input 
                    type="file" 
                    accept=".ttf,.otf,.woff,.woff2" 
                    onChange={handleFontUpload} 
                    className="hidden" 
                  />
                </label>
              </div>

              <div className="flex items-center gap-2 mr-auto">
                <label className={`flex items-center gap-2 text-sm font-medium cursor-pointer select-none ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  <input 
                    type="checkbox" 
                    checked={showTajweed}
                    onChange={(e) => setShowTajweed(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  رەنگێن تەجویدێ
                </label>
              </div>
            </div>

            {/* Search Results */}
            {quranSearchResults.length > 0 && !selectedSurahObj && (
              <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200/60'} rounded-3xl shadow-sm border overflow-hidden p-6 md:p-8 transition-colors`}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>ئەنجامێن لێگەڕیانێ</h2>
                  <button
                    onClick={() => {
                      setQuranSearchResults([]);
                      setQuranSearchQuery('');
                    }}
                    className="text-sm text-red-500 hover:text-red-700 font-medium"
                  >
                    لاببرە
                  </button>
                </div>
                <div className="space-y-8">
                  {quranSearchResults.map((verse) => (
                    <div key={verse.id} className={`border-b pb-8 last:border-0 ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                      {verse.ai_explanation && (
                        <div className={`mb-6 p-4 border rounded-2xl text-sm md:text-base font-kurdish ${
                          isDarkMode ? 'bg-emerald-900/20 border-emerald-800/50 text-emerald-400' : 'bg-emerald-50/80 border-emerald-100 text-emerald-800'
                        }`}>
                          <strong className="font-bold">بۆچی ئەڤ ئایەتە؟</strong> {verse.ai_explanation}
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-y-6 gap-x-3 justify-start mb-6 text-right leading-loose" dir="rtl">
                        {verse.words?.map((word: any) => {
                          const hasAudio = !!word.audio_url && 
                                           word.char_type_name !== 'end' && 
                                           word.char_type_name !== 'stop' && 
                                           word.text_uthmani !== 'ۗ' && 
                                           word.text_uthmani !== 'ۖ' && 
                                           word.text_uthmani !== 'ج' && 
                                           word.text_uthmani !== 'ۛ' && 
                                           word.text_uthmani !== 'ۘ' && 
                                           word.text_uthmani !== 'ۙ' && 
                                           word.text_uthmani !== 'ۚ';
                          const isPlaying = playingWordId === word.id;
                          return (
                            <span 
                              key={word.id}
                              onClick={() => {
                                if (hasAudio) {
                                  const correctUrl = getCorrectWordAudioUrl(word, verse.words, verse.verse_key);
                                  playAudio(correctUrl, 'word', word.id);
                                }
                              }}
                              className={`inline quran-text select-none transition-all duration-200 ${
                                !showTajweed ? 'no-tajweed-colors' : ''
                              } ${
                                isDarkMode ? 'dark-mode-text' : ''
                              } ${
                                hasAudio 
                                  ? 'cursor-pointer hover:text-emerald-500 hover:bg-emerald-500/10 rounded px-1' 
                                  : ''
                              } ${
                                isPlaying 
                                  ? (isDarkMode ? 'bg-emerald-950 text-emerald-400 font-bold border-b-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-bold border-b-2 border-emerald-500') 
                                  : ''
                              }`} 
                              style={{ fontFamily: selectedFont, fontSize: `${fontSize}px` }}
                              dangerouslySetInnerHTML={{ __html: cleanTajweed(showTajweed ? (word.text_uthmani_tajweed || word.text_uthmani) : word.text_uthmani) }}
                              title={hasAudio ? "بۆ گوهداریکرنێ کلیک بکە" : undefined}
                            />
                          );
                        })}
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-emerald-500 text-emerald-600 text-sm font-bold mx-2">
                          {verse.verse_key.split(':')[1]}
                        </span>
                      </div>
                      
                      <div className={`flex flex-wrap items-center gap-3 p-3 rounded-2xl border transition-colors ${
                        isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-100'
                      }`}>
                        <span className={`px-3 py-1.5 rounded-lg font-bold text-sm mr-auto ${
                          isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
                        }`}>
                          ئایەتا {verse.verse_key}
                        </span>
                        <button
                          onClick={() => playAudio(verse.audio?.url, 'verse', verse.verse_key)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
                            playingVerseKey === verse.verse_key 
                              ? 'bg-emerald-600 text-white shadow-sm' 
                              : (isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-emerald-500' : 'bg-white border border-slate-200 text-slate-700 hover:border-emerald-400 hover:text-emerald-600')
                          }`}
                        >
                          {playingVerseKey === verse.verse_key ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          {playingVerseKey === verse.verse_key ? 'ڕاوەستینە' : 'گوهداری بکە'}
                        </button>
                        
                        <button
                          onClick={() => handleGetTafsir(verse.verse_key, verse.words)}
                          disabled={isLoadingTafsir[verse.verse_key]}
                          className={`flex items-center gap-2 px-4 py-2 border rounded-xl font-medium transition-colors disabled:opacity-50 ${
                            isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-blue-500' : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-400 hover:text-blue-600'
                          }`}
                        >
                          {isLoadingTafsir[verse.verse_key] ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                          تەفسیرا بادینی
                        </button>
                        
                        <button
                          onClick={() => handleGenerateImage(verse.verse_key, verse.words)}
                          disabled={isGeneratingImage[verse.verse_key]}
                          className={`flex items-center gap-2 px-4 py-2 border rounded-xl font-medium transition-colors disabled:opacity-50 ${
                            isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-purple-500' : 'bg-white border border-slate-200 text-slate-700 hover:border-purple-400 hover:text-purple-600'
                          }`}
                        >
                          {isGeneratingImage[verse.verse_key] ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                          تەفسیر ب وێنە
                        </button>
                      </div>

                      {tafsirData[verse.verse_key] && (
                        <div className={`mt-4 p-5 border rounded-2xl leading-relaxed text-lg font-kurdish transition-colors ${
                          isDarkMode ? 'bg-blue-900/10 border-blue-900/30 text-slate-300' : 'bg-blue-50/50 border-blue-100 text-slate-700'
                        }`}>
                          <h4 className={`font-bold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-800'}`}>
                            <BookOpen className="w-4 h-4" />
                            تەفسیرا ئایەتێ:
                          </h4>
                          <p>{tafsirData[verse.verse_key]}</p>
                        </div>
                      )}
                      
                      {generatedImages[verse.verse_key] && (
                        <div className={`mt-4 p-5 border rounded-2xl flex flex-col items-center transition-colors ${
                          isDarkMode ? 'bg-purple-900/10 border-purple-900/30' : 'bg-purple-50/50 border-purple-100'
                        }`}>
                          <h4 className={`font-bold mb-4 flex items-center gap-2 self-start font-kurdish ${isDarkMode ? 'text-purple-400' : 'text-purple-800'}`}>
                            <ImageIcon className="w-4 h-4" />
                            وێنەیێ تەفسیرێ:
                          </h4>
                          <img 
                            src={generatedImages[verse.verse_key]} 
                            alt="Quranic Verse Illustration" 
                            className="w-full max-w-2xl rounded-xl shadow-md object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!selectedSurahObj && quranSearchResults.length === 0 && (
              <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200/60'} rounded-3xl shadow-sm border overflow-hidden p-6 md:p-8 transition-colors`}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>قورئانا پیرۆز</h2>
                  {isLoadingQuran && <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {surahs.map((surah) => (
                    <button
                      key={surah.id}
                      onClick={() => loadSurah(surah)}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between group text-right ${
                        isDarkMode 
                          ? 'border-slate-700 hover:border-emerald-500 hover:bg-emerald-900/20 text-slate-300' 
                          : 'border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <span className={`block font-bold text-lg group-hover:text-emerald-500 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-800'}`}>{surah.name_arabic}</span>
                        <span className="text-xs text-slate-400">{surah.verses_count} ئایەت</span>
                      </div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm transition-colors ${
                        isDarkMode ? 'bg-slate-900 text-slate-500 group-hover:bg-emerald-900 group-hover:text-emerald-400' : 'bg-slate-100 text-slate-500 group-hover:bg-emerald-200 group-hover:text-emerald-700'
                      }`}>
                        {surah.id}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {selectedSurahObj && (
              <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200/60'} rounded-3xl shadow-sm border overflow-hidden transition-colors`}>
                <div className={`p-6 md:p-8 border-b flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sticky top-0 z-10 backdrop-blur-md transition-colors ${
                  isDarkMode ? 'border-slate-700 bg-slate-800/80' : 'border-slate-100 bg-emerald-50/50'
                }`}>
                  <div>
                    <h2 className={`text-3xl font-bold font-serif ${isDarkMode ? 'text-emerald-400' : 'text-emerald-900'}`}>{selectedSurahObj.name_arabic}</h2>
                    <p className={`${isDarkMode ? 'text-emerald-500' : 'text-emerald-700'} mt-1`}>سورة {selectedSurahObj.name_arabic} - {selectedSurahObj.verses_count} ئایەت</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <select
                      value={selectedReciter}
                      onChange={handleReciterChange}
                      className={`w-full sm:w-auto px-4 py-2.5 rounded-xl border outline-none transition-colors ${
                        isDarkMode 
                          ? 'bg-slate-900 border-slate-700 text-emerald-400 focus:border-emerald-500' 
                          : 'bg-white border-emerald-200 text-emerald-800 focus:ring-2 focus:ring-emerald-500'
                      }`}
                    >
                      <option value={7}>ميشاري العفاسي</option>
                      <option value={2}>عبد الباسط عبد الصمد</option>
                      <option value={3}>عبد الرحمن السديس</option>
                      <option value={4}>أبو بكر الشاطري</option>
                      <option value={6}>محمود خليل الحصري</option>
                      <option value={9}>محمد صديق المنشاوي</option>
                      <option value={10}>سعود الشريم</option>
                      <option value={11}>محمد الطبلاوي</option>
                      <option value={16}>سعد الغامدي</option>
                      <option value={67}>ياسر الدوسري</option>
                      <option value={68}>ناصر القطامي</option>
                      <option value={29}>ماهر المعيقلي</option>
                      <option value={71}>أحمد العجمي</option>
                      <option value={77}>فارس عباد</option>
                    </select>
                    
                    <button
                      onClick={() => {
                        setSelectedSurahObj(null);
                        setVerses([]);
                        if (audioRef.current) {
                          audioRef.current.pause();
                          audioRef.current = null;
                        }
                      }}
                      className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 border rounded-xl font-medium transition-colors shrink-0 ${
                        isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <ChevronRight className="w-5 h-5" />
                      ڤەگەڕە بۆ سوورەتان
                    </button>
                  </div>
                </div>

                <div className="p-4 md:p-8 space-y-8">
                  {verses.map((verse) => {
                    const isPlayingThisVerse = playingVerseKey === verse.verse_key;
                    return (
                      <div 
                        key={verse.id} 
                        id={`quran-verse-${verse.verse_key}`}
                        className={`transition-all duration-500 rounded-3xl p-6 md:p-8 border relative overflow-hidden ${
                          isPlayingThisVerse 
                            ? (isDarkMode 
                                ? 'bg-emerald-950/60 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)] ring-2 ring-emerald-500/40 scale-[1.01]' 
                                : 'bg-emerald-50/90 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-2 ring-emerald-500/20 scale-[1.01]') 
                            : (isDarkMode ? 'border-transparent bg-transparent hover:bg-slate-800/30' : 'border-transparent bg-transparent hover:bg-slate-50/40')
                        }`}
                      >
                        {isPlayingThisVerse && (
                          <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                            <span>خوێندنا دەنگی</span>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-y-6 gap-x-3 justify-start mb-6 text-right leading-loose" dir="rtl">
                          {verse.words?.map((word: any) => {
                            const hasAudio = !!word.audio_url && 
                                             word.char_type_name !== 'end' && 
                                             word.char_type_name !== 'stop' && 
                                             word.text_uthmani !== 'ۗ' && 
                                             word.text_uthmani !== 'ۖ' && 
                                             word.text_uthmani !== 'ج' && 
                                             word.text_uthmani !== 'ۛ' && 
                                             word.text_uthmani !== 'ۘ' && 
                                             word.text_uthmani !== 'ۙ' && 
                                             word.text_uthmani !== 'ۚ';
                            const isPlaying = playingWordId === word.id;
                            return (
                              <span 
                                key={word.id}
                                onClick={() => {
                                  if (hasAudio) {
                                    const correctUrl = getCorrectWordAudioUrl(word, verse.words, verse.verse_key);
                                    playAudio(correctUrl, 'word', word.id);
                                  }
                                }}
                                className={`inline quran-text select-none transition-all duration-200 ${
                                  !showTajweed ? 'no-tajweed-colors' : ''
                                } ${
                                  isDarkMode ? 'dark-mode-text' : ''
                                } ${
                                  hasAudio 
                                    ? 'cursor-pointer hover:text-emerald-500 hover:bg-emerald-500/10 rounded px-1' 
                                    : ''
                                } ${
                                  isPlaying 
                                    ? (isDarkMode ? 'bg-emerald-950 text-emerald-400 font-bold border-b-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-bold border-b-2 border-emerald-500') 
                                    : ''
                                }`} 
                                style={{ fontFamily: selectedFont, fontSize: `${fontSize}px` }}
                                dangerouslySetInnerHTML={{ __html: cleanTajweed(showTajweed ? (word.text_uthmani_tajweed || word.text_uthmani) : word.text_uthmani) }}
                                title={hasAudio ? "بۆ گوهداریکرنێ کلیک بکە" : undefined}
                              />
                            );
                          })}
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-emerald-500 text-emerald-600 text-sm font-bold mx-2">
                            {verse.verse_key.split(':')[1]}
                          </span>
                        </div>
                        
                        <div className={`flex flex-wrap items-center gap-3 p-3 rounded-2xl border transition-colors ${
                          isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-100'
                        }`}>
                          <button
                            onClick={() => playAudio(verse.audio?.url, 'verse', verse.verse_key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
                              playingVerseKey === verse.verse_key 
                                ? 'bg-emerald-600 text-white shadow-sm' 
                                : (isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-emerald-500' : 'bg-white border border-slate-200 text-slate-700 hover:border-emerald-400 hover:text-emerald-600')
                            }`}
                          >
                            {playingVerseKey === verse.verse_key ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            {playingVerseKey === verse.verse_key ? 'ڕاوەستینە' : 'گوهداری بکە'}
                          </button>
                          
                          <button
                            onClick={() => handleGetTafsir(verse.verse_key, verse.words)}
                            disabled={isLoadingTafsir[verse.verse_key]}
                            className={`flex items-center gap-2 px-4 py-2 border rounded-xl font-medium transition-colors disabled:opacity-50 ${
                              isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-blue-500' : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-400 hover:text-blue-600'
                            }`}
                          >
                            {isLoadingTafsir[verse.verse_key] ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                            تەفسیرا بادینی
                          </button>
                          
                          <button
                            onClick={() => handleGenerateImage(verse.verse_key, verse.words)}
                            disabled={isGeneratingImage[verse.verse_key]}
                            className={`flex items-center gap-2 px-4 py-2 border rounded-xl font-medium transition-colors disabled:opacity-50 ${
                              isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-purple-500' : 'bg-white border border-slate-200 text-slate-700 hover:border-purple-400 hover:text-purple-600'
                            }`}
                          >
                            {isGeneratingImage[verse.verse_key] ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                            تەفسیر ب وێنە
                          </button>
                        </div>

                        {tafsirData[verse.verse_key] && (
                          <div className={`mt-4 p-5 border rounded-2xl leading-relaxed text-lg font-kurdish transition-colors ${
                            isDarkMode ? 'bg-blue-900/10 border-blue-900/30 text-slate-300' : 'bg-blue-50/50 border-blue-100 text-slate-700'
                          }`}>
                            <h4 className={`font-bold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-800'}`}>
                              <BookOpen className="w-4 h-4" />
                              تەفسیرا ئایەتێ:
                            </h4>
                            <p>{tafsirData[verse.verse_key]}</p>
                          </div>
                        )}
                        
                        {generatedImages[verse.verse_key] && (
                          <div className={`mt-4 p-5 border rounded-2xl flex flex-col items-center transition-colors ${
                            isDarkMode ? 'bg-purple-900/10 border-purple-900/30' : 'bg-purple-50/50 border-purple-100'
                          }`}>
                            <h4 className={`font-bold mb-4 flex items-center gap-2 self-start font-kurdish ${isDarkMode ? 'text-purple-400' : 'text-purple-800'}`}>
                              <ImageIcon className="w-4 h-4" />
                              وێنەیێ تەفسیرێ:
                            </h4>
                            <img 
                              src={generatedImages[verse.verse_key]} 
                              alt="Quranic Verse Illustration" 
                              className="w-full max-w-2xl rounded-xl shadow-md object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {quranPage < quranTotalPages && (
                    <div className="text-center pt-4">
                      <button
                        onClick={() => loadSurah(selectedSurahObj, quranPage + 1, true)}
                        disabled={isLoadingQuran}
                        className={`px-8 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto ${
                          isDarkMode ? 'bg-emerald-900/40 text-emerald-400 hover:bg-emerald-900/60' : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                        }`}
                      >
                        {isLoadingQuran ? <Loader2 className="w-5 h-5 animate-spin" /> : 'ئایەتێن زێدەتر نیشان بدە'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Continuous Tab */}
        {activeTab === 'continuous' && (
          <div className="space-y-6 pb-32">
            {!continuousSurahObj ? (
              <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200/60'} rounded-3xl shadow-sm border overflow-hidden p-6 md:p-8 transition-colors`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>خوێندنا بەردەوام</h2>
                    {isLoadingContinuous && <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>دەنگێ قورئانخوێنی:</span>
                    <select
                      value={selectedReciter}
                      onChange={handleReciterChange}
                      className={`px-4 py-2 rounded-xl border outline-none transition-colors text-sm ${
                        isDarkMode 
                          ? 'bg-slate-900 border-slate-700 text-emerald-400 focus:border-emerald-500' 
                          : 'bg-white border-emerald-200 text-emerald-800 focus:ring-2 focus:ring-emerald-500'
                      }`}
                    >
                      <option value={7}>ميشاري العفاسي</option>
                      <option value={2}>عبد الباسط عبد الصمد</option>
                      <option value={3}>عبد الرحمن السديس</option>
                      <option value={4}>أبو بكر الشاطري</option>
                      <option value={6}>محمود خليل الحصري</option>
                      <option value={9}>محمد صديق المنشاوي</option>
                      <option value={10}>سعود الشريم</option>
                      <option value={11}>محمد الطبلاوي</option>
                      <option value={16}>سعد الغامدي</option>
                      <option value={67}>ياسر الدوسري</option>
                      <option value={68}>ناصر القطامي</option>
                      <option value={29}>ماهر المعيقلي</option>
                      <option value={71}>أحمد العجمي</option>
                      <option value={77}>فارس عباد</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {surahs.map((surah) => (
                    <button
                      key={surah.id}
                      onClick={() => loadContinuousSurah(surah)}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between group text-right ${
                        isDarkMode 
                          ? 'border-slate-700 hover:border-emerald-500 hover:bg-emerald-900/20 text-slate-300' 
                          : 'border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <span className={`block font-bold text-lg group-hover:text-emerald-500 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-800'}`}>{surah.name_arabic}</span>
                        <span className="text-xs text-slate-400">{surah.verses_count} ئایەت</span>
                      </div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm transition-colors ${
                        isDarkMode ? 'bg-slate-900 text-slate-500 group-hover:bg-emerald-900 group-hover:text-emerald-400' : 'bg-slate-100 text-slate-500 group-hover:bg-emerald-200 group-hover:text-emerald-700'
                      }`}>
                        {surah.id}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200/60'} rounded-3xl shadow-sm border overflow-hidden transition-colors`}>
                <div className={`p-6 md:p-8 border-b flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sticky top-0 z-10 backdrop-blur-md transition-colors ${
                  isDarkMode ? 'border-slate-700 bg-slate-800/80' : 'border-slate-100 bg-emerald-50/50'
                }`}>
                  <div>
                    <h2 className={`text-3xl font-bold font-serif ${isDarkMode ? 'text-emerald-400' : 'text-emerald-900'}`}>{continuousSurahObj.name_arabic}</h2>
                    <p className={`${isDarkMode ? 'text-emerald-500' : 'text-emerald-700'} mt-1`}>سورة {continuousSurahObj.name_arabic} - {continuousSurahObj.verses_count} ئایەت</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <span className={`text-sm font-medium whitespace-nowrap ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>دەنگێ قورئانخوێنی:</span>
                      <select
                        value={selectedReciter}
                        onChange={handleReciterChange}
                        className={`w-full sm:w-auto px-4 py-2 rounded-xl border outline-none transition-colors text-sm ${
                          isDarkMode 
                            ? 'bg-slate-900 border-slate-700 text-emerald-400 focus:border-emerald-500' 
                            : 'bg-white border-emerald-200 text-emerald-800 focus:ring-2 focus:ring-emerald-500'
                        }`}
                      >
                        <option value={7}>ميشاري العفاسي</option>
                        <option value={2}>عبد الباسط عبد الصمد</option>
                        <option value={3}>عبد الرحمن السديس</option>
                        <option value={4}>أبو بكر الشاطري</option>
                        <option value={6}>محمود خليل الحصري</option>
                        <option value={9}>محمد صديق المنشاوي</option>
                        <option value={10}>سعود الشريم</option>
                        <option value={11}>محمد الطبلاوي</option>
                        <option value={16}>سعد الغامدي</option>
                        <option value={67}>ياسر الدوسري</option>
                        <option value={68}>ناصر القطامي</option>
                        <option value={29}>ماهر المعيقلي</option>
                        <option value={71}>أحمد العجمي</option>
                        <option value={77}>فارس عباد</option>
                      </select>
                    </div>

                    <button onClick={() => {
                      setContinuousSurahObj(null);
                      setIsContinuousAudioPlaying(false);
                      setIsAutoScrolling(false);
                    }} className={`${isDarkMode ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-800'} font-medium whitespace-nowrap`}>
                      ڤەگەڕە بۆ لیستا سوورەتان
                    </button>
                  </div>
                </div>

                <div className="p-6 md:p-8 space-y-12">
                  {isLoadingContinuous ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                    </div>
                  ) : (
                    continuousVerses.map((verse, index) => {
                      const isPlayingThisVerse = index === continuousVerseIndex && isContinuousAudioPlaying;
                      return (
                        <div 
                          key={verse.id} 
                          id={`verse-card-${index}`}
                          onClick={() => {
                            setContinuousVerseIndex(index);
                            setIsContinuousAudioPlaying(true);
                          }}
                          className={`transition-all duration-500 rounded-3xl p-6 md:p-8 cursor-pointer border relative overflow-hidden ${
                            isPlayingThisVerse 
                              ? (isDarkMode 
                                  ? 'bg-emerald-950/60 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.25)] ring-2 ring-emerald-500/50 scale-[1.01]' 
                                  : 'bg-emerald-50/90 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-2 ring-emerald-500/30 scale-[1.01]') 
                              : (isDarkMode ? 'border-transparent bg-slate-800/40 hover:bg-slate-800/80 hover:border-slate-700/60' : 'border-transparent bg-white hover:bg-slate-50/50 hover:border-slate-200/50')
                          }`}
                        >
                          {isPlayingThisVerse && (
                            <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                              <span>نوکە دهێتە خواندن</span>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-y-6 gap-x-3 justify-start mb-2 text-right leading-loose" dir="rtl">
                            {verse.words?.map((word: any) => {
                              const hasAudio = !!word.audio_url && 
                                               word.char_type_name !== 'end' && 
                                               word.char_type_name !== 'stop' && 
                                               word.text_uthmani !== 'ۗ' && 
                                               word.text_uthmani !== 'ۖ' && 
                                               word.text_uthmani !== 'ج' && 
                                               word.text_uthmani !== 'ۛ' && 
                                               word.text_uthmani !== 'ۘ' && 
                                               word.text_uthmani !== 'ۙ' && 
                                               word.text_uthmani !== 'ۚ';
                              const isPlaying = playingWordId === word.id;
                              return (
                                <span 
                                  key={word.id}
                                  onClick={(e) => {
                                    if (hasAudio) {
                                      e.stopPropagation();
                                      const correctUrl = getCorrectWordAudioUrl(word, verse.words, verse.verse_key);
                                      playAudio(correctUrl, 'word', word.id);
                                    }
                                  }}
                                  className={`inline quran-text select-none transition-all duration-200 ${
                                    !showTajweed ? 'no-tajweed-colors' : ''
                                  } ${
                                    isDarkMode ? 'dark-mode-text' : ''
                                  } ${
                                    hasAudio 
                                      ? 'cursor-pointer hover:text-emerald-500 hover:bg-emerald-500/10 rounded px-1' 
                                      : ''
                                  } ${
                                    isPlaying 
                                      ? (isDarkMode ? 'bg-emerald-950 text-emerald-400 font-bold border-b-2 border-emerald-500' : 'bg-emerald-50 text-emerald-700 font-bold border-b-2 border-emerald-500') 
                                      : ''
                                  }`} 
                                  style={{ fontFamily: selectedFont, fontSize: `${fontSize}px` }}
                                  dangerouslySetInnerHTML={{ __html: cleanTajweed(showTajweed ? (word.text_uthmani_tajweed || word.text_uthmani) : word.text_uthmani) }}
                                  title={hasAudio ? "بۆ گوهداریکرنێ کلیک بکە" : undefined}
                                />
                              );
                            })}
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-emerald-500 text-emerald-600 text-sm font-bold mx-2">
                              {verse.verse_key.split(':')[1]}
                            </span>
                          </div>
                          <div className="flex justify-end">
                            <span className={`text-[10px] font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>ئایەتا {verse.verse_key}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Fixed Bottom Control Bar */}
            {continuousSurahObj && (
              <div className={`fixed bottom-0 left-0 right-0 border-t shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 p-4 backdrop-blur-lg transition-colors ${
                isDarkMode ? 'bg-slate-900/90 border-slate-700' : 'bg-white/90 border-slate-200'
              }`}>
                <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                  
                  {/* Audio Controls */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setIsContinuousAudioPlaying(!isContinuousAudioPlaying)}
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md transition-transform hover:scale-105 active:scale-95 ${isContinuousAudioPlaying ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                    >
                      {isContinuousAudioPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                    </button>
                    <div className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      {isContinuousAudioPlaying ? 'دەنگ کاردکەت...' : 'دەنگ ڕاوەستیایە'}
                    </div>
                  </div>

                  {/* Auto-scroll Controls */}
                  <div className={`flex items-center gap-4 flex-1 max-w-md w-full p-3 rounded-2xl border transition-colors ${
                    isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <button
                      onClick={() => setIsAutoScrolling(!isAutoScrolling)}
                      className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors whitespace-nowrap ${
                        isAutoScrolling 
                          ? (isDarkMode ? 'bg-emerald-900/40 text-emerald-400 border-emerald-800' : 'bg-emerald-100 text-emerald-700 border-emerald-200') 
                          : (isDarkMode ? 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-700' : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100')
                      }`}
                    >
                      {isAutoScrolling ? 'ڕاوەستاندنا لڤینێ' : 'لڤینا خۆکار'}
                    </button>
                    
                    <div className="flex-1 flex items-center gap-3" dir="ltr">
                      <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Very Slow</span>
                      <input 
                        type="range" 
                        min="1" 
                        max="50" 
                        value={autoScrollSpeed}
                        onChange={(e) => setAutoScrollSpeed(Number(e.target.value))}
                        className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer accent-emerald-600 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}
                      />
                      <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Fast</span>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export interface UploadResponse {
    success: boolean;
    kanji: string[];
    time: number;
    message?: string;
}

export interface KanjiItem {
    kanji: string;
    meaning?: string;
    onyomi?: string;
    kunyomi?: string;
    level?: string;
    remembered: number;
    failed: number;
}

export interface DisplayData {
    running: boolean;
    kanji?: string;
    level?: string;
    onyomi?: string;
    kunyomi?: string;
    meaning?: string;
}

export interface StatsData {
    total_kanji: number;
    total_shown: number;
    total_remembered: number;
    total_failed: number;
    accuracy: number;
    due_now: number;
    levels: Record<string, number>;
}

export interface ThemeColors {
    background?: number[];
    kanji?: number[];
    meaning?: number[];
    onyomi?: number[];
    kunyomi?: number[];
    top_bar?: number[];
    time?: number[] | null;
    divider?: number[] | null;
    music_playing?: number[] | null;
    music_paused?: number[] | null;
}

export interface Theme {
    name: string;
    colors?: ThemeColors;
    has_background_image?: boolean;
}

export interface ThemesData {
    themes: Theme[];
    active: string;
}

export interface LastfmConfig {
    api_key?: string;
    api_secret?: string;
    username?: string;
}

export interface RecentKanjiData {
    recent: KanjiItem[];
}

export interface LevelKanjiData {
    kanji: KanjiItem[];
}

export interface StrokeOrderItem {
    kanji?: string;
    svg_url?: string;
}

export interface KanjiDetailData {
    kanji: string;
    meaning?: string;
    onyomi?: string;
    kunyomi?: string;
    level?: string;
    shown: number;
    remembered: number;
    failed: number;
    due?: number | null;
}

export interface VocabItem {
    word: string;
    reading?: string;
    meaning?: string;
    levels?: string[];
    stroke_order?: StrokeOrderItem[];
}

export interface VocabData {
    vocabulary: VocabItem[];
    generated_at?: number;
    source_kanji_count?: number;
}

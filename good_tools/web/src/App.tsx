import { Suspense, lazy } from 'react';
import { Routes, Route, useParams, Link } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ToolShell } from './components/ToolShell';
import { HomePage } from './pages/HomePage';
import { getToolById } from './data/tools';
import { useTheme, useFavorites } from './hooks/usePreferences';

const TOOL_COMPONENTS: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  // General Tools (19)
  'char-map': lazy(() => import('./tools/CharMapTool')),
  'ascii-art': lazy(() => import('./tools/AsciiArtTool')),
  'gif-gen': lazy(() => import('./tools/GifGenTool')),
  'barcode-gen': lazy(() => import('./tools/BarcodeGenTool')),
  'web-editor': lazy(() => import('./tools/WebEditorTool')),
  'subtitle-conv': lazy(() => import('./tools/SubtitleConvTool')),
  'char-counter': lazy(() => import('./tools/CharCounterTool')),
  'eng-kor': lazy(() => import('./tools/EngKorTool')),
  'magic-eye': lazy(() => import('./tools/MagicEyeTool')),
  'tts': lazy(() => import('./tools/TtsTool')),
  'eml-viewer': lazy(() => import('./tools/EmlViewerTool')),
  'long-url': lazy(() => import('./tools/LongUrlTool')),
  'ip-info': lazy(() => import('./tools/IpInfoTool')),
  'lotto-gen': lazy(() => import('./tools/LottoGenTool')),
  'flashlight': lazy(() => import('./tools/FlashlightTool')),
  'postcode': lazy(() => import('./tools/PostcodeTool')),
  'barcode-scanner': lazy(() => import('./tools/BarcodeScannerTool')),
  'file-checksum': lazy(() => import('./tools/FileChecksumTool')),
  'stt': lazy(() => import('./tools/SttTool')),

  // Developer Tools (12)
  'html-codes': lazy(() => import('./tools/HtmlCodesTool')),
  'ascii-codes': lazy(() => import('./tools/AsciiCodesTool')),
  'color-picker': lazy(() => import('./tools/ColorPickerTool')),
  'img-to-url': lazy(() => import('./tools/ImgToUrlTool')),
  'code-diff': lazy(() => import('./tools/CodeDiffTool')),
  'code-beautify': lazy(() => import('./tools/CodeBeautifyTool')),
  'code-minify': lazy(() => import('./tools/CodeMinifyTool')),
  'encoder': lazy(() => import('./tools/EncoderTool')),
  'uuid-gen': lazy(() => import('./tools/UuidGenTool')),
  'key-code': lazy(() => import('./tools/KeyCodeTool')),
  'html-viewer': lazy(() => import('./tools/HtmlViewerTool')),
  'crypto-tool': lazy(() => import('./tools/CryptoTool')),

  // Feed Tools (1)
  'rss-reader': lazy(() => import('./tools/RssReaderTool')),
};

function ToolRoute({
  favorites,
  toggleFavorite,
}: {
  favorites: string[];
  toggleFavorite: (id: string) => void;
}) {
  const { id } = useParams<{ id: string }>();
  const tool = id ? getToolById(id) : undefined;
  const Component = id ? TOOL_COMPONENTS[id] : undefined;

  if (!tool || !Component) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-xl font-bold">도구를 찾을 수 없습니다</h2>
        <Link
          to="/"
          className="inline-block px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium"
        >
          대시보드로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <ToolShell
      tool={tool}
      isFavorite={favorites.includes(tool.id)}
      onToggleFavorite={() => toggleFavorite(tool.id)}
    >
      <Suspense
        fallback={
          <div className="py-16 text-center text-sm text-slate-400 animate-pulse">
            도구를 불러오는 중...
          </div>
        }
      >
        <Component />
      </Suspense>
    </ToolShell>
  );
}

export default function App() {
  const { theme, setTheme } = useTheme();
  const { favorites, toggleFavorite } = useFavorites();

  return (
    <Layout theme={theme} setTheme={setTheme} favorites={favorites}>
      <Routes>
        <Route
          path="/"
          element={<HomePage favorites={favorites} toggleFavorite={toggleFavorite} />}
        />
        <Route
          path="/tool/:id"
          element={<ToolRoute favorites={favorites} toggleFavorite={toggleFavorite} />}
        />
        <Route
          path="*"
          element={<HomePage favorites={favorites} toggleFavorite={toggleFavorite} />}
        />
      </Routes>
    </Layout>
  );
}

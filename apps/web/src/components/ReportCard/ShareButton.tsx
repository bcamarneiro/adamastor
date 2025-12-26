import { toPng } from 'html-to-image';
import { Check, Copy, Download, Share2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import type { DeputyDetail } from '../../lib/supabase';
import { ShareableCard } from './ShareableCard';

interface ShareButtonProps {
  deputy: DeputyDetail;
}

export function ShareButton({ deputy }: ShareButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const generateImage = async (): Promise<string | null> => {
    if (!cardRef.current) return null;

    try {
      setIsGenerating(true);
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 1,
        cacheBust: true,
      });
      return dataUrl;
    } catch (error) {
      console.error('Error generating image:', error);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    const text = `O deputado ${deputy.short_name} tem nota ${deputy.grade} no Report Card!`;
    const url = window.location.href;

    // Try Web Share API first (for mobile)
    if (navigator.share) {
      try {
        const imageUrl = await generateImage();
        if (imageUrl) {
          // Convert data URL to blob
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const file = new File([blob], `${deputy.short_name}-report-card.png`, {
            type: 'image/png',
          });

          await navigator.share({
            title: 'Report Card',
            text,
            url,
            files: [file],
          });
          return;
        }
      } catch (_err) {
        // If file sharing fails, try without file
        try {
          await navigator.share({ title: 'Report Card', text, url });
          return;
        } catch (_e) {
          // User cancelled or share not supported
        }
      }
    }

    // Fallback: show modal with options
    setShowModal(true);
  };

  const handleDownload = async () => {
    const imageUrl = await generateImage();
    if (imageUrl) {
      const link = document.createElement('a');
      link.download = `${deputy.short_name.replace(/\s+/g, '-')}-report-card.png`;
      link.href = imageUrl;
      link.click();
      setShowModal(false);
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button
        onClick={handleShare}
        disabled={isGenerating}
        className="inline-flex items-center gap-2 px-4 py-2 bg-accent-9 text-monochrome-white rounded-lg hover:bg-accent-10 transition-colors disabled:opacity-50"
      >
        <Share2 className="w-4 h-4" />
        <span>{isGenerating ? 'A gerar...' : 'Partilhar'}</span>
      </button>

      {/* Hidden shareable card for image generation */}
      <div className="fixed -left-[9999px] top-0 overflow-hidden">
        <ShareableCard ref={cardRef} deputy={deputy} />
      </div>

      {/* Share Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-12/50">
          <div className="bg-neutral-1 rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-12">Partilhar Report Card</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-neutral-9 hover:text-neutral-12 hover:bg-neutral-3 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleDownload}
                disabled={isGenerating}
                className="w-full flex items-center gap-3 p-4 bg-neutral-2 hover:bg-neutral-3 rounded-lg transition-colors text-left"
              >
                <Download className="w-5 h-5 text-accent-9" />
                <div>
                  <div className="font-medium text-neutral-12">Descarregar imagem</div>
                  <div className="text-sm text-neutral-11">
                    Guarda a imagem para partilhar nas redes sociais
                  </div>
                </div>
              </button>

              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-3 p-4 bg-neutral-2 hover:bg-neutral-3 rounded-lg transition-colors text-left"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-success-9" />
                ) : (
                  <Copy className="w-5 h-5 text-accent-9" />
                )}
                <div>
                  <div className="font-medium text-neutral-12">
                    {copied ? 'Link copiado!' : 'Copiar link'}
                  </div>
                  <div className="text-sm text-neutral-11">Partilha o link diretamente</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

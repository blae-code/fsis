import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { analyzeSalvageImage } from '@/functions/analyzeSalvageImage';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, ImageIcon, Sparkles } from 'lucide-react';

const border = { borderColor: 'hsl(33, 18%, 18%)' };

// Reusable uploader: pick image -> upload -> run AI vision/OCR analysis.
// Calls onResult(result) with the structured analysis.
export default function ScanUploader({ scanType, hint, onResult }) {
  const [preview, setPreview] = useState(null);
  const [stage, setStage] = useState('idle'); // idle | uploading | analyzing
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setError(null);
    setPreview(URL.createObjectURL(file));
    try {
      setStage('uploading');
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setStage('analyzing');
      const res = await analyzeSalvageImage({ image_url: file_url, scan_type: scanType });
      onResult?.(res.data);
      setStage('idle');
    } catch (e) {
      setError(e?.message || 'Analysis failed');
      setStage('idle');
    }
  };

  const busy = stage !== 'idle';

  return (
    <div className="space-y-3">
      <div
        onClick={() => !busy && inputRef.current?.click()}
        className="rounded border-2 border-dashed p-6 text-center cursor-pointer transition-colors hover:bg-white/5"
        style={border}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {preview ? (
          <img src={preview} alt="scan preview" className="max-h-40 mx-auto rounded mb-3 object-contain" />
        ) : (
          <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        )}

        {busy ? (
          <div className="flex items-center justify-center gap-2 text-xs font-mono text-primary">
            <Loader2 className="w-4 h-4 animate-spin" />
            {stage === 'uploading' ? 'Uploading screenshot…' : 'AI analyzing screen…'}
          </div>
        ) : (
          <>
            <p className="text-xs font-mono text-foreground flex items-center justify-center gap-1.5">
              <Upload className="w-3.5 h-3.5" /> Drop / click to upload a screenshot
            </p>
            {hint && <p className="text-[10px] font-mono text-muted-foreground mt-1">{hint}</p>}
          </>
        )}
      </div>

      {error && (
        <p className="text-[10px] font-mono text-destructive text-center">{error}</p>
      )}

      {!busy && preview && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <Button
            onClick={() => inputRef.current?.click()}
            variant="outline"
            size="sm"
            className="h-7 text-[10px] font-mono gap-1.5"
            style={border}
          >
            <Sparkles className="w-3 h-3" /> Scan another
          </Button>
        </motion.div>
      )}
    </div>
  );
}